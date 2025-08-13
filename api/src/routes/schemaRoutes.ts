import { Router } from 'express';
import { AppDataSource } from '../config/database.js';
import { Schema } from '../entities/Schema.js';
import { Relationship } from '../entities/Relationship.js';
import { User } from '../entities/User.js';

const router = Router();
const schemaRepository = AppDataSource.getRepository(Schema);

// GET /api/schemas - Get all schemas
router.get('/', async (req, res, next) => {
  try {
    const schemas = await schemaRepository.find({
      order: { createdAt: 'ASC' }
    });
    return res.json(schemas);
  } catch (error) {
    return next(error);
  }
});

// GET /api/schemas/:id - Get schema by ID with user information
router.get('/:id', async (req, res, next) => {
  try {
    const schema = await schemaRepository.findOne({
      where: { id: req.params.id },
      relations: ['user']
    });

    if (!schema) {
      return res.status(404).json({ error: 'Schema not found' });
    }

    return res.json(schema);
  } catch (error) {
    return next(error);
  }
});

// POST /api/schemas - Create new schema (with optional relationships)
router.post('/', async (req, res, next) => {
  try {
    const { name, displayName, description, schema, userId, relationships } = req.body;

    if (!name || !displayName || !schema || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const schemaEntity = schemaRepository.create({
      name,
      displayName,
      description,
      schema,
      userId,
      isSystem: false
    });

    const savedSchema = await schemaRepository.save(schemaEntity);

    // Create relationships if provided
    let createdRelationships = [];
    if (Array.isArray(relationships) && relationships.length > 0) {
      const relationshipRepo = AppDataSource.getRepository(Relationship);
      for (const rel of relationships) {
        const relationship = relationshipRepo.create({ ...rel, sourceSchemaId: savedSchema.id, userId });
        await relationshipRepo.save(relationship);
        createdRelationships.push(relationship);
      }
    }

    return res.status(201).json({ ...savedSchema, relationships: createdRelationships });
  } catch (error) {
    return next(error);
  }
});

// GET /api/schemas/:id/relationships - Get relationships for a schema
router.get('/:id/relationships', async (req, res, next) => {
  try {
    const relationshipRepo = AppDataSource.getRepository(Relationship);
    const relationships = await relationshipRepo.find({ where: { sourceSchemaId: req.params.id } });
    return res.json(relationships);
  } catch (error) {
    return next(error);
  }
});

// PUT /api/schemas/:id - Update schema
router.put('/:id', async (req, res, next) => {
  try {
    const schema = await schemaRepository.findOne({
      where: { id: req.params.id }
    });

    if (!schema) {
      return res.status(404).json({ error: 'Schema not found' });
    }

    const { name, displayName, description, schema: schemaData } = req.body;

    if (name) schema.name = name;
    if (displayName) schema.displayName = displayName;
    if (description !== undefined) schema.description = description;
    if (schemaData) schema.schema = schemaData;

    const updatedSchema = await schemaRepository.save(schema);
    return res.json(updatedSchema);
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/schemas/:id - Delete schema
router.delete('/:id', async (req, res, next) => {
  try {
    const schema = await schemaRepository.findOne({
      where: { id: req.params.id }
    });

    if (!schema) {
      return res.status(404).json({ error: 'Schema not found' });
    }

    await schemaRepository.remove(schema);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export { router as schemaRoutes };
