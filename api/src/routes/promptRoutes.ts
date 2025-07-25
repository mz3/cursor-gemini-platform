import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Prompt } from '../entities/Prompt.js';
import { PromptVersion } from '../entities/PromptVersion.js';
import { User } from '../entities/User.js';
import jwt from 'jsonwebtoken';

const router = Router();
const promptRepository = AppDataSource.getRepository(Prompt);
const promptVersionRepository = AppDataSource.getRepository(PromptVersion);
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
    return;
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

    // Create the prompt container
    const prompt = new Prompt();
    prompt.name = name;
    prompt.description = description;
    prompt.userId = user.id;

    const savedPrompt = await promptRepository.save(prompt);

    // Create the first version
    const promptVersion = new PromptVersion();
    promptVersion.name = name;
    promptVersion.content = content;
    promptVersion.type = type || 'llm';
    promptVersion.description = description;
    promptVersion.version = 1;
    promptVersion.isActive = true;
    promptVersion.promptId = savedPrompt.id;

    const savedVersion = await promptVersionRepository.save(promptVersion);

    // Return the prompt with the version data
    return res.status(201).json({
      ...savedPrompt,
      content: savedVersion.content,
      type: savedVersion.type,
      version: savedVersion.version,
      isActive: savedVersion.isActive
    });
  } catch (error) {
    console.error('Error creating prompt:', error);
    return res.status(500).json({ error: 'Failed to create prompt' });
  }
});

// Get all prompts for a user
router.get('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const prompts = await promptRepository.find({
      where: { userId: user.id },
      relations: ['versions'],
      order: { createdAt: 'DESC' }
    });

    // Return prompts with their latest active version
    const promptsWithLatestVersion = prompts.map(prompt => {
      const activeVersion = prompt.versions.find(v => v.isActive);
      if (!activeVersion) return null;

      return {
        id: prompt.id,
        name: activeVersion.name,
        content: activeVersion.content,
        type: activeVersion.type,
        version: activeVersion.version,
        description: activeVersion.description,
        isActive: activeVersion.isActive,
        userId: prompt.userId,
        createdAt: prompt.createdAt,
        updatedAt: prompt.updatedAt
      };
    }).filter(Boolean);

    return res.json(promptsWithLatestVersion);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

// Get a specific prompt by ID
router.get('/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const prompt = await promptRepository.findOne({
      where: { id, userId: user.id },
      relations: ['versions']
    });

    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    const activeVersion = prompt.versions.find(v => v.isActive);
    if (!activeVersion) {
      return res.status(404).json({ error: 'No active version found' });
    }

    return res.json({
      id: prompt.id,
      name: activeVersion.name,
      content: activeVersion.content,
      type: activeVersion.type,
      version: activeVersion.version,
      description: activeVersion.description,
      isActive: activeVersion.isActive,
      userId: prompt.userId,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt
    });
  } catch (error) {
    console.error('Error fetching prompt:', error);
    return res.status(500).json({ error: 'Failed to fetch prompt' });
  }
});

// Update a prompt (creates a new version)
router.put('/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, content, type, description } = req.body;
    const user = (req as any).user;

    const prompt = await promptRepository.findOne({
      where: { id, userId: user.id },
      relations: ['versions']
    });

    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Find the current active version
    const currentVersion = prompt.versions.find(v => v.isActive);
    if (!currentVersion) {
      return res.status(404).json({ error: 'No active version found' });
    }

    console.log('DEBUG currentVersion:', { id: currentVersion.id, version: currentVersion.version, isActive: currentVersion.isActive, name: currentVersion.name });

    // Deactivate the current version
    currentVersion.isActive = false;
    await promptVersionRepository.save(currentVersion);

    // Create a new version
    const newVersion = new PromptVersion();
    newVersion.name = name || currentVersion.name;
    newVersion.content = content || currentVersion.content;
    newVersion.type = type || currentVersion.type;
    newVersion.description = description || currentVersion.description;
    newVersion.version = currentVersion.version + 1;
    newVersion.isActive = true;
    newVersion.promptId = prompt.id;

    console.log('DEBUG newVersion:', { version: newVersion.version, name: newVersion.name, content: newVersion.content });

    const savedVersion = await promptVersionRepository.save(newVersion);

    return res.json({
      id: prompt.id,
      name: savedVersion.name,
      content: savedVersion.content,
      type: savedVersion.type,
      version: savedVersion.version,
      description: savedVersion.description,
      isActive: savedVersion.isActive,
      userId: prompt.userId,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt
    });
  } catch (error) {
    console.error('Error updating prompt:', error);
    return res.status(500).json({ error: 'Failed to update prompt' });
  }
});

// Get all versions of a prompt
router.get('/:id/versions', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const prompt = await promptRepository.findOne({
      where: { id, userId: user.id },
      relations: ['versions']
    });

    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Return versions ordered by version number
    const versions = prompt.versions.sort((a, b) => a.version - b.version);
    return res.json(versions);
  } catch (error) {
    console.error('Error fetching prompt versions:', error);
    return res.status(500).json({ error: 'Failed to fetch prompt versions' });
  }
});

// Delete a prompt (and all its versions)
router.delete('/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const prompt = await promptRepository.findOne({
      where: { id, userId: user.id },
      relations: ['versions']
    });

    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Delete all versions first
    if (prompt.versions && prompt.versions.length > 0) {
      await promptVersionRepository.remove(prompt.versions);
    }

    // Then delete the prompt
    await promptRepository.remove(prompt);
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return res.status(500).json({ error: 'Failed to delete prompt' });
  }
});

export default router;
