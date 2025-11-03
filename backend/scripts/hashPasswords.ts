import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { prisma, testConnection } from '../config/db.js';

dotenv.config();

const testUsers = [
  { email: 'admin@admin.com', password: '111', role: 'admin' as const },
  { email: 'john@john.com', password: '123', role: 'user' as const }
];

async function hashPasswords(): Promise<void> {
  try {
    await testConnection();
    
    console.log('Hashing passwords for test users...\n');
    
    for (const user of testUsers) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email }
      });
      
      if (existingUser) {
        await prisma.user.update({
          where: { email: user.email },
          data: {
            password_hash: passwordHash,
            role: user.role
          }
        });
        console.log(`Updated password for: ${user.email}`);
      } else {
        await prisma.user.create({
          data: {
            email: user.email,
            password_hash: passwordHash,
            role: user.role
          }
        });
        console.log(`Created user: ${user.email}`);
      }
    }
    
    console.log('\nAll passwords hashed successfully!');
    console.log('\nTest credentials:');
    console.log('  Admin: admin@admin.com / 111');
    console.log('  User:  john / 123\n');
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

hashPasswords();

