import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// @ts-ignore
import authRoutes from './routes/auth.js';
// @ts-ignore
import dreamsRoutes from './routes/dreams.js';
// @ts-ignore
import adminRoutes from './routes/admin.js';
import { testConnection, closePool } from './config/db.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Log incoming requests
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`\n[REQUEST] ${req.method} ${req.path} | Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Allow CORS from any origin (no restrictions)
app.use(cors({ 
  origin: true,  // Allow any origin
  credentials: true 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint - must be fast and always respond
app.get('/health', (_req: Request, res: Response) => {
  try {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(200).json({ status: 'ok', error: 'health check failed' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/dreams', dreamsRoutes);
app.use('/api/admin', adminRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const errorHandler: ErrorRequestHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  const status = (err as any).status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
};
app.use(errorHandler);

async function startServer(): Promise<void> {
  try {
    await testConnection();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\nServer running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`CORS: Enabled for all origins`);
      console.log(`\nDream Interpreter API ready!\n`);
    });
  } catch (error) {
    const err = error as Error;
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

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

// Catch uncaught exceptions to prevent crashes
process.on('uncaughtException', (error: Error) => {
  console.error('UNCAUGHT EXCEPTION - Server will continue:', error);
  console.error('Stack:', error.stack);
  // Don't exit - log and continue (or restart gracefully)
});

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  // Log but don't crash
});

// Log when server starts
console.log('Starting server...');
console.log('Node version:', process.version);
console.log('Initial memory:', {
  heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
  heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
  rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
}, 'MB');

startServer();

export default app;

