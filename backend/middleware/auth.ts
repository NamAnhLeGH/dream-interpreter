import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Authentication middleware
// Supports httpOnly cookies (primary) and Bearer tokens
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;
    
    // Primary: Get token from httpOnly cookie
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // Fallback: Get token from Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }
    
    if (!token) {
      res.status(401).json({ 
        error: 'No token provided. Please login to access this resource.' 
      });
      return;
    }
    
    if (!process.env.JWT_SECRET) {
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      userId: number;
      email: string;
      role: string;
    };
    
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
    
  } catch (error) {
    const err = error as jwt.JsonWebTokenError | jwt.TokenExpiredError;
    if (err.name === 'JsonWebTokenError') {
      res.status(401).json({ error: 'Invalid token. Please login again.' });
      return;
    }
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired. Please login again.' });
      return;
    }
    res.status(401).json({ error: 'Authentication failed.' });
  }
}

// Admin-only middleware
export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  
  if (req.user.role !== 'admin') {
    res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
    return;
  }
  
  next();
}

