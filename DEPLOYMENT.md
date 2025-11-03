# Deployment Guide for Digital Ocean

## Backend Deployment

### 1. Environment Variables
Create a `.env` file on your Digital Ocean app with:
```env
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://user:password@your-digitalocean-db:5432/database?sslmode=require
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long
CLIENT_URL=https://your-frontend-domain.com
```

### 2. Build Commands
Digital Ocean App Platform will run:
- Build: `npm install && npm run build`
- Start: `npm start`

### 3. Database
- Use Digital Ocean Managed PostgreSQL
- Run migrations: `npx prisma migrate deploy` (or set up as build step)
- Generate Prisma client: `npx prisma generate`

### 4. Health Check
Ensure `/health` endpoint works for Digital Ocean health checks

## Frontend Deployment

### 1. Environment Variables
Set in Digital Ocean app settings or build environment:
```env
VITE_API_URL=https://your-backend-domain.com
```

### 2. Build Commands
- Build: `npm install && npm run build`
- Output: `dist/` directory

### 3. Static File Serving
- Use Digital Ocean App Platform Static Site
- Or deploy `dist/` to Digital Ocean Spaces + CDN

## Important Notes

1. **CORS**: Backend `CLIENT_URL` must match your frontend URL exactly
2. **JWT_SECRET**: Generate a strong random string (min 32 chars) for production
3. **Database**: Ensure Prisma migrations are run before deployment
4. **API URL**: Frontend must have `VITE_API_URL` set to backend URL in production

## Pre-Deployment Checklist

- [ ] Backend `.env` configured with production values
- [ ] Frontend `VITE_API_URL` set to production backend URL
- [ ] Database migrations applied
- [ ] Admin user created (`npm run hash-passwords`)
- [ ] CORS allows frontend domain
- [ ] JWT_SECRET is strong and secure
- [ ] No hardcoded localhost URLs remain
- [ ] Error messages don't expose sensitive info in production

