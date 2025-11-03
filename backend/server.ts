import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// @ts-ignore - ESM imports .js for .ts files
import authRoutes from './routes/auth.js';
// @ts-ignore - ESM imports .js for .ts files
import dreamsRoutes from './routes/dreams.js';
// @ts-ignore - ESM imports .js for .ts files
import adminRoutes from './routes/admin.js';
import { testConnection, closePool } from './config/db.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// CORS Configuration
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  // In development: allow everything for easier testing
  app.use(cors({
    origin: true,
    credentials: true
  }));
} else {
  // In production: only allow specified CLIENT_URL(s)
  const allowedOrigins = process.env.CLIENT_URL 
    ? process.env.CLIENT_URL.split(',').map(url => url.trim())
    : [];
  
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dreams', dreamsRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Endpoint not found' 
  });
});

// Error handler
const errorHandler: ErrorRequestHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  const status = (err as any).status || 500;
  res.status(status).json({ 
    error: err.message || 'Internal server error' 
  });
};
app.use(errorHandler);

// Start server with database connection test
async function startServer(): Promise<void> {
  try {
    // Test database connection before starting server
    await testConnection();
    
    app.listen(PORT, () => {
      console.log(`\nServer running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
      console.log(`\nDream Interpreter API ready!\n`);
    });
  } catch (error) {
    const err = error as Error;
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received, closing server...');
  await closePool();
  process.exit(0);
});

startServer();

export default app;

