#!/usr/bin/env node --experimental-loader esbuild-register

  const fs = require('fs');
  const path = require('path');

  const sessionDir = process.env.WHATSAPP_SESSION_DIR || path.join(process.cwd(),        
  'whatsapp-sessions');

  console.log('🔍 WhatsApp Production Health Check');

  const health = {
    sessionDir: sessionDir,
    exists: fs.existsSync(sessionDir),
    isDirectory: fs.existsSync(sessionDir) && fs.statSync(sessionDir).isDirectory(),     
    connectionActive: process.env.WHATSAPP_CONNECTION_ACTIVE === 'true' ||
  global._whatsappConnectionActive || false,
    files: [],
    qrAvailable: false,
    environment: process.env.NODE_ENV,
    sessionFiles: []
  };

  try {
    if (health.isDirectory()) {
      health.files = fs.readdirSync(sessionDir);

      // Check for QR code files
      const qrFiles = health.files.filter(file =>
        file.includes('qr-') ||
        file.includes('temp-QR') ||
        file.includes('qrCode') ||
        health.files.includes('creds.json')
      );

      health.qrAvailable = qrFiles.length > 0;
      health.sessionFiles = health.files;

      if (qrFiles.length > 0) {
        console.log(`📱 Found QR code files: ${qrFiles.join(', ')}`);
        // Show first QR file content (first 100 chars)
        const firstQR = fs.readFileSync(path.join(sessionDir, qrFiles[0]), 'utf8');      
        console.log('🔗 Sample QR Code:', firstQR.substring(0, 100) + '...');
      }
    } else {
      health.errors = health.errors || [];
      health.errors.push('Session directory does not exist or is not a directory');      
    }
  } catch (error) {
    health.errors = health.errors || [];
    health.errors.push(`Directory check failed: ${error.message}`);
  }

  console.log('\n📊 Health Check Results:');
  console.log(JSON.stringify(health, null, 2));

  if (health.errors?.length > 0) {
    console.error('\n❌ Health check failed:');
    health.errors.forEach(error => console.error('   -', error));
    process.exit(1);
  } else {
    console.log('\n✅ WhatsApp daemon appears healthy');
    process.exit(0);
  }