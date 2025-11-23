import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { messages } from '../messages.js';

const router = express.Router();

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegisterBody {
  first_name: string;
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

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - email
 *               - password
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: "John"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 minLength: 3
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 userId:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Validation error or email already exists
 *       500:
 *         description: Server error
 */
router.post('/register', async (req: Request<{}, {}, RegisterBody>, res: Response) => {
  try {
    const { first_name, email, password } = req.body;
    
    // Validation
    if (!first_name) {
      return res.status(400).json({ 
        success: false,
        message: messages.auth.register.firstNameRequired
      });
    }
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: messages.auth.register.emailRequired
      });
    }
    
    if (!password) {
      return res.status(400).json({ 
        success: false,
        message: messages.auth.register.passwordRequired
      });
    }
    
    if (!first_name.trim()) {
      return res.status(400).json({ 
        success: false,
        message: messages.auth.register.firstNameRequired
      });
    }
    
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ 
        success: false,
        message: messages.auth.register.emailInvalid
      });
    }
    
    if (password.length < 3) {
      return res.status(400).json({ 
        success: false,
        message: messages.auth.register.passwordTooShort
      });
    }
    
    const emailLower = email.trim().toLowerCase();
    
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower }
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: messages.auth.register.emailTaken
      });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        first_name: first_name.trim(),
        email: emailLower,
        password_hash: passwordHash
      },
      select: {
        id: true,
        first_name: true,
        email: true,
        role: true,
        api_calls_used: true
      }
    });
    
    console.log(`New user registered: ${email}`);
    
    res.status(201).json({ 
      success: true, 
      message: messages.auth.register.success,
      userId: newUser.id 
    });
    return;
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: messages.auth.register.failed
    });
  }
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user and receive JWT token in httpOnly cookie
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful, JWT token set in httpOnly cookie
 *         headers:
 *           Set-Cookie:
 *             description: JWT token in httpOnly cookie
 *             schema:
 *               type: string
 *               example: "token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Path=/"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     first_name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [user, admin]
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', async (req: Request<{}, {}, LoginBody>, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: messages.auth.login.emailRequired
      });
    }
    
    if (!password) {
      return res.status(400).json({ 
        success: false,
        message: messages.auth.login.passwordRequired
      });
    }
    
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ 
        success: false,
        message: messages.auth.register.emailInvalid
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true,
        first_name: true,
        email: true,
        password_hash: true,
        role: true,
        api_calls_used: true
      }
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: messages.auth.login.invalidCredentials
      });
    }
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ 
        success: false,
        message: messages.auth.login.invalidCredentials
      });
    }
    
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Set httpOnly cookie with JWT token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    console.log(`User logged in: ${user.email} (${user.role})`);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        first_name: user.first_name,
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
      message: messages.auth.login.failed
    });
  }
});

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset (sends reset token to email)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *     responses:
 *       200:
 *         description: Reset token sent to email (if user exists)
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password using reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: "reset_token_here"
 *               newPassword:
 *                 type: string
 *                 minLength: 3
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user (clears httpOnly cookie)
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful, cookie cleared
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 */
router.post('/logout', (_req: Request, res: Response) => {
  // Clear the httpOnly cookie
  res.clearCookie('token');
  res.json({ 
    success: true, 
    message: messages.auth.logout.success
  });
});

export default router;

