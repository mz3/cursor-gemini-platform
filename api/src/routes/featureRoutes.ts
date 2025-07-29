import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database.js';
import { Feature } from '../entities/Feature.js';
import { Application } from '../entities/Application.js';

const router = Router();
const featureRepository = AppDataSource.getRepository(Feature);
const applicationRepository = AppDataSource.getRepository(Application);

// GET /api/features - Get all features
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const features = await featureRepository.find({
      relations: ['applications'],
      order: { createdAt: 'DESC' }
    });
    return res.json(features);
  } catch (error) {
    return next(error);
  }
});

// GET /api/features/:id - Get feature by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const feature = await featureRepository.findOne({
      where: { id },
      relations: ['applications']
    });

    if (!feature) {
      return res.status(404).json({ error: 'Feature not found' });
    }

    return res.json(feature);
  } catch (error) {
    return next(error);
  }
});

// POST /api/features - Create new feature
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, displayName, description, isActive, config, status, userId, applicationIds } = req.body;

    if (!name || !displayName || !userId) {
      return res.status(400).json({ error: 'Name, displayName, and userId are required' });
    }

    const feature = featureRepository.create({
      name,
      displayName,
      description,
      isActive: isActive !== undefined ? isActive : true,
      config,
      status: status || 'draft',
      userId
    });

    // Associate with applications if provided
    if (applicationIds && Array.isArray(applicationIds) && applicationIds.length > 0) {
      const applications = await applicationRepository.findByIds(applicationIds);
      feature.applications = applications;
    }

    const savedFeature = await featureRepository.save(feature);

    // Return the saved feature with relations
    const featureWithRelations = await featureRepository.findOne({
      where: { id: savedFeature.id },
      relations: ['applications']
    });

    return res.status(201).json(featureWithRelations);
  } catch (error) {
    return next(error);
  }
});

// PUT /api/features/:id - Update feature
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, displayName, description, isActive, config, status, applicationIds } = req.body;

    const feature = await featureRepository.findOne({
      where: { id },
      relations: ['applications']
    });

    if (!feature) {
      return res.status(404).json({ error: 'Feature not found' });
    }

    // Update basic fields
    if (name !== undefined) feature.name = name;
    if (displayName !== undefined) feature.displayName = displayName;
    if (description !== undefined) feature.description = description;
    if (isActive !== undefined) feature.isActive = isActive;
    if (config !== undefined) feature.config = config;
    if (status !== undefined) feature.status = status;

    // Update application associations if provided
    if (applicationIds !== undefined) {
      if (Array.isArray(applicationIds) && applicationIds.length > 0) {
        const applications = await applicationRepository.findByIds(applicationIds);
        feature.applications = applications;
      } else {
        feature.applications = [];
      }
    }

    const updatedFeature = await featureRepository.save(feature);

    // Return the updated feature with relations
    const featureWithRelations = await featureRepository.findOne({
      where: { id: updatedFeature.id },
      relations: ['applications']
    });

    return res.json(featureWithRelations);
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/features/:id - Delete feature
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const feature = await featureRepository.findOne({ where: { id } });

    if (!feature) {
      return res.status(404).json({ error: 'Feature not found' });
    }

    await featureRepository.remove(feature);
    return res.json({ message: 'Feature deleted successfully' });
  } catch (error) {
    return next(error);
  }
});

export { router as featureRoutes };
