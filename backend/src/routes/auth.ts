import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../middleware/auth.js';
import { z } from 'zod';
import admin from 'firebase-admin';

const router = Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(1).optional(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().optional(),
  password: z.string(),
}).refine((data) => data.email || data.username, {
  message: "Either email or username is required",
});

// Verify Firebase token and create/get user
router.post('/verify-firebase-token', async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture, email_verified } = decodedToken;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists in database
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user
      // Note: We don't use Firebase UID as MongoDB ObjectID because Firebase UIDs
      // can contain characters that aren't valid for ObjectIDs (e.g., 'I', 'O')
      // MongoDB will auto-generate a valid ObjectID instead
      user = await prisma.user.create({
        data: {
          email,
          username: name || email.split('@')[0],
          passwordHash: '', // No password for OAuth users
        },
      });
    } else {
      // Update existing user if needed
      if (!user.username && name) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { username: name },
        });
      }
    }

    // Generate JWT token for backend API
    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username || name || email.split('@')[0],
        displayName: name || undefined,
        photoURL: picture || undefined,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error: any) {
    console.error('Firebase token verification error:', error);
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid Firebase token' });
    }
    next(error);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    // Validate request body
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }

    const { email, username, password } = validationResult.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password (for authentication, not encryption)
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username: username || email.split('@')[0], // Fallback to email prefix if username is empty
        passwordHash,
      },
    });

    const token = generateToken(user.id);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username || email.split('@')[0],
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    // Handle Prisma errors
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, username, password } = loginSchema.parse(req.body);

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          username ? { username } : {},
        ].filter(condition => Object.keys(condition).length > 0),
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user has a password (OAuth users might not have one)
    if (!user.passwordHash || user.passwordHash === '') {
      return res.status(401).json({ error: 'Please sign in with your social account' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username || user.email.split('@')[0], // Fallback to email prefix if username not set
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

// Verify user for password reset
router.post('/verify-reset', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Try to find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        email: true,
        username: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return res.status(200).json({ 
        verified: false,
        error: 'Email not found' 
      });
    }

    // Allow both OAuth users and regular users to set/reset password
    res.json({
      verified: true,
      email: user.email,
      username: user.username,
    });
  } catch (error) {
    next(error);
  }
});

// Reset password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Also update Firebase password if Firebase Admin is initialized
    try {
      if (admin.apps.length > 0) {
        // Find Firebase user by email
        try {
          const firebaseUser = await admin.auth().getUserByEmail(user.email);
          await admin.auth().updateUser(firebaseUser.uid, {
            password: newPassword,
          });
        } catch (firebaseError: any) {
          // If Firebase user doesn't exist, that's okay - they might be using backend-only auth
          console.log('Firebase user not found or password update failed:', firebaseError.message);
        }
      }
    } catch (firebaseError) {
      // Continue even if Firebase update fails - backend password is updated
      console.error('Firebase password update error:', firebaseError);
    }

    res.json({ 
      success: true,
      message: 'Password reset successfully' 
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };
