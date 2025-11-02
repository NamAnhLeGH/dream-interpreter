/**
 * Test script for API endpoints
 * Run after starting the server: npm run dev
 * Usage: tsx scripts/testAPI.ts
 */

import { prisma } from '../config/db.js';

const API_BASE = 'http://localhost:3000/api';
let authToken = '';
let createdTestUserId: number | null = null;

// Test credentials from hashPasswords.ts
const testUsers = {
  admin: { email: 'admin', password: '111' },
  user: { email: 'john', password: '123' }
};

// Helper to make API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  // Health check is at root, not /api
  const baseUrl = endpoint.startsWith('/health') 
    ? 'http://localhost:3000' 
    : API_BASE;
  const url = `${baseUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
    ...options.headers
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json() as any;
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: (error as Error).message };
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n📡 Testing Health Check...');
  const result = await apiCall('/health');
  console.log(`Status: ${result.status}`);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.status === 200;
}

async function testRegister() {
  console.log('\n📝 Testing Registration...');
  // Username must be alphanumeric with underscores/hyphens (no email format)
  const randomUsername = `testuser${Date.now()}`;
  const result = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: randomUsername,
      password: 'test123'
    })
  });
  console.log(`Status: ${result.status}`);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  if (result.status === 201 && result.data.userId) {
    createdTestUserId = result.data.userId;
  }
  return result.status === 201;
}

async function testLogin(userType: 'admin' | 'user' = 'user') {
  console.log(`\n🔐 Testing Login (${userType})...`);
  const user = testUsers[userType];
  const result = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: user.email,
      password: user.password
    })
  });
  
  console.log(`Status: ${result.status}`);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.status === 200 && result.data.token) {
    authToken = result.data.token;
    console.log(`✓ Token saved: ${authToken.substring(0, 20)}...`);
    return true;
  }
  return false;
}

async function testInterpretDream() {
  console.log('\n🔮 Testing Dream Interpretation...');
  const result = await apiCall('/dreams/interpret', {
    method: 'POST',
    body: JSON.stringify({
      dream_text: 'I was flying over a beautiful ocean, feeling free and happy. Then I saw a snake swimming in the water below me.'
    })
  });
  console.log(`Status: ${result.status}`);
  if (result.status === 200) {
    console.log('✓ Dream interpreted successfully!');
    console.log('Emotional tone:', result.data.emotional_tone?.sentiment);
    console.log('Symbols detected:', result.data.symbols_detected?.length || 0);
    console.log('API calls remaining:', result.data.api_calls_remaining);
  } else {
    console.log('Response:', JSON.stringify(result.data, null, 2));
  }
  return result.status === 200;
}

async function testGetHistory() {
  console.log('\n📚 Testing Dream History...');
  const result = await apiCall('/dreams/history');
  console.log(`Status: ${result.status}`);
  if (result.status === 200) {
    console.log(`✓ Found ${result.data.dreams?.length || 0} dreams`);
    if (result.data.dreams && result.data.dreams.length > 0) {
      console.log('Latest dream:', result.data.dreams[0].dream_text.substring(0, 50) + '...');
    }
  } else {
    console.log('Response:', JSON.stringify(result.data, null, 2));
  }
  return result.status === 200;
}

async function testGetStats() {
  console.log('\n📊 Testing User Stats...');
  const result = await apiCall('/dreams/stats');
  console.log(`Status: ${result.status}`);
  if (result.status === 200) {
    console.log('✓ Stats retrieved:');
    console.log('  - API calls used:', result.data.api_calls_used);
    console.log('  - API calls remaining:', result.data.api_calls_remaining);
    console.log('  - Total dreams:', result.data.total_dreams);
    console.log('  - Recurring symbols:', result.data.recurring_symbols?.length || 0);
  } else {
    console.log('Response:', JSON.stringify(result.data, null, 2));
  }
  return result.status === 200;
}

async function testAdminUsers() {
  console.log('\n👥 Testing Admin - Get All Users...');
  const result = await apiCall('/admin/users');
  console.log(`Status: ${result.status}`);
  if (result.status === 200) {
    console.log(`✓ Found ${result.data.count || 0} users`);
  } else {
    console.log('Response:', JSON.stringify(result.data, null, 2));
  }
  return result.status === 200;
}

async function testAdminAnalytics() {
  console.log('\n📈 Testing Admin - Analytics...');
  const result = await apiCall('/admin/analytics');
  console.log(`Status: ${result.status}`);
  if (result.status === 200) {
    console.log('✓ Analytics retrieved:');
    console.log('  - Total users:', result.data.total_users);
    console.log('  - Total dreams:', result.data.total_dreams);
    console.log('  - Total API calls:', result.data.total_api_calls);
  } else {
    console.log('Response:', JSON.stringify(result.data, null, 2));
  }
  return result.status === 200;
}

// Cleanup test data
async function cleanupTestData() {
  if (createdTestUserId) {
    try {
      console.log('\n🧹 Cleaning up test data...');
      await prisma.user.delete({
        where: { id: createdTestUserId }
      });
      console.log(`✓ Deleted test user (ID: ${createdTestUserId})`);
    } catch (error) {
      console.log(`⚠️  Could not delete test user: ${(error as Error).message}`);
    } finally {
      await prisma.$disconnect();
      createdTestUserId = null;
    }
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API Tests...');
  console.log('Make sure the server is running: npm run dev');
  
  // Wait a bit for server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const results = {
    healthCheck: false,
    register: false,
    login: false,
    interpret: false,
    history: false,
    stats: false,
    adminUsers: false,
    adminAnalytics: false
  };
  
  // Basic tests
  results.healthCheck = await testHealthCheck();
  results.register = await testRegister();
  results.login = await testLogin('user');
  
  // Authenticated tests
  if (authToken) {
    results.interpret = await testInterpretDream();
    results.history = await testGetHistory();
    results.stats = await testGetStats();
    
    // Admin tests (login as admin)
    console.log('\n\n🔄 Switching to admin account...');
    const adminLogin = await testLogin('admin');
    if (adminLogin && authToken) {
      results.adminUsers = await testAdminUsers();
      results.adminAnalytics = await testAdminAnalytics();
    }
  }
  
  // Summary
  console.log('\n\n📋 Test Summary:');
  console.log('='.repeat(50));
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✓' : '✗'} ${test.padEnd(20)} ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  console.log(`\n${passed}/${total} tests passed`);
  
  // Cleanup before exiting
  await cleanupTestData();
  
  if (passed === total) {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(async (error) => {
  console.error('❌ Test runner error:', error);
  await cleanupTestData();
  process.exit(1);
});

