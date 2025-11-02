import { testConnection, closePool } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function test(): Promise<void> {
  try {
    console.log('🔌 Testing database connection...\n');
    
    await testConnection();
    
    console.log('\n✅ Connection test passed!');
    console.log('📊 Your database is ready to use.\n');
    
    await closePool();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection test failed!');
    console.error('\nTroubleshooting:');
    console.error('1. Check your .env file has DATABASE_URL set');
    console.error('2. Verify your Neon database is running');
    console.error('3. Check your connection string format');
    console.error('\nError:', (error as Error).message);
    process.exit(1);
  }
}

test();

