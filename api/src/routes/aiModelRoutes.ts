import { Router, Request, Response } from 'express';
import { AIModelService, CreateAIModelDto, UpdateAIModelDto } from '../services/aiModelService.js';
import { LLMServiceFactory } from '../services/llmServiceFactory.js';
import { authenticate } from '../middleware/auth.js';
import { LLMProvider } from '../entities/AIModel.js';

const router = Router();
const aiModelService = new AIModelService();

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const includeInactive = req.query.includeInactive === 'true';
    const aiModels = await aiModelService.findAll(userId, includeInactive);
    return res.json(aiModels);
  } catch (error) {
    console.error('Error fetching AI models:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/default', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const defaultModel = await aiModelService.findDefault(userId);
    return res.json(defaultModel);
  } catch (error) {
    console.error('Error fetching default AI model:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/provider/:provider', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const provider = req.params.provider as LLMProvider;
    const aiModels = await aiModelService.findByProvider(userId, provider);
    return res.json(aiModels);
  } catch (error) {
    console.error('Error fetching AI models by provider:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const id = req.params.id!;
    const aiModel = await aiModelService.findById(id, userId);
    if (!aiModel) {
      return res.status(404).json({ error: 'AI model not found' });
    }
    return res.json(aiModel);
  } catch (error) {
    console.error('Error fetching AI model:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const data: CreateAIModelDto = req.body;
    const aiModel = await aiModelService.create(userId, data);
    return res.status(201).json(aiModel);
  } catch (error) {
    console.error('Error creating AI model:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const id = req.params.id!;
    const data: UpdateAIModelDto = req.body;
    const aiModel = await aiModelService.update(id, userId, data);
    if (!aiModel) {
      return res.status(404).json({ error: 'AI model not found' });
    }
    return res.json(aiModel);
  } catch (error) {
    console.error('Error updating AI model:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/set-default', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const id = req.params.id!;
    const aiModel = await aiModelService.setDefault(id, userId);
    if (!aiModel) {
      return res.status(404).json({ error: 'AI model not found' });
    }
    return res.json(aiModel);
  } catch (error) {
    console.error('Error setting default AI model:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const id = req.params.id!;
    const aiModel = await aiModelService.findById(id, userId);

    if (!aiModel) {
      return res.status(404).json({ error: 'AI model not found' });
    }

    const isConnected = await LLMServiceFactory.testConnection(aiModel);
    return res.json({ connected: isConnected });
  } catch (error) {
    console.error('Error testing AI model connection:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/generate', async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const id = req.params.id!;
  const { prompt, systemPrompt, temperature, maxTokens } = req.body;

  try {
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const aiModel = await aiModelService.findById(id, userId);
    if (!aiModel) {
      return res.status(404).json({ error: 'AI model not found' });
    }

    const response = await LLMServiceFactory.generateResponse(
      aiModel,
      prompt,
      systemPrompt,
      temperature || 0.7,
      maxTokens || 1000
    );

    return res.json({ response: response.content });
  } catch (error) {
    console.error('❌ Error generating response for AI model:', id);
    console.error('📝 Request details:', { prompt, systemPrompt, temperature, maxTokens });
    console.error('🔍 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const id = req.params.id!;
    const success = await aiModelService.delete(id, userId);
    if (!success) {
      return res.status(404).json({ error: 'AI model not found' });
    }
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting AI model:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
