import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

// Configure Neon for serverless/edge environments
const { neonConfig } = require('@neondatabase/serverless')
neonConfig.webSocketConstructor = false // Use HTTP fetch instead of WebSocket on Vercel

// 1. Add a safeguard to catch the missing variable immediately
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in your environment variables.')
}

// 2. Initialize adapter directly with connection string (new Prisma 6.x API)
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma