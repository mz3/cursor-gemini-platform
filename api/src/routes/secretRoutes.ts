import { Router, Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { SecretService, CreateSecretDto, UpdateSecretDto } from '../services/secretService.js';
import { authenticate } from '../middleware/auth.js';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  DatabaseError
} from '../middleware/errorHandler.js';

const router = Router();
const secretService = new SecretService();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * GET /api/secrets
 * Get all secrets for the authenticated user
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const secrets = await secretService.findAll(userId);
    res.json(secrets);
  } catch (error) {
    next(new DatabaseError('Failed to retrieve secrets'));
  }
});

/**
 * GET /api/secrets/:id
 * Get a specific secret by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    if (!id) {
      return next(new ValidationError('Secret ID is required'));
    }

    const secret = await secretService.findById(id, userId);
    if (!secret) {
      return next(new NotFoundError('Secret not found'));
    }

    res.json(secret);
  } catch (error) {
    next(new DatabaseError('Failed to retrieve secret'));
  }
});

/**
 * POST /api/secrets
 * Create a new secret
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { name, description, key, value, type, provider } = req.body;

    // Validate required fields
    if (!name || !key || !value || !type) {
      return next(new ValidationError('Name, key, value, and type are required'));
    }

    // Validate type
    const validTypes = ['api_key', 'oauth_token', 'bearer_token', 'basic_auth', 'custom'];
    if (!validTypes.includes(type)) {
      return next(new ValidationError('Invalid secret type'));
    }

    const dto: CreateSecretDto = {
      name,
      description,
      key,
      value,
      type,
      provider
    };

    const secret = await secretService.create(dto, userId);
    res.status(201).json(secret);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'A secret with this name already exists') {
        return next(new ConflictError(error.message));
      }
      if (error.message === 'User not found') {
        return next(new NotFoundError(error.message));
      }
    }
    next(new DatabaseError('Failed to create secret'));
  }
});

/**
 * PUT /api/secrets/:id
 * Update an existing secret
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { name, description, key, value, type, provider, isActive } = req.body;

    if (!id) {
      return next(new ValidationError('Secret ID is required'));
    }

    // Validate type if provided
    if (type) {
      const validTypes = ['api_key', 'oauth_token', 'bearer_token', 'basic_auth', 'custom'];
      if (!validTypes.includes(type)) {
        return next(new ValidationError('Invalid secret type'));
      }
    }

    const dto: UpdateSecretDto = {
      name,
      description,
      key,
      value,
      type,
      provider,
      isActive
    };

    const secret = await secretService.update(id, dto, userId);
    res.json(secret);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Secret not found') {
        return next(new NotFoundError(error.message));
      }
      if (error.message === 'A secret with this name already exists') {
        return next(new ConflictError(error.message));
      }
    }
    next(new DatabaseError('Failed to update secret'));
  }
});

/**
 * DELETE /api/secrets/:id
 * Delete a secret
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    if (!id) {
      return next(new ValidationError('Secret ID is required'));
    }

    await secretService.delete(id, userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Secret not found') {
      return next(new NotFoundError(error.message));
    }
    next(new DatabaseError('Failed to delete secret'));
  }
});

/**
 * POST /api/secrets/:id/test
 * Test if a secret can be decrypted (for health checks)
 */
router.post('/:id/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    if (!id) {
      return next(new ValidationError('Secret ID is required'));
    }

    const canDecrypt = await secretService.testDecryption(id, userId);
    res.json({ canDecrypt });
  } catch (error) {
    next(new DatabaseError('Failed to test secret decryption'));
  }
});

export { router as secretRoutes };
