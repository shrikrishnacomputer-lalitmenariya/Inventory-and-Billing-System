import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  WASocket
} from '@whiskeysockets/baileys';
import { prisma } from './prisma';
import path from 'path';
import fs from 'fs';
import pino from 'pino';

// Save session info outside of Next.js workspace to prevent HMR dev-server reloads
const sessionDir = path.join(process.cwd(), '..', 'session_auth_info');

// Files essential for maintaining the WhatsApp connection — everything else is history junk
const ESSENTIAL_SESSION_FILES = ['creds.json'];
const ESSENTIAL_PREFIXES = ['pre-key-', 'sender-key-', 'session-', 'app-state-sync'];

let socketInstance: WASocket | null = null;
let connectionActive = false;

/**
 * Purge non-essential files from session folder (chat history, device lists, LID mappings, etc.)
 * Keeps only credential and encryption key files needed to maintain the connection.
 */
function purgeSessionJunk() {
  if (!fs.existsSync(sessionDir)) return;

  const files = fs.readdirSync(sessionDir);
  let purgedCount = 0;

  for (const file of files) {
    const isEssential =
      ESSENTIAL_SESSION_FILES.includes(file) ||
      ESSENTIAL_PREFIXES.some((prefix) => file.startsWith(prefix));

    if (!isEssential) {
      try {
        fs.unlinkSync(path.join(sessionDir, file));
        purgedCount++;
      } catch {
        // skip locked files
      }
    }
  }

  if (purgedCount > 0) {
    console.log(`[WhatsApp] 🧹 Purged ${purgedCount} unnecessary session files (history, contacts, etc.)`);
  }
}

export async function getWhatsappClient() {
  if (socketInstance && connectionActive) {
    return socketInstance;
  }
  return null;
}

export async function initWhatsappSocket() {
  if (socketInstance) {
    return socketInstance;
  }

  // Ensure settings exist
  let settings = await prisma.whatsappSettings.findFirst();
  if (!settings) {
    settings = await prisma.whatsappSettings.create({
      data: { ownerPhone: "6375591682", status: "disconnected" }
    });
  }

  await prisma.whatsappSettings.update({
    where: { id: settings.id },
    data: { status: "connecting", qrCode: null }
  });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    defaultQueryTimeoutMs: undefined,
    logger: pino({ level: 'silent' }),
    // Don't download or sync chat history — we only send invoices
    shouldSyncHistoryMessage: () => false,
    fireInitQueries: false,
    markOnlineOnConnect: false,
  });

  socketInstance = sock;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('[WhatsApp] 📱 New QR code ready — scan it from your phone.');
      await prisma.whatsappSettings.update({
        where: { id: settings.id },
        data: { status: "connecting", qrCode: qr }
      });
    }

    if (connection === 'open') {
      console.log('[WhatsApp] ✅ Connected successfully.');
      connectionActive = true;
      await prisma.whatsappSettings.update({
        where: { id: settings.id },
        data: { status: "connected", qrCode: null }
      });

      // Clean up any history junk that got written during handshake
      setTimeout(purgeSessionJunk, 3000);
    }

    if (connection === 'close') {
      connectionActive = false;
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`[WhatsApp] ❌ Disconnected (code ${statusCode}). ${shouldReconnect ? 'Reconnecting in 5s...' : 'Logged out — session cleared.'}`);

      if (!shouldReconnect) {
        socketInstance = null;
        await prisma.whatsappSettings.update({
          where: { id: settings.id },
          data: { status: "disconnected", qrCode: null }
        });
        // Full wipe on logout
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
          console.log('[WhatsApp] 🗑️ Session folder cleared.');
        } catch {
          // silently ignore
        }
      } else {
        // Purge junk before reconnecting
        purgeSessionJunk();
        setTimeout(() => {
          socketInstance = null;
          initWhatsappSocket();
        }, 5000);
      }
    }
  });

  return sock;
}

export async function disconnectWhatsapp() {
  const settings = await prisma.whatsappSettings.findFirst();
  if (socketInstance) {
    try {
      await socketInstance.logout();
    } catch {
      // ignore logout errors
    }
    socketInstance = null;
  }
  connectionActive = false;
  
  if (settings) {
    await prisma.whatsappSettings.update({
      where: { id: settings.id },
      data: { status: "disconnected", qrCode: null }
    });
  }

  // Full wipe on manual disconnect
  try {
    fs.rmSync(sessionDir, { recursive: true, force: true });
    console.log('[WhatsApp] 🗑️ Session folder cleared on disconnect.');
  } catch {
    // silently ignore
  }
}

export async function sendWhatsappMessage(
  to: string, 
  text: string, 
  pdfPath?: string, 
  fileName?: string
) {
  // Format mobile number to JID: e.g. 916375591682@s.whatsapp.net
  let formattedNumber = to.replace(/[^0-9]/g, "");
  if (!formattedNumber.startsWith("91") && formattedNumber.length === 10) {
    formattedNumber = "91" + formattedNumber;
  }
  const jid = `${formattedNumber}@s.whatsapp.net`;

  let client = socketInstance;
  if (!client || !connectionActive) {
    client = await initWhatsappSocket();
  }

  // Wait a moment if connecting
  let attempts = 0;
  while (!connectionActive && attempts < 10) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    attempts++;
  }

  if (!connectionActive || !client) {
    throw new Error("WhatsApp device is not paired/connected.");
  }

  if (pdfPath) {
    const absolutePath = path.join(process.cwd(), "public", pdfPath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`PDF file not found at path: ${absolutePath}`);
    }

    await client.sendMessage(jid, {
      document: { url: absolutePath },
      fileName: fileName || "invoice.pdf",
      mimetype: "application/pdf",
      caption: text
    });
  } else {
    await client.sendMessage(jid, { text });
  }

  console.log(`[WhatsApp] 📤 Invoice sent to ${formattedNumber}`);
}
