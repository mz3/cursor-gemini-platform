import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Prompt, PromptType } from '../entities/Prompt';
import { User } from '../entities/User';
import jwt from 'jsonwebtoken';

const router = Router();
const promptRepository = AppDataSource.getRepository(Prompt);
const userRepository = AppDataSource.getRepository(User);

// Middleware to authenticate user
const authenticateUser = async (req: Request, res: Response, next: Function) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production') as any;
    const user = await userRepository.findOne({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Create a new prompt
router.post('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { name, content, type, description } = req.body;
    const user = (req as any).user;

    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }

    const prompt = new Prompt();
    prompt.name = name;
    prompt.content = content;
    prompt.type = type || PromptType.LLM;
    prompt.description = description;
    prompt.version = 1;
    prompt.isActive = true;
    prompt.userId = user.id;

    const savedPrompt = await promptRepository.save(prompt);
    res.status(201).json(savedPrompt);
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({ error: 'Failed to create prompt' });
  }
});

// Get all prompts for a user
router.get('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const prompts = await promptRepository.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' }
    });

    // Group by prompt name and get the latest version
    const promptMap = new Map();
    prompts.forEach(prompt => {
      if (!promptMap.has(prompt.name) || promptMap.get(prompt.name).version < prompt.version) {
        promptMap.set(prompt.name, prompt);
      }
    });

    res.json(Array.from(promptMap.values()));
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

// Get a specific prompt by ID
router.get('/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const prompt = await promptRepository.findOne({
      where: { id, userId: user.id }
    });

    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    res.json(prompt);
  } catch (error) {
    console.error('Error fetching prompt:', error);
    res.status(500).json({ error: 'Failed to fetch prompt' });
  }
});

// Update a prompt (creates a new version)
router.put('/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, content, type, description } = req.body;
    const user = (req as any).user;

    const existingPrompt = await promptRepository.findOne({
      where: { id, userId: user.id }
    });

    if (!existingPrompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Create a new version
    const newPrompt = new Prompt();
    newPrompt.name = name || existingPrompt.name;
    newPrompt.content = content || existingPrompt.content;
    newPrompt.type = type || existingPrompt.type;
    newPrompt.description = description || existingPrompt.description;
    newPrompt.version = existingPrompt.version + 1;
    newPrompt.isActive = true;
    newPrompt.userId = user.id;
    newPrompt.parentPromptId = existingPrompt.id;

    // Deactivate the old version
    existingPrompt.isActive = false;
    await promptRepository.save(existingPrompt);

    const savedPrompt = await promptRepository.save(newPrompt);
    res.json(savedPrompt);
  } catch (error) {
    console.error('Error updating prompt:', error);
    res.status(500).json({ error: 'Failed to update prompt' });
  }
});

// Get all versions of a prompt
router.get('/:id/versions', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Find the original prompt
    const originalPrompt = await promptRepository.findOne({
      where: { id, userId: user.id }
    });

    if (!originalPrompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Get all versions (original + all children)
    const allVersions = await promptRepository.find({
      where: [
        { id: originalPrompt.id, userId: user.id },
        { parentPromptId: originalPrompt.id, userId: user.id }
      ],
      order: { version: 'ASC' }
    });

    res.json(allVersions);
  } catch (error) {
    console.error('Error fetching prompt versions:', error);
    res.status(500).json({ error: 'Failed to fetch prompt versions' });
  }
});

// Delete a prompt
router.delete('/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const prompt = await promptRepository.findOne({
      where: { id, userId: user.id }
    });

    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    await promptRepository.remove(prompt);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({ error: 'Failed to delete prompt' });
  }
});

export default router;
