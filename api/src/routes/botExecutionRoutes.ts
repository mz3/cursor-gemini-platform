import { Router, Request, Response, NextFunction } from 'express';
import { BotExecutionService } from '../services/botExecutionService.js';
import jwt from 'jsonwebtoken';

const router = Router();

// Authentication middleware
const authenticateUser = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication token required' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
    return;
  }
};

// POST /api/bot-execution/:botId/start - Start a bot instance
router.post('/:botId/start', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { botId } = req.params;
    const userId = (req as any).user.userId;

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
router.post('/:botId/stop', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { botId } = req.params;
    const userId = (req as any).user.userId;

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
router.get('/:botId/status', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { botId } = req.params;
    const userId = (req as any).user.userId;

    if (!botId) {
      return res.status(400).json({ error: 'botId is required' });
    }

    const instance = await BotExecutionService.getBotInstanceStatus(botId, userId);
    return res.json(instance);
  } catch (error) {
    return next(error);
  }
});

// POST /api/bot-execution/:botId/chat - Send a message to a bot
router.post('/:botId/chat', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { botId } = req.params;
    const { message } = req.body;
    const userId = (req as any).user.userId;

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
router.get('/:botId/chat', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { botId } = req.params;
    const { limit } = req.query;
    const userId = (req as any).user.userId;

    if (!botId) {
      return res.status(400).json({ error: 'botId is required' });
    }

    const limitNum = limit ? parseInt(limit as string) : 50;
    const messages = await BotExecutionService.getConversationHistory(botId, userId, limitNum);
    return res.json(messages);
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/bot-execution/:botId/chat - Clear conversation history
router.delete('/:botId/chat', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { botId } = req.params;
    const userId = (req as any).user.userId;

    if (!botId) {
      return res.status(400).json({ error: 'botId is required' });
    }

    await BotExecutionService.clearConversationHistory(botId, userId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
