import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database.js';
import { Bot } from '../entities/Bot.js';
import { Prompt } from '../entities/Prompt.js';
import { User } from '../entities/User.js';
import { authenticate } from '../middleware/auth.js';
import { In } from 'typeorm';

const router = Router();
const botRepository = AppDataSource.getRepository(Bot);
const promptRepository = AppDataSource.getRepository(Prompt);

// GET /api/bots - Get all bots for the authenticated user (including system bots)
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;

    // Find system user for system bots
    const systemUser = await AppDataSource.getRepository(User).findOne({
      where: { email: 'system@platform.com' }
    });

    const whereConditions = [
      { userId } // User's own bots
    ];

    // Add system bots if system user exists
    if (systemUser) {
      whereConditions.push({ userId: systemUser.id });
    }

    const bots = await botRepository.find({
      where: whereConditions,
      relations: ['prompts', 'aiModel'],
      order: { createdAt: 'DESC' }
    });
    return res.json(bots);
  } catch (error) {
    return next(error);
  }
});

// GET /api/bots/:id - Get bot by ID (user-specific or system bot)
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;

    // Find system user for system bots
    const systemUser = await AppDataSource.getRepository(User).findOne({
      where: { email: 'system@platform.com' }
    });

    const whereConditions = [
      { id: req.params.id, userId } // User's own bot
    ];

    // Add system bot condition if system user exists
    if (systemUser) {
      whereConditions.push({ id: req.params.id, userId: systemUser.id });
    }

    const bot = await botRepository.findOne({
      where: whereConditions,
      relations: ['prompts', 'aiModel']
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    return res.json(bot);
  } catch (error) {
    return next(error);
  }
});

// POST /api/bots - Create new bot
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { name, displayName, description, promptIds, aiModelId } = req.body;

    if (!name || !displayName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const bot = botRepository.create({
      name,
      displayName,
      description: description || '',
      userId,
      isActive: true,
      aiModelId: aiModelId || null
    });

    // If promptIds are provided, load the prompts and associate them
    if (promptIds && Array.isArray(promptIds)) {
      const prompts = await promptRepository.findByIds(promptIds);
      bot.prompts = prompts;
    }

    const savedBot = await botRepository.save(bot);
    return res.status(201).json(savedBot);
  } catch (error) {
    return next(error);
  }
});

// PUT /api/bots/:id - Update bot
router.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;

    // Find system user for system bots
    const systemUser = await AppDataSource.getRepository(User).findOne({
      where: { email: 'system@platform.com' }
    });

    // Build user IDs array for the query
    const userIds = [userId];
    if (systemUser) {
      userIds.push(systemUser.id);
    }

    const bot = await botRepository.findOne({
      where: {
        id: req.params.id,
        userId: In(userIds)
      },
      relations: ['prompts', 'aiModel']
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const { name, displayName, description, isActive, promptIds, aiModelId } = req.body;

    if (name) bot.name = name;
    if (displayName) bot.displayName = displayName;
    if (description !== undefined) bot.description = description;
    if (isActive !== undefined) bot.isActive = isActive;
    if (aiModelId !== undefined) bot.aiModelId = aiModelId;

    // Update prompt associations if provided
    if (promptIds !== undefined) {
      if (Array.isArray(promptIds) && promptIds.length > 0) {
        const prompts = await promptRepository.findByIds(promptIds);
        bot.prompts = prompts;
      } else {
        bot.prompts = [];
      }
    }

    const updatedBot = await botRepository.save(bot);
    return res.json(updatedBot);
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/bots/:id - Delete bot
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;

    // Find system user for system bots
    const systemUser = await AppDataSource.getRepository(User).findOne({
      where: { email: 'system@platform.com' }
    });

    // Build user IDs array for the query
    const userIds = [userId];
    if (systemUser) {
      userIds.push(systemUser.id);
    }

    const bot = await botRepository.findOne({
      where: {
        id: req.params.id,
        userId: In(userIds)
      }
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    await botRepository.remove(bot);
    return res.json({ message: 'Bot deleted successfully' });
  } catch (error) {
    return next(error);
  }
});

// POST /api/bots/:id/prompts - Add prompts to bot
router.post('/:id/prompts', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { promptIds } = req.body;

    if (!promptIds || !Array.isArray(promptIds)) {
      return res.status(400).json({ error: 'promptIds array is required' });
    }

    // Find system user for system bots
    const systemUser = await AppDataSource.getRepository(User).findOne({
      where: { email: 'system@platform.com' }
    });

    // Build user IDs array for the query
    const userIds = [userId];
    if (systemUser) {
      userIds.push(systemUser.id);
    }

    const bot = await botRepository.findOne({
      where: {
        id: req.params.id,
        userId: In(userIds)
      },
      relations: ['prompts']
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const prompts = await promptRepository.findByIds(promptIds);
    bot.prompts = [...bot.prompts, ...prompts];

    const updatedBot = await botRepository.save(bot);
    return res.json(updatedBot);
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/bots/:id/prompts/:promptId - Remove prompt from bot
router.delete('/:id/prompts/:promptId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;

    // Find system user for system bots
    const systemUser = await AppDataSource.getRepository(User).findOne({
      where: { email: 'system@platform.com' }
    });

    // Build user IDs array for the query
    const userIds = [userId];
    if (systemUser) {
      userIds.push(systemUser.id);
    }

    const bot = await botRepository.findOne({
      where: {
        id: req.params.id,
        userId: In(userIds)
      },
      relations: ['prompts']
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    bot.prompts = bot.prompts.filter(prompt => prompt.id !== req.params.promptId);
    const updatedBot = await botRepository.save(bot);
    return res.json(updatedBot);
  } catch (error) {
    return next(error);
  }
});

export { router as botRoutes };
