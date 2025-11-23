import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

// Prisma 7: Use adapter for PostgreSQL connection
// For Prisma 7, adapter is optional but recommended for connection pooling
let prisma: PrismaClient;

if (process.env.DATABASE_URL) {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } catch (error) {
    console.error('Failed to create Prisma client with adapter, falling back to direct connection:', error);
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
} else {
  // Fallback if DATABASE_URL is not set
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export { prisma };

// Test connection
export async function testConnection(retries = 3, delay = 1000): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT NOW()`;
      console.log('Database connected successfully (Prisma)');
      return true;
    } catch (error) {
      const err = error as Error;
      if (i === retries - 1) {
        console.error('Database connection failed after retries:', err.message);
        throw err;
      }
      console.log(`Connection attempt ${i + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('Database connection closed');
  } catch (error) {
    const err = error as Error;
    console.error('Error closing database connection:', err);
  }
}

// Handle process termination
process.on('beforeExit', async () => {
  await closePool();
});

export default prisma;

