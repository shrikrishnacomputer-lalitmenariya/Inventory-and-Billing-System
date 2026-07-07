import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
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

    // Update settings to connecting state
    await prisma.whatsappSettings.update({
      where: { id: settings.id },
      data: { status: "connecting", qrCode: null }
    });

    // Enhanced auth state configuration for production
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    // Enhanced socket configuration for production
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      defaultQueryTimeoutMs: TIMEOUT_MS,
      logger: logger,
      shouldSyncHistoryMessage: () => false,
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
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`[Production] WhatsApp disconnected (code: ${statusCode}). ${shouldReconnect ? 'Reconnecting...' : 'Session ended.'}`);

        if (!shouldReconnect) {
          globalWhatsappSocket = null;
        } else {
          // Auto-reconnect with exponential backoff for production
          const backoffDelay = Math.min(5000 * Math.pow(2, initializationRetries), 300000);
          console.log(`[Production] Reconnecting in ${backoffDelay / 1000} seconds...`);

          setTimeout(() => {
            initializationRetries++;
            initWhatsappSocket(true).catch(err => {
              console.error('[Production] Reconnection failed:', err);
            });
          }, backoffDelay);
        }
      }
    });

    isInitializing = false;
    initializationRetries = 0;

    console.log('✅ [Production] WhatsApp daemon initialized successfully!');
    return sock;

  } catch (error: any) {
    isInitializing = false;
    initializationRetries++;

    console.error(`❌ [Production] WhatsApp initialization attempt ${initializationRetries} failed:`, error);

    if (initializationRetries >= MAX_RETRIES) {
      throw new Error(`Failed to initialize WhatsApp after ${MAX_RETRIES} attempts: ${error}`);
    }

    const backoffDelay = Math.min(2000 * Math.pow(2, initializationRetries - 1), 30000);
    console.log(`[Production] Retrying in ${backoffDelay / 1000} seconds...`);

    setTimeout(() => {
      initWhatsappSocket().catch(err => {
        console.error('[Production] WhatsApp initialization failed permanently:', err);
      });
    }, backoffDelay);

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

  await globalWhatsappSocket.sendMessage(jid, { text });

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
      });
    }
  }
  console.log(`✅ Local daemon message sent to ${phone}`);
}

export { globalWhatsappSocket, globalConnectionActive };