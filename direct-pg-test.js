require('dotenv').config();
console.log('Environment loaded');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Test with node-postgres (pg) - the standard PostgreSQL client
const { Pool } = require('pg');

async function testWithPostgres() {
  console.log('\n=== Testing with Node-Postgres (pg) ===');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Remove sslmode=require and other connection parameters for pg
  const cleanConnectionString = connectionString.split('?')[0];
  console.log('Cleaned connection string:', cleanConnectionString);

  const pool = new Pool({
    connectionString: cleanConnectionString,
    max: 1,
    connectionTimeoutMillis: 15000,
    statementTimeout: 120000,
  });

  try {
    console.log('Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Pool connection successful!');

    const result = await client.query('SELECT 1 as test, version() as version');
    console.log('Query result:', result.rows[0]);

    await client.release();
    await pool.end();
    console.log('✅ Test completed successfully!');

    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error);

    try {
      await pool.end();
    } catch (closeError) {
      console.log('Pool close error:', closeError);
    }
    throw error;
  }
}

testWithPostgres().catch(console.error);