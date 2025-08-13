import { Router } from 'express';
import { AppDataSource } from '../config/database.js';
import { Relationship } from '../entities/Relationship.js';

const router = Router();
const relationshipRepo = AppDataSource.getRepository(Relationship);

// GET /api/relationships - Get all relationships
router.get('/', async (req, res, next) => {
  try {
    const relationships = await relationshipRepo.find({
      order: { createdAt: 'ASC' }
    });
    return res.json(relationships);
  } catch (error) {
    return next(error);
  }
});

// GET /api/relationships/:id - Get relationship by ID
router.get('/:id', async (req, res, next) => {
  try {
    const relationship = await relationshipRepo.findOne({
      where: { id: req.params.id }
    });

    if (!relationship) {
      return res.status(404).json({ error: 'Relationship not found' });
    }

    return res.json(relationship);
  } catch (error) {
    return next(error);
  }
});

// POST /api/relationships - Create new relationship
router.post('/', async (req, res, next) => {
  try {
    const { name, displayName, type, sourceSchemaId, targetSchemaId, sourceField, targetField, cascade, nullable, description, userId } = req.body;

    if (!name || !displayName || !type || !sourceSchemaId || !targetSchemaId || !sourceField || !targetField || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const relationship = relationshipRepo.create({
      name,
      displayName,
      type,
      sourceSchemaId,
      targetSchemaId,
      sourceField,
      targetField,
      cascade: cascade || false,
      nullable: nullable !== undefined ? nullable : true,
      description,
      userId
    });

    const savedRelationship = await relationshipRepo.save(relationship);
    return res.status(201).json(savedRelationship);
  } catch (error) {
    return next(error);
  }
});

// PUT /api/relationships/:id - Update relationship
router.put('/:id', async (req, res, next) => {
  try {
    const relationship = await relationshipRepo.findOne({
      where: { id: req.params.id }
    });

    if (!relationship) {
      return res.status(404).json({ error: 'Relationship not found' });
    }

    const { name, displayName, type, targetSchemaId, sourceField, targetField, cascade, nullable, description } = req.body;

    if (name) relationship.name = name;
    if (displayName) relationship.displayName = displayName;
    if (type) relationship.type = type;
    if (targetSchemaId) relationship.targetSchemaId = targetSchemaId;
    if (sourceField) relationship.sourceField = sourceField;
    if (targetField) relationship.targetField = targetField;
    if (cascade !== undefined) relationship.cascade = cascade;
    if (nullable !== undefined) relationship.nullable = nullable;
    if (description !== undefined) relationship.description = description;

    const updatedRelationship = await relationshipRepo.save(relationship);
    return res.json(updatedRelationship);
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/relationships/:id - Delete relationship
router.delete('/:id', async (req, res, next) => {
  try {
    const relationship = await relationshipRepo.findOne({
      where: { id: req.params.id }
    });

    if (!relationship) {
      return res.status(404).json({ error: 'Relationship not found' });
    }

    await relationshipRepo.remove(relationship);
    return res.json({ message: 'Relationship deleted successfully' });
  } catch (error) {
    return next(error);
  }
});

export { router as relationshipRoutes };
