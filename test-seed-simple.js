require('dotenv').config();
const fs = require('fs');
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');
require('@neondatabase/serverless').neonConfig.webSocketConstructor = ws;

async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);

  if (!process.env.DATABASE_URL) {
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
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Check if we can connect
    const result = await pool.query('SELECT 1 as test, version() as neon_version');
    console.log('Database connection successful:', result.rows[0]);

    // Test creating a simple table
    await pool.query('CREATE TABLE IF NOT EXISTS test_table (id SERIAL PRIMARY KEY, name VARCHAR(255))');
    console.log('Created test_table successfully');

    // Drop the test table
    await pool.query('DROP TABLE test_table');
    console.log('Dropped test_table successfully');

    console.log('✅ Success! Database connection and basic SQL operations work.');
  } catch (err) {
    console.error('❌ Database test failed:', err);
  } finally {
    await pool.end();
  }
}

main();