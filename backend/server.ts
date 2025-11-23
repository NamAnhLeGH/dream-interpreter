import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import dreamsRoutes from './routes/dreams.js';
import adminRoutes from './routes/admin.js';
import { testConnection, closePool } from './config/db.js';
import { trackEndpoint } from './middleware/endpointTracking.js';
import { swaggerSpec } from './config/swagger.js';
import { initializeModel } from './models/dreamAnalysis.js';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Log incoming requests
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`\n[REQUEST] ${req.method} ${req.path} | Origin: ${req.headers.origin || 'none'}`);
  next();
});

// CORS configuration - allow credentials for cross-origin cookies
const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    const clientUrl = process.env.CLIENT_URL;
    
    // If CLIENT_URL is set, check if origin matches
    if (clientUrl) {
      // Remove trailing slashes for comparison
      const normalizedClientUrl = clientUrl.replace(/\/+$/, '');
      const normalizedOrigin = origin.replace(/\/+$/, '');
      
      if (normalizedOrigin === normalizedClientUrl) {
        return callback(null, true);
      }
      
      // Log mismatch for debugging
      console.log(`[CORS] Origin mismatch: ${normalizedOrigin} !== ${normalizedClientUrl}`);
    } else {
      // No CLIENT_URL set, allow all origins (development mode)
      console.log(`[CORS] CLIENT_URL not set, allowing all origins: ${origin}`);
      return callback(null, true);
    }
    
    // Reject if origin doesn't match
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

app.use(cookieParser()); // Parse httpOnly cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint - minimal, always responds immediately
// This MUST be fast so App Platform health checks pass
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Swagger API documentation
app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Dream Interpreter API Documentation'
}));

// API versioning - all routes under /api/v1
// Endpoint tracking middleware (applied to all API routes)
app.use('/api/v1', trackEndpoint);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dreams', dreamsRoutes);
app.use('/api/v1/admin', adminRoutes);

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
  // Start server immediately - don't wait for database
  // Health checks will pass, then we connect DB in background
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nServer running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    if (process.env.CLIENT_URL) {
      console.log(`CORS: Allowing origin: ${process.env.CLIENT_URL}`);
    } else {
      console.log(`CORS: Allowing all origins (CLIENT_URL not set)`);
    }
    console.log(`\nDream Interpreter API ready!\n`);
    
    // Connect to database in background (non-blocking)
    testConnection()
      .then(() => console.log('Database connected successfully'))
      .catch((err) => console.error('Database connection failed (will retry):', err));
    
    // Initialize AI model in background (non-blocking)
    // This will load the model so it's ready when first interpretation request comes in
    initializeModel()
      .then(() => {
        // Model loaded successfully - logs are already printed by initializeModel
      })
      .catch((err) => {
        console.error('[AI] Failed to initialize AI model (will retry on first request):', err.message);
        console.error('[AI] Dream interpretations will not work until model is loaded.');
      });
  });
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

