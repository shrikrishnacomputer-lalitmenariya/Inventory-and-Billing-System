require('dotenv').config();
console.log('Environment loaded');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Test Neon's connection parsing directly
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
neonConfig.webSocketConstructor = ws;

async function testNeonDirectly() {
  console.log('\n=== Testing Neon Connection Directly ===');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Parse the connection string to see what we're working with
  const url = new URL(connectionString);
  console.log('Parsed URL:');
  console.log('  Host:', url.hostname);
  console.log('  Port:', url.port);
  console.log('  Pathname:', url.pathname);
  console.log('  Protocol:', url.protocol);
  console.log('  Search:', url.search);
  console.log('  Username:', url.username);
  console.log('  Password:', '***');

  const pool = new Pool({
    connectionString: connectionString,
    // Keep minimal options
    max: 1,
    ssl: false, // Disable SSL for testing
    // Add connection timeout
    connectionTimeoutMillis: 5000,
    // Add statement_timeout
    statementTimeoutMillis: 60000,
  });

  try {
    console.log('\n=== Attempting to connect with Pool ===');
    const client = await pool.connect();
    console.log('✅ Pool connection successful!');

    const result = await client.query('SELECT 1 as test, version() as version');
    console.log('Query result:', result.rows[0]);

    await client.release();
    await pool.end();
    console.log('✅ Pool test completed successfully!');

    return true;
  } catch (error) {
    console.error('❌ Pool connection failed:', error);

    try {
      await pool.end();
    } catch (closeError) {
      console.log('Pool close error:', closeError);
    }
    throw error;
  }
}

testNeonDirectly().catch(console.error);