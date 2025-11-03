import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';

const router = express.Router();

interface RegisterBody {
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface ForgotPasswordBody {
  email: string;
}

interface ResetPasswordBody {
  token: string;
  newPassword: string;
}

router.post('/register', async (req: Request<{}, {}, RegisterBody>, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Username and password are required' 
      });
    }
    
    const username = email.trim();
    
    if (password.length < 3) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 3 characters' 
      });
    }
    
    const existingUser = await prisma.user.findUnique({
      where: { email: username.toLowerCase() }
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'This username is already taken. Please choose another.' 
      });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        email: username.toLowerCase(),
        password_hash: passwordHash
      },
      select: {
        id: true,
        email: true,
        role: true,
        api_calls_used: true
      }
    });
    
    console.log(`New user registered: ${email}`);
    
    res.status(201).json({ 
      success: true, 
      message: 'Registration successful! Please login.',
      userId: newUser.id 
    });
    return;
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Registration failed. Please try again.' 
    });
  }
});

router.post('/login', async (req: Request<{}, {}, LoginBody>, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Username and password are required' 
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true,
        email: true,
        password_hash: true,
        role: true,
        api_calls_used: true
      }
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid username or password. Please try again.' 
      });
    }
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid username or password. Please try again.' 
      });
    }
    
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
    
    console.log(`User logged in: ${user.email} (${user.role})`);
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        api_calls_used: user.api_calls_used
      }
    });
    return;
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Login failed. Please try again.' 
    });
  }
});

router.post('/forgot-password', async (req: Request<{}, {}, ForgotPasswordBody>, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true }
    });
    
    if (!user) {
      return res.json({ 
        success: true, 
        message: 'If that username exists, a reset link has been sent.' 
      });
    }
    
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_token: resetToken,
        reset_token_expires: expiresAt
      }
    });
    
    console.log(`Reset token generated for ${user.email}: ${resetToken}`);
    
    res.json({ 
      success: true, 
      message: 'If that username exists, a reset link has been sent.' 
    });
    return;
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
});

router.post('/reset-password', async (req: Request<{}, {}, ResetPasswordBody>, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Token and new password are required' 
      });
    }
    
    if (newPassword.length < 3) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 3 characters' 
      });
    }
    
    const user = await prisma.user.findFirst({
      where: {
        reset_token: token,
        reset_token_expires: {
          gt: new Date()
        }
      },
      select: { id: true }
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired reset token' 
      });
    }
    
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expires: null
      }
    });
    
    console.log(`Password reset successful for user ${user.id}`);
    
    res.json({ 
      success: true, 
      message: 'Password reset successful! Please login with your new password.' 
    });
    return;
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
});

export default router;

