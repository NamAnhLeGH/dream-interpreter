# Quick Start Guide

Get the Dream Interpreter application running in minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or remote)
- ~6GB RAM available (for AI model)

## Step 1: Environment Setup

### Backend

```bash
cd backend
npm install
cp env.template .env
```

Edit `backend/.env` with your values:
```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your_secret_key_at_least_32_characters_long
PORT=3000
CLIENT_URL=http://localhost:5173
```

### Frontend

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:3000" > .env
```

## Step 2: Database Setup

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

This creates all necessary database tables.

## Step 3: Run the Application

### Option 1: Two Terminal Windows (Recommended)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option 2: Background Process

**Backend (background):**
```bash
cd backend
npm run dev &
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## Step 4: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/doc
- **Health Check**: http://localhost:3000/health

## First Time Setup

### Create Test Users

The application includes a script to hash passwords. You can create users via the registration endpoint or directly in the database.

**Test Credentials:**
- Admin: `admin@admin.com` / `111`
- User: `john@john.com` / `123`

### AI Model Download

On first run, the AI model (Llama 3.1 8B, ~5GB) will automatically download. This may take 10-30 minutes depending on your internet speed.

The model is stored in `backend/models/llama-3.1-8b-q4.gguf` and only downloads once.

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Frontend Can't Connect to Backend

- Verify `frontend/.env` has `VITE_API_URL=http://localhost:3000`
- Ensure backend is running on port 3000
- Check browser console for CORS errors

### Database Connection Errors

- Verify `DATABASE_URL` in `backend/.env` is correct
- Ensure PostgreSQL is running
- Check database credentials

### AI Model Not Loading

- Ensure you have ~6GB RAM available
- Check `backend/models/` directory exists
- Review server logs for download/loading errors
- Model download happens automatically on first run

### Missing Environment Variables

See [ENV_SETUP.md](./ENV_SETUP.md) for required environment variables.

## Next Steps

- Register a new account or use test credentials
- Try interpreting a dream
- Check the admin dashboard (if logged in as admin)
- Review API documentation at `/doc`
