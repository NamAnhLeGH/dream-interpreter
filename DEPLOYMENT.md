# Deployment Guide

## Backend

**Environment Variables:**
```env
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long
CLIENT_URL=https://your-frontend-domain.com
```

**Build:** `npm install && npm run build && npx prisma generate`  
**Start:** `npm start`  
**Migrations:** `npx prisma migrate deploy`

## Frontend

**Environment Variable:**
```env
VITE_API_URL=https://your-backend-domain.com
```

**Build:** `npm install && npm run build`  
**Output:** `dist/` directory

**Note:** Set `VITE_API_URL` before building - variables are embedded at build time.
