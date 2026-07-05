const fs = require('fs');
const { Pool } = require('@neondatabase/serverless');
require('dotenv').config();

async function main() {
  console.log('Reading database URL from .env...');
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('Error: DATABASE_URL is not set in .env');
    process.exit(1);
  }

  console.log('Reading neon_init.sql...');
  let sql = fs.readFileSync('neon_init.sql', 'utf8');
  
  // Clean up the SQL (remove comments and empty lines)
  // Split by semicolon to get individual statements
  const statements = sql
    .replace(/--.*$/gm, '') // remove SQL comments
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Connecting to Neon... found ${statements.length} queries to run.`);
  const pool = new Pool({ connectionString });
  
  try {
    for (let i = 0; i < statements.length; i++) {
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      await pool.query(statements[i]);
    }
    console.log('✅ Success! All tables have been created automatically on Neon.');
  } catch (err) {
    console.error('❌ Failed to create tables:', err);
  } finally {
    await pool.end();
  }
}

main();
