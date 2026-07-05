const bcrypt = require('bcryptjs');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function createAdmin() {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL missing');
    return;
  }
  connectionString = connectionString.replace('-pooler', '');

  const sql = neon(connectionString);
  
  try {
    console.log('Hashing password...');
    const adminPasswordHash = await bcrypt.hash('password123', 10);
    const staffPasswordHash = await bcrypt.hash('password123', 10);

    console.log('Inserting Owner...');
    await sql`
      INSERT INTO "User" (name, username, password_hash, role) 
      VALUES ('Owner', 'admin', ${adminPasswordHash}, 'owner')
      ON CONFLICT (username) DO UPDATE SET password_hash = ${adminPasswordHash};
    `;

    console.log('Inserting Staff...');
    await sql`
      INSERT INTO "User" (name, username, password_hash, role) 
      VALUES ('Staff', 'staff', ${staffPasswordHash}, 'staff')
      ON CONFLICT (username) DO UPDATE SET password_hash = ${staffPasswordHash};
    `;

    console.log('✅ Default users created successfully! You can now log in.');
  } catch(err) {
    console.error('❌ Failed to insert users:', err.message);
  }
}

createAdmin();
