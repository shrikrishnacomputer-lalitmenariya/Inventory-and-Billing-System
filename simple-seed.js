require('dotenv').config();
console.log('Environment loaded');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  try {
    const adapter = new PrismaNeon(new Pool({ connectionString: process.env.DATABASE_URL }));
    const prisma = new PrismaClient({ adapter });

    // Test basic connection
    console.log('Testing database connection...');
    await prisma.$queryRaw`SELECT 1 as test, version() as version`;
    console.log('✅ Database connection successful!');

    // Test a simple query
    console.log('Testing simple query...');
    const result = await prisma.$queryRaw`SELECT COUNT(*) as userCount FROM users`;
    console.log('Users count:', result);

    await prisma.$disconnect();
    console.log('✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);