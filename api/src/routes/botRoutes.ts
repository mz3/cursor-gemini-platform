import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database.js';
import { Bot } from '../entities/Bot.js';
import { Prompt } from '../entities/Prompt.js';

const router = Router();
const botRepository = AppDataSource.getRepository(Bot);
const promptRepository = AppDataSource.getRepository(Prompt);

// GET /api/bots - Get all bots
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bots = await botRepository.find({
      relations: ['prompts'],
      order: { createdAt: 'DESC' }
    });
    return res.json(bots);
  } catch (error) {
    return next(error);
  }
});

// GET /api/bots/:id - Get bot by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bot = await botRepository.findOne({
      where: { id: req.params.id },
      relations: ['prompts']
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
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, displayName, description, userId, promptIds } = req.body;

    if (!name || !displayName || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const bot = botRepository.create({
      name,
      displayName,
      description: description || '',
      userId,
      isActive: true
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
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bot = await botRepository.findOne({
      where: { id: req.params.id },
      relations: ['prompts']
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const { name, displayName, description, isActive, promptIds } = req.body;

    if (name) bot.name = name;
    if (displayName) bot.displayName = displayName;
    if (description !== undefined) bot.description = description;
    if (isActive !== undefined) bot.isActive = isActive;

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
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bot = await botRepository.findOne({
      where: { id: req.params.id }
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
router.post('/:id/prompts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { promptIds } = req.body;

    if (!promptIds || !Array.isArray(promptIds)) {
      return res.status(400).json({ error: 'promptIds array is required' });
    }

    const bot = await botRepository.findOne({
      where: { id: req.params.id },
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
router.delete('/:id/prompts/:promptId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bot = await botRepository.findOne({
      where: { id: req.params.id },
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
