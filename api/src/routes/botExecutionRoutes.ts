import { Router, Request, Response, NextFunction } from 'express';
import { BotExecutionService } from '../services/botExecutionService.js';

const router = Router();

// POST /api/bot-execution/:botId/start - Start a bot instance
router.post('/:botId/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { botId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    if (!botId) {
      return res.status(400).json({ error: 'botId is required' });
    }

    const instance = await BotExecutionService.startBotInstance(botId, userId);
    return res.json(instance);
  } catch (error) {
    return next(error);
  }
});

// POST /api/bot-execution/:botId/stop - Stop a bot instance
router.post('/:botId/stop', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { botId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!botId) {
      return res.status(400).json({ error: 'botId is required' });
    }

    const instance = await BotExecutionService.stopBotInstance(botId, userId);
    return res.json(instance);
  } catch (error) {
    return next(error);
  }
});

// GET /api/bot-execution/:botId/status - Get bot instance status
router.get('/:botId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { botId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!botId) {
      return res.status(400).json({ error: 'botId is required' });
    }

    const instance = await BotExecutionService.getBotInstanceStatus(botId, userId as string);
    return res.json(instance);
  } catch (error) {
    return next(error);
  }
});

// POST /api/bot-execution/:botId/chat - Send a message to a bot
router.post('/:botId/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { botId } = req.params;
    const { userId, message } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }
    if (!botId) {
      return res.status(400).json({ error: 'botId is required' });
    }

    const result = await BotExecutionService.sendMessage(botId, userId, message);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

// GET /api/bot-execution/:botId/chat - Get conversation history
router.get('/:botId/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { botId } = req.params;
    const { userId, limit } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!botId) {
      return res.status(400).json({ error: 'botId is required' });
    }

    const limitNum = limit ? parseInt(limit as string) : 50;
    const messages = await BotExecutionService.getConversationHistory(botId, userId as string, limitNum);
    return res.json(messages);
  } catch (error) {
    return next(error);
  }
});

export default router;
