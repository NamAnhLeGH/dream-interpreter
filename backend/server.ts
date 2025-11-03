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

const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  app.use(cors({ origin: true, credentials: true }));
} else {
  const allowedOrigins = process.env.CLIENT_URL 
    ? process.env.CLIENT_URL.split(',').map(url => url.trim())
    : [];
  
  // Debug logging for CORS
  console.log('CORS Configuration:');
  console.log('CLIENT_URL env:', process.env.CLIENT_URL);
  console.log('Allowed origins:', allowedOrigins);
  
  app.use(cors({
    origin: (origin, callback) => {
      // Log CORS requests for debugging
      console.log(`\n[CORS] Request from origin: ${origin || 'no origin'}`);
      console.log(`[CORS] Allowed origins:`, allowedOrigins);
      
      if (!origin) {
        console.log('[CORS] No origin header - allowing (direct request)');
        return callback(null, true);
      }
      
      // Check exact match
      if (allowedOrigins.includes(origin)) {
        console.log(`[CORS] ✅ Origin allowed: ${origin}`);
        callback(null, true);
      } else {
        console.log(`[CORS] ❌ Origin blocked: ${origin}`);
        console.log(`[CORS] Expected one of:`, allowedOrigins);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

// Health check endpoint - must respond quickly for App Platform
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Also handle HEAD requests for health checks
app.head('/health', (_req: Request, res: Response) => {
  res.status(200).end();
});

// Debug endpoint to check CORS configuration
app.get('/debug/cors', (req: Request, res: Response) => {
  res.json({
    origin: req.headers.origin || 'no origin header',
    host: req.headers.host,
    allowedOrigins: process.env.CLIENT_URL 
      ? process.env.CLIENT_URL.split(',').map(url => url.trim())
      : [],
    clientUrl: process.env.CLIENT_URL,
    nodeEnv: process.env.NODE_ENV,
    headers: {
      origin: req.headers.origin,
      referer: req.headers.referer
    }
  });
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
      console.log(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
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

startServer();

export default app;

