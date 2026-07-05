require('dotenv').config();
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
neonConfig.webSocketConstructor = ws;
async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Reading neon_init.sql...');
  let sql = fs.readFileSync('neon_init.sql', 'utf8');
  
  const statements = sql
    .replace(/--.*$/gm, '') 
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Executing ${statements.length} queries via Prisma HTTP adapter...`);
  
  try {
    for (let i = 0; i < statements.length; i++) {
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      await prisma.$executeRawUnsafe(statements[i]);
    }
    console.log('✅ Success! All tables have been created automatically on Neon.');
  } catch (err) {
    console.error('❌ Failed to create tables:', err.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
