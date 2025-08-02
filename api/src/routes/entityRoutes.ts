import { Router, Request, Response, NextFunction } from 'express';
import { EntityService } from '../services/entityService.js';

const router = Router();

// GET /api/entities - Get all entities for the authenticated user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const entities = await EntityService.getEntitiesByUser(userId);
    return res.json(entities);
  } catch (error) {
    return next(error);
  }
});

// GET /api/entities/:modelId - Get all entities for a specific model
router.get('/model/:modelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!modelId) {
      return res.status(400).json({ error: 'Model ID is required' });
    }

    const entities = await EntityService.getEntitiesByModel(modelId, userId);
    return res.json(entities);
  } catch (error) {
    return next(error);
  }
});

// GET /api/entities/:id - Get a specific entity
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Entity ID is required' });
    }

    const entity = await EntityService.getEntityById(id, userId);
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    return res.json(entity);
  } catch (error) {
    return next(error);
  }
});

// POST /api/entities - Create a new entity
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, displayName, data, modelId } = req.body;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!name || !displayName || !data || !modelId) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, displayName, data, modelId' 
      });
    }

    const entity = await EntityService.createEntity({
      name,
      displayName,
      data,
      modelId,
      userId
    });

    return res.status(201).json(entity);
  } catch (error) {
    return next(error);
  }
});

// PUT /api/entities/:id - Update an entity
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { data } = req.body;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Entity ID is required' });
    }

    if (!data) {
      return res.status(400).json({ error: 'Missing required field: data' });
    }

    const entity = await EntityService.updateEntity(id, userId, data);
    return res.json(entity);
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/entities/:id - Delete an entity
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Entity ID is required' });
    }

    await EntityService.deleteEntity(id, userId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router; 