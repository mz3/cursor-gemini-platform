import { Router, Request, Response, NextFunction } from 'express';
import { EntityService } from '../services/entityService.js';
import jwt from 'jsonwebtoken';

const router = Router();

// Helper function to extract user from JWT token
const extractUserFromToken = (req: Request): any => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    return decoded;
  } catch (error) {
    return null;
  }
};

// GET /api/entities - Get all entities for the authenticated user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = extractUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const entities = await EntityService.getEntitiesByUser(user.userId);
    return res.json(entities);
  } catch (error) {
    return next(error);
  }
});

// GET /api/entities/:schemaId - Get all entities for a specific schema
router.get('/schema/:schemaId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { schemaId } = req.params;
    const user = extractUserFromToken(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!schemaId) {
      return res.status(400).json({ error: 'Schema ID is required' });
    }

    const entities = await EntityService.getEntitiesBySchema(schemaId, user.userId);
    return res.json(entities);
  } catch (error) {
    return next(error);
  }
});

// GET /api/entities/:id - Get a specific entity
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = extractUserFromToken(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Entity ID is required' });
    }

    const entity = await EntityService.getEntityById(id, user.userId);
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
    const { name, displayName, data, schemaId } = req.body;
    const user = extractUserFromToken(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!name || !displayName || !data || !schemaId) {
      return res.status(400).json({
        error: 'Missing required fields: name, displayName, data, schemaId'
      });
    }

    const entity = await EntityService.createEntity({
      name,
      displayName,
      data,
      schemaId,
      userId: user.userId
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
    const user = extractUserFromToken(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Entity ID is required' });
    }

    if (!data) {
      return res.status(400).json({ error: 'Missing required field: data' });
    }

    const entity = await EntityService.updateEntity(id, user.userId, data);
    return res.json(entity);
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/entities/:id - Delete an entity
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = extractUserFromToken(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Entity ID is required' });
    }

    await EntityService.deleteEntity(id, user.userId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
