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

// Log ALL incoming requests BEFORE anything else (including CORS)
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`\n[INCOMING REQUEST] ${req.method} ${req.path}`);
  console.log(`[INCOMING] Origin header: "${req.headers.origin || 'NO ORIGIN'}"`);
  console.log(`[INCOMING] Referer: "${req.headers.referer || 'NO REFERER'}"`);
  console.log(`[INCOMING] User-Agent: ${req.headers['user-agent']?.substring(0, 50) || 'none'}`);
  next();
});

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
      console.log(`\n[CORS CHECK] Origin received: ${origin || 'no origin'}`);
      console.log(`[CORS CHECK] Allowed origins:`, allowedOrigins);
      
      if (!origin) {
        console.log('[CORS CHECK] ✅ No origin header - allowing (direct request)');
        return callback(null, true);
      }
      
      // Check exact match
      if (allowedOrigins.includes(origin)) {
        console.log(`[CORS CHECK] ✅ Origin ALLOWED: ${origin}`);
        callback(null, true);
      } else {
        console.log(`[CORS CHECK] ❌ Origin BLOCKED: ${origin}`);
        console.log(`[CORS CHECK] Expected one of:`, allowedOrigins);
        console.log(`[CORS CHECK] Origin type: ${typeof origin}, Length: ${origin.length}`);
        console.log(`[CORS CHECK] First allowed origin type: ${typeof allowedOrigins[0]}, Length: ${allowedOrigins[0]?.length}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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

