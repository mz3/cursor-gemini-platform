import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Model } from '../entities/Model';
import { Relationship } from '../entities/Relationship';

const router = Router();
const modelRepository = AppDataSource.getRepository(Model);

// GET /api/models - Get all models
router.get('/', async (req, res, next) => {
  try {
    const models = await modelRepository.find({
      where: { isActive: true },
      order: { createdAt: 'ASC' }
    });
    return res.json(models);
  } catch (error) {
    return next(error);
  }
});

// GET /api/models/:id - Get model by ID
router.get('/:id', async (req, res, next) => {
  try {
    const model = await modelRepository.findOne({
      where: { id: req.params.id, isActive: true }
    });

    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    return res.json(model);
  } catch (error) {
    return next(error);
  }
});

// POST /api/models - Create new model (with optional relationships)
router.post('/', async (req, res, next) => {
  try {
    const { name, displayName, schema, userId, relationships } = req.body;

    if (!name || !displayName || !schema || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const model = modelRepository.create({
      name,
      displayName,
      schema,
      userId,
      isSystem: false
    });

    const savedModel = await modelRepository.save(model);

    // Create relationships if provided
    let createdRelationships = [];
    if (Array.isArray(relationships) && relationships.length > 0) {
      const relationshipRepo = AppDataSource.getRepository(Relationship);
      for (const rel of relationships) {
        const relationship = relationshipRepo.create({ ...rel, sourceModelId: savedModel.id, userId });
        await relationshipRepo.save(relationship);
        createdRelationships.push(relationship);
      }
    }

    return res.status(201).json({ ...savedModel, relationships: createdRelationships });
  } catch (error) {
    return next(error);
  }
});

// GET /api/models/:id/relationships - Get relationships for a model
router.get('/:id/relationships', async (req, res, next) => {
  try {
    const relationshipRepo = AppDataSource.getRepository(Relationship);
    const relationships = await relationshipRepo.find({ where: { sourceModelId: req.params.id } });
    return res.json(relationships);
  } catch (error) {
    return next(error);
  }
});

// PUT /api/models/:id - Update model
router.put('/:id', async (req, res, next) => {
  try {
    const model = await modelRepository.findOne({
      where: { id: req.params.id, isActive: true }
    });

    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    const { name, displayName, schema } = req.body;

    if (name) model.name = name;
    if (displayName) model.displayName = displayName;
    if (schema) model.schema = schema;

    const updatedModel = await modelRepository.save(model);
    return res.json(updatedModel);
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/models/:id - Delete model
router.delete('/:id', async (req, res, next) => {
  try {
    const model = await modelRepository.findOne({
      where: { id: req.params.id, isActive: true }
    });

    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    model.isActive = false;
    await modelRepository.save(model);

    return res.json({ message: 'Model deleted successfully' });
  } catch (error) {
    return next(error);
  }
});

export { router as modelRoutes };
