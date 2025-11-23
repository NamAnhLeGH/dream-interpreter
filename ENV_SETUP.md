# Environment Variables Setup

## Required Environment Variables

After removing fallbacks, these environment variables are **REQUIRED**. The application will fail to start if they are missing.

---

## Backend (`backend/.env`)

### Required Variables

```env
# Database Connection (REQUIRED)
# Your PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# JWT Secret (REQUIRED)
# Must be at least 32 characters
# Generate with: openssl rand -base64 32
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long
```

### Optional Variables

```env
# Server Port (optional, defaults to 3000)
PORT=3000

# Environment (optional, defaults to development)
NODE_ENV=development

# Frontend URL (optional, for CORS)
CLIENT_URL=http://localhost:5173
```

### What Happens If Missing

- **DATABASE_URL missing**: Server will fail to start (validated at startup)
- **JWT_SECRET missing**: Server will fail to start (validated at startup)
- **PORT missing**: Defaults to 3000
- **NODE_ENV missing**: Defaults to development
- **CLIENT_URL missing**: CORS may not work properly

---

## Frontend (`frontend/.env`)

### Required Variables

```env
# Backend API URL (REQUIRED)
# Must be set, no fallback
VITE_API_URL=http://localhost:3000
```

### What Happens If Missing

- **VITE_API_URL missing**: 
  - Application will throw error on load: `VITE_API_URL environment variable is not set`
  - Frontend will not start

### Production Note

In production, if `VITE_API_URL` contains `localhost`, the app will throw an error:
```
VITE_API_URL cannot be localhost in production
```

---

## Quick Setup

### Backend

```bash
cd backend
cp env.template .env
# Edit .env with your values
```

**Minimum required in `.env`:**
```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your_secret_key_at_least_32_characters_long
```

### Frontend

```bash
cd frontend
# Create .env file
echo "VITE_API_URL=http://localhost:3000" > .env
```

**Minimum required in `.env`:**
```env
VITE_API_URL=http://localhost:3000
```

---

## Example Complete Files

### `backend/.env` (Development)
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
JWT_SECRET=your_secret_key_at_least_32_characters_long
CLIENT_URL=http://localhost:5173
```

### `frontend/.env` (Development)
```env
VITE_API_URL=http://localhost:3000
```

### `backend/.env` (Production)
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@production-db-host:5432/database?sslmode=require
JWT_SECRET=your_production_secret_min_32_chars
CLIENT_URL=https://your-frontend-domain.com
```

### `frontend/.env` (Production)
```env
VITE_API_URL=https://your-backend-api-domain.com
```

---

## Verification

### Check Backend
```bash
cd backend
# Should show error if DATABASE_URL or JWT_SECRET missing
npm run dev
```

### Check Frontend
```bash
cd frontend
# Should show error if VITE_API_URL missing
npm run dev
```

---

## Error Messages

If you see these errors, you're missing required environment variables:

**Backend:**
- `Error: Missing required environment variables: DATABASE_URL, JWT_SECRET`

**Frontend:**
- `VITE_API_URL environment variable is not set`
- `VITE_API_URL cannot be localhost in production`

