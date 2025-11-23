import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// Prisma 7: Connection is handled via prisma.config.ts
// Adapter is optional - using direct connection for simplicity
// The DATABASE_URL is read from prisma.config.ts automatically
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

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

