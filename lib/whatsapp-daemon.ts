import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  WASocket
} from '@whiskeysockets/baileys';
import { prisma } from './prisma';
import path from 'path';
import fs from 'fs';
import pino from 'pino';

// Production session directory with fallback strategy
const getSessionDir = () => {
  // Check environment variable first
  if (process.env.WHATSAPP_SESSION_DIR) {
    return process.env.WHATSAPP_SESSION_DIR;
  }

  // Vercel production paths
  if (process.env.VERCEL) {
    // Vercel environment
    return '/workspace/whatsapp-sessions';
  }

  // Local development fallback
  return path.join(process.cwd(), 'whatsapp-sessions');
};

const sessionDir = getSessionDir();

// Production monitoring logger
const logger = pino({
  level: process.env.WHATSAPP_LOG_LEVEL || 'info',
  // Simplified transport configuration for production
});

// Production initialization state
let isInitializing = false;
let initializationRetries = 0;
const MAX_RETRIES = parseInt(process.env.WHATSAPP_MAX_RETRIES || '3');
const TIMEOUT_MS = parseInt(process.env.WHATSAPP_TIMEOUT || '60000');

// Global state
let globalWhatsappSocket: WASocket | null = null;
let globalConnectionActive = false;
let cachedWaVersion: any = null;

export async function initWhatsappSocket(force = false) {
  // Prevent multiple simultaneous initializations
  if (isInitializing && !force) {
    console.log('[Production] WhatsApp initialization already in progress...');
    return globalWhatsappSocket;
  }

  isInitializing = true;

  try {
    console.log(`[Production] Initializing WhatsApp daemon (attempt ${initializationRetries + 1}/${MAX_RETRIES})...`);

    // Production environment validation
    if (process.env.NODE_ENV === 'production') {
      console.log('[Production] Setting up production WhatsApp configuration...');

      // Ensure session directory exists with proper permissions
      if (!fs.existsSync(sessionDir)) {
        console.log(`[Production] Creating WhatsApp session directory: ${sessionDir}`);
        fs.mkdirSync(sessionDir, { recursive: true, mode: 0o700 });
      } else {
        // Check directory is writable
        const testFile = path.join(sessionDir, '.write-test');
        try {
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
          console.log(`[Production] Session directory is writable: ${sessionDir}`);
        } catch (writeError: any) {
          throw new Error(`Session directory is not writable: ${writeError.message}`);
        }
      }
    }

    // Check if settings exist, create if not
    let settings = await prisma.whatsappSettings.findFirst();
    if (!settings) {
      console.log('[Production] Creating default WhatsApp settings...');
      settings = await prisma.whatsappSettings.create({
        data: {
          ownerPhone: "9928203203",
          status: "disconnected",
          simulateFailures: process.env.WHATSAPP_SIMULATE_FAILURES === 'true' || false,
          simulateSessionError: process.env.WHATSAPP_SIMULATE_SESSION_ERROR === 'true' || false
        }
      });
    }

    // ── Dead-man's switch ────────────────────────────────────────────────────
    // Before writing 'connecting', re-read the DB. If it was manually reset to
    // 'disconnected' while we were starting up, abort immediately so we don't
    // overwrite the manual reset (kills zombie Vercel instances).
    const freshCheck = await prisma.whatsappSettings.findFirst({ where: { id: settings.id } });
    if (freshCheck?.status === 'disconnected') {
      console.log('[Daemon] DB was reset to disconnected externally. Aborting daemon startup.');
      isInitializing = false;
      return null;
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Update settings to connecting state
    await prisma.whatsappSettings.update({
      where: { id: settings.id },
      data: { status: "connecting", qrCode: null }
    });

    // Enhanced auth state configuration for production
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    let versionToUse = cachedWaVersion;
    if (!versionToUse) {
      const { version, isLatest } = await fetchLatestBaileysVersion();
      console.log(`[Production] using WA v${version.join('.')}, isLatest: ${isLatest}`);
      cachedWaVersion = version;
      versionToUse = version;
    } else {
      console.log(`[Production] using cached WA v${versionToUse.join('.')}`);
    }

    const sock = makeWASocket({
      version: versionToUse,
      auth: state,
      browser: Browsers.ubuntu('Chrome'),
      printQRInTerminal: true,
      defaultQueryTimeoutMs: TIMEOUT_MS,
      logger: logger,
      fireInitQueries: true,
      markOnlineOnConnect: false,
    });

    // Save to global
    globalWhatsappSocket = sock;
    globalConnectionActive = false;

    // Enhanced event handling for production
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      console.log(`[Production] WhatsApp connection update: ${connection}`);

      if (qr) {
        console.log('📱 [Production] New QR code generated!');

        // Dead-man's switch: if DB was manually reset to disconnected, abort
        const currentStatus = await prisma.whatsappSettings.findFirst({ where: { id: settings.id } });
        if (currentStatus?.status === 'disconnected') {
          console.log('[Daemon] DB reset detected during QR generation. Closing socket.');
          try { sock.end(undefined); } catch (e) { /* ignore */ }
          globalWhatsappSocket = null;
          return;
        }

        // Save QR to file for debugging
        const qrFile = path.join(sessionDir, `qr-${Date.now()}.txt`);
        fs.writeFileSync(qrFile, qr);
        console.log(`💾 [Production] QR code saved to: ${qrFile}`);

        await prisma.whatsappSettings.update({
          where: { id: settings.id },
          data: { status: "connecting", qrCode: qr }
        });
      }

      if (connection === 'open') {
        console.log('✅ [Production] WhatsApp connected successfully!');
        globalConnectionActive = true;

        await prisma.whatsappSettings.update({
          where: { id: settings.id },
          data: { status: "connected", qrCode: null }
        });
      }

      if (connection === 'close') {
        globalConnectionActive = false;
        globalWhatsappSocket = null;
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;

        console.log(`[Local Daemon] WhatsApp disconnected (code: ${statusCode}). Resetting DB to disconnected.`);

        // Reset DB to disconnected — no auto-reconnect.
        // In local dev, just click Connect again on the dashboard.
        await prisma.whatsappSettings.update({
          where: { id: settings.id },
          data: { status: "disconnected", qrCode: null }
        }).catch(() => {}); // ignore DB errors on cleanup
      }
    });

    isInitializing = false;
    initializationRetries = 0;

    console.log('✅ [Production] WhatsApp daemon initialized successfully!');
    return sock;

  } catch (error: any) {
    isInitializing = false;

    console.error(`❌ [Local Daemon] WhatsApp initialization failed:`, error);

    // Reset DB to disconnected on failure — no auto-retry.
    // In local dev, just click Connect again on the dashboard.
    try {
      const s = await prisma.whatsappSettings.findFirst();
      if (s) {
        await prisma.whatsappSettings.update({
          where: { id: s.id },
          data: { status: "disconnected", qrCode: null }
        });
      }
    } catch { /* ignore */ }

    throw error;
  }
}

// Production logging function
async function logProductionEvent(eventType: string, eventData: any) {
  try {
    await prisma.whatsappAuditLog.create({
      data: {
        billId: 0,
        billNumber: 'SYSTEM',
        event: eventType,
        details: JSON.stringify({
          ...eventData,
          environment: process.env.NODE_ENV || 'production',
          sessionDir,
          timestamp: new Date().toISOString(),
          nodeEnv: process.env.NODE_ENV
        })
      }
    });
  } catch (logError: any) {
    console.error('[Production] Failed to log event:', logError);
  }
}

export async function disconnectWhatsapp() {
  if (globalWhatsappSocket) {
    try {
      await globalWhatsappSocket.logout();
    } catch (e) {
      console.error('Error during logout:', e);
    }
    globalWhatsappSocket = null;
    globalConnectionActive = false;
  }

  const settings = await prisma.whatsappSettings.findFirst();
  if (settings) {
    await prisma.whatsappSettings.update({
      where: { id: settings.id },
      data: { status: 'disconnected', qrCode: null }
    });
  }

  if (fs.existsSync(sessionDir)) {
    fs.rmSync(sessionDir, { recursive: true, force: true });
    fs.mkdirSync(sessionDir, { recursive: true });
  }
}

export async function sendWhatsappMessage(
  phone: string, 
  text: string, 
  pdfPath?: string, 
  pdfFilename?: string, 
  pdfBase64?: string
) {
  if (!globalWhatsappSocket) {
    throw new Error('WhatsApp is not connected');
  }

  let jid = phone.replace(/[^0-9]/g, '');
  if (jid.length === 10) {
    jid = '91' + jid;
  }
  jid = jid + '@s.whatsapp.net';

  if ((pdfPath || pdfBase64) && pdfFilename) {
    let pdfBuffer: Buffer | null = null;
    
    if (pdfBase64) {
      pdfBuffer = Buffer.from(pdfBase64, 'base64');
    } else if (pdfPath?.startsWith('http')) {
      const response = await fetch(pdfPath);
      pdfBuffer = Buffer.from(await response.arrayBuffer());
    } else if (pdfPath) {
      const fullPath = path.resolve(process.cwd(), 'public', pdfPath);
      if (fs.existsSync(fullPath)) {
        pdfBuffer = fs.readFileSync(fullPath);
      }
    }

    if (pdfBuffer) {
      await globalWhatsappSocket.sendMessage(jid, {
        document: pdfBuffer,
        mimetype: 'application/pdf',
        fileName: pdfFilename,
        caption: text // Add text as caption to the PDF
      });
      console.log(`✅ Local daemon message sent to ${phone} (with PDF)`);
      return; // Exit early since text was sent as caption
    }
  }
  
  // Fallback: Send text only if no PDF was provided or buffer failed
  await globalWhatsappSocket.sendMessage(jid, { text });
  console.log(`✅ Local daemon message sent to ${phone} (text only)`);
}

export { globalWhatsappSocket, globalConnectionActive };