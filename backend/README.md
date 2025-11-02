# Dream Interpreter API Backend

Backend API for the Inner Visions dream interpretation application.

## Tech Stack

- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** (via Neon) with Prisma ORM
- **JWT** for authentication
- **bcrypt** for password hashing
- **@xenova/transformers** for AI dream analysis

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory. Copy from `env.template`:

```bash
cp env.template .env
```

Get your `DATABASE_URL` from your Neon dashboard under "Connection Details" and add it to `.env`:

```env
DATABASE_URL=postgresql://user:password@your-neon-host.neon.tech:5432/database?sslmode=require
```

**Complete .env example:**

```env
PORT=3000
NODE_ENV=development

DATABASE_URL=postgresql://user:password@host:5432/db?sslmode=require

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars
CLIENT_URL=http://localhost:8081
```

### 3. Set Up Database

1. Connect to your Neon PostgreSQL database
2. Run the SQL schema file (provided in your instructions)
3. Run the password hashing script to set up test users:

```bash
node scripts/hashPasswords.js
```

This will generate password hashes for:
- `admin@admin.com` / `111`
- `john@john.com` / `123`

### 4. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/logout` - Logout (client-side)

### Dreams
- `POST /api/dreams/interpret` - Interpret a dream (requires auth)
- `GET /api/dreams/history` - Get user's dream history (requires auth)
- `GET /api/dreams/stats` - Get user statistics (requires auth)
- `GET /api/dreams/:id` - Get specific dream (requires auth)
- `DELETE /api/dreams/:id` - Delete dream (requires auth)

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/analytics` - Get analytics (admin only)
- `GET /api/admin/user/:id` - Get user details (admin only)
- `GET /api/admin/recent-activity` - Get recent activity (admin only)

## Project Structure

```
backend/
├── config/
│   └── db.js              # Database connection
├── middleware/
│   └── auth.js             # Authentication & admin middleware
├── models/
│   └── dreamAnalysis.js   # AI dream interpretation model
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── dreams.js          # Dream routes
│   └── admin.js           # Admin routes
├── scripts/
│   └── hashPasswords.js   # Password hashing utility
├── server.js              # Main server file
├── package.json
└── .env                   # Environment variables (not in git)
```

## Notes

- The API uses Bearer token authentication (JWT)
- All dream endpoints require authentication
- Admin endpoints require both authentication and admin role
- AI models are loaded on first request (may take a moment)
- API calls are limited to 20 per user (configurable)

