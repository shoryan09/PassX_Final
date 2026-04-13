import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';
import { ItemType } from '@passx/shared';

const router = Router();
const prisma = new PrismaClient();

// All vault routes require authentication
router.use(authenticateToken);

const createItemSchema = z.object({
  type: z.enum(['website', 'card', 'note']),
  name: z.string().min(1),
  encryptedData: z.string(),
  iv: z.string(),
  salt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
});

const updateItemSchema = createItemSchema.partial().extend({
  id: z.string(),
});

// Get all vault items
router.get('/items', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { type, search, tag } = req.query;

    const where: any = { userId };

    if (type && ['website', 'card', 'note'].includes(type as string)) {
      where.type = type;
    }

    if (tag) {
      where.tags = {
        has: tag as string, // MongoDB supports has for array fields
      };
    }

    const items = await prisma.vaultItem.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    // Filter by search if provided (client-side filtering for encrypted data)
    let filteredItems = items;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredItems = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.category?.toLowerCase().includes(searchLower) ||
          item.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    res.json(filteredItems);
  } catch (error) {
    next(error);
  }
});

// Get single vault item
router.get('/items/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const item = await prisma.vaultItem.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Update last accessed
    await prisma.vaultItem.update({
      where: { id },
      data: { lastAccessed: new Date() },
    });

    res.json(item);
  } catch (error) {
    next(error);
  }
});

// Create vault item
router.post('/items', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const data = createItemSchema.parse(req.body);

    const item = await prisma.vaultItem.create({
      data: {
        ...data,
        userId,
      },
    });

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

// Update vault item
router.put('/items/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const data = updateItemSchema.parse({ ...req.body, id });

    // Verify ownership
    const existing = await prisma.vaultItem.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const { id: _, ...updateData } = data;
    const item = await prisma.vaultItem.update({
      where: { id },
      data: updateData,
    });

    res.json(item);
  } catch (error) {
    next(error);
  }
});

// Delete vault item
router.delete('/items/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.vaultItem.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await prisma.vaultItem.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get vault metadata
router.get('/metadata', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    const itemCount = await prisma.vaultItem.count({
      where: { userId },
    });

    const lastItem = await prisma.vaultItem.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    res.json({
      itemCount,
      lastSynced: lastItem?.updatedAt || new Date(),
    });
  } catch (error) {
    next(error);
  }
});

export { router as vaultRoutes };

