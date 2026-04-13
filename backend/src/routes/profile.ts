import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const updateProfileSchema = z.object({
  username: z.string().min(1).max(50).optional(),
  profilePicture: z.string().nullable().optional(), // Base64 encoded image or null
});

// Get user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            vault: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('GET /profile - User found:', {
      userId: user.id,
      hasProfilePicture: !!user.profilePicture,
      pictureLength: user.profilePicture?.length || 0,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        passwordCount: user._count.vault,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId;

    // Validate request body
    const validationResult = updateProfileSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { username, profilePicture } = validationResult.data;

    // Build update data
    const updateData: any = {};
    if (username !== undefined) {
      updateData.username = username;
    }
    if (profilePicture !== undefined) {
      // Allow null to remove picture, or validate base64 image format
      if (profilePicture !== null && profilePicture !== '' && !profilePicture.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Invalid image format. Must be base64 encoded image.' });
      }
      updateData.profilePicture = profilePicture || null;
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log('Profile updated:', {
      userId: user.id,
      hasProfilePicture: !!user.profilePicture,
      pictureLength: user.profilePicture?.length || 0,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as profileRoutes };

