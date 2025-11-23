// Endpoint request tracking middleware
// Attribution: Created with assistance from ChatGPT

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';

export async function trackEndpoint(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Track endpoint calls for admin statistics
  // This runs asynchronously and doesn't block the request
  
  const method = req.method;
  // Get the full path including base route (e.g., /api/v1/dreams/interpret)
  let endpoint = req.originalUrl.split('?')[0]; // Remove query params
  
  // Normalize endpoint (remove /api/v1 prefix for consistency)
  if (endpoint.startsWith('/api/v1')) {
    endpoint = endpoint.substring(7); // Remove '/api/v1'
  }
  if (endpoint.startsWith('/api')) {
    endpoint = endpoint.substring(4); // Remove '/api'
  }
  if (!endpoint.startsWith('/')) {
    endpoint = '/' + endpoint;
  }
  
  // Skip health check and documentation endpoints
  if (endpoint === '/health' || endpoint === '/doc' || endpoint.startsWith('/doc/')) {
    next();
    return;
  }

  // Track in background (don't await to avoid blocking)
  prisma.apiEndpointStat.upsert({
    where: {
      method_endpoint: {
        method: method,
        endpoint: endpoint
      }
    },
    update: {
      request_count: {
        increment: 1
      }
    },
    create: {
      method: method,
      endpoint: endpoint,
      request_count: 1
    }
  }).catch((error: unknown) => {
    // Log but don't fail the request
    console.error('Error tracking endpoint:', error);
  });

  next();
}

