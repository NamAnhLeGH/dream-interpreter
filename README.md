# Dream Interpreter

AI-powered dream interpretation application with user authentication, dream journaling, and recurring symbol analysis.

## Features

- **AI-Powered Dream Interpretation** - Uses Llama 3.1 8B model for high-quality interpretations
- **User Authentication** - JWT-based auth with httpOnly cookies
- **Dream Journal** - Save and track your dreams over time
- **Recurring Symbol Analysis** - Discover patterns in your dreams
- **Admin Dashboard** - Monitor API usage and platform analytics
- **API Documentation** - Full Swagger documentation at `/doc`

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **AI Model**: Llama 3.1 8B (hosted locally via node-llama-cpp)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- ~6GB RAM (for AI model)

### Setup

1. **Clone and install dependencies:**
   ```bash
   # Backend
   cd backend
   npm install
   cp env.template .env
   # Edit .env with your DATABASE_URL and JWT_SECRET
   
   # Frontend
   cd ../frontend
   npm install
   echo "VITE_API_URL=http://localhost:3000" > .env
   ```

2. **Setup database:**
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev
   ```

3. **Run the application:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

4. **Access:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Docs: http://localhost:3000/doc

## Test Credentials

- **Admin**: `admin@admin.com` / `111`
- **User**: `john@john.com` / `123`

## Documentation

- [Environment Setup](./ENV_SETUP.md) - Environment variables configuration
- [Quick Start Guide](./QUICK_START.md) - Detailed setup instructions
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- [AI Code Explanation](./AI_CODE_EXPLANATION.md) - How the AI model works

## API Endpoints

All endpoints are versioned under `/api/v1`:

- **Auth**: `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/logout`
- **Dreams**: `/api/v1/dreams/interpret`, `/api/v1/dreams/history`, `/api/v1/dreams/stats`
- **Admin**: `/api/v1/admin/users`, `/api/v1/admin/analytics`, `/api/v1/admin/endpoint-stats`

Full API documentation available at `/doc` endpoint.

## Project Structure

```
term-project/
├── backend/          # Express API server
│   ├── routes/       # API route handlers
│   ├── models/       # AI model integration
│   ├── middleware/   # Auth, tracking, etc.
│   └── prisma/       # Database schema
└── frontend/         # React application
    ├── src/
    │   ├── pages/    # Page components
    │   ├── components/ # Reusable components
    │   └── lib/      # API client
```

## License

This project was created for educational purposes.
