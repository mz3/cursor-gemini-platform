import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

// POST /api/bot-execution/:botId/start - Start a bot instance
router.post('/:botId/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { botId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Simple response for now
    return res.json({ 
      id: 'test-instance-id',
      botId,
      userId,
      status: 'running',
      lastStartedAt: new Date().toISOString()
    });
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

    // Simple response for now
    return res.json({ 
      id: 'test-instance-id',
      botId,
      userId,
      status: 'stopped',
      lastStoppedAt: new Date().toISOString()
    });
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

    // Simple response for now
    return res.json({ 
      id: 'test-instance-id',
      botId,
      userId,
      status: 'running'
    });
  } catch (error) {
    return next(error);
  }
});

// POST /api/bot-execution/:botId/chat - Send a message to a bot
router.post('/:botId/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { botId } = req.params;
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required' });
    }

    // Simple response for now
    return res.json({
      userMessage: {
        id: 'user-msg-id',
        role: 'user',
        content: message,
        createdAt: new Date().toISOString()
      },
      botResponse: {
        id: 'bot-msg-id',
        role: 'bot',
        content: `I received your message: "${message}". This is a test response.`,
        createdAt: new Date().toISOString()
      }
    });
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

    // Simple response for now
    return res.json([]);
  } catch (error) {
    return next(error);
  }
});

export { router as botExecutionRoutes }; 