# API Testing Guide

## Quick Start

1. **Start the backend server:**
```bash
cd backend
npm run dev
```

2. **Set up test users (if not done already):**
```bash
npm run test:db  # Test connection first
tsx scripts/hashPasswords.ts  # Create test users
```

3. **Run automated API tests:**
```bash
npm run test:api
```

## Test Credentials

From `scripts/hashPasswords.ts`:
- **Admin**: `admin` / `111`
- **User**: `john@email.com` / `123`

## Manual Testing with cURL

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

### 2. Register New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@test.com","password":"password123"}'
```

### 3. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@email.com","password":"123"}'
```

**Save the token** from the response for authenticated requests.

### 4. Interpret a Dream (requires auth)
```bash
curl -X POST http://localhost:3000/api/dreams/interpret \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"dream_text":"I was flying over an ocean and saw a snake swimming below me."}'
```

### 5. Get Dream History
```bash
curl -X GET http://localhost:3000/api/dreams/history \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6. Get User Stats
```bash
curl -X GET http://localhost:3000/api/dreams/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 7. Admin - Get All Users (admin only)
```bash
# First login as admin to get admin token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin","password":"111"}'

# Then use the admin token
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

### 8. Admin - Get Analytics
```bash
curl -X GET http://localhost:3000/api/admin/analytics \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

## Testing with Postman/Thunder Client

1. Create a new collection for "Dream Interpreter API"
2. Set base URL: `http://localhost:3000/api`
3. Add environment variable `token` for JWT tokens
4. For authenticated requests, add header:
   - Key: `Authorization`
   - Value: `Bearer {{token}}`

## Testing with Frontend

The frontend at `http://localhost:8081` should automatically connect to the backend at `http://localhost:3000` if configured correctly in the frontend's API configuration.

## Common Issues

- **401 Unauthorized**: Make sure you're logged in and using a valid JWT token
- **403 Forbidden (Admin endpoints)**: Make sure you're logged in as an admin user
- **500 Internal Server Error**: Check server logs and ensure database is connected
- **Connection refused**: Make sure the backend server is running (`npm run dev`)

