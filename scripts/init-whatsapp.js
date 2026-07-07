#!/usr/bin/env node --experimental-loader esbuild-register

const path = require('path');
const fs = require('fs');

// Configuration from environment
const sessionDir = process.env.WHATSAPP_SESSION_DIR || path.join(process.cwd(), 'whatsapp-sessions');

console.log('🚀 Initializing WhatsApp daemon for production...');

// Ensure session directory exists
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true, mode: 0o700 });
  console.log(`📁 Created WhatsApp session directory: ${sessionDir}`);
}

// Initialize WhatsApp daemon
const { initWhatsappSocket } = require('../lib/whatsapp-daemon');

async function main() {
  try {
    console.log('📱 Initializing WhatsApp daemon...');
    await initWhatsappSocket();

    // Verify it's working
    setTimeout(async () => {
      if (global._whatsappSocket && global._whatsappConnectionActive) {
        console.log('✅ WhatsApp daemon initialized successfully!');
        console.log('📱 QR code is available at: http://localhost:3000/api/v1/whatsapp/settings');

        // Show session info
        const files = fs.readdirSync(sessionDir);
        console.log(`📁 Session files: ${files.join(', ')}`);

      } else {
        console.log('❌ WhatsApp daemon is not running');
        console.log('🔄 Trying to reconnect...');
        setTimeout(main, 10000); // Retry in 10 seconds
      }
    }, 3000);

  } catch (error) {
    console.error('❌ WhatsApp initialization failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);