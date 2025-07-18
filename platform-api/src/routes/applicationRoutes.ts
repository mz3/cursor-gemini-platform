import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database.js';
import { Application } from '../entities/Application.js';
import { publishEvent } from '../config/redis.js';

const router = Router();
const applicationRepository = AppDataSource.getRepository(Application);

// GET /api/applications - Get all applications
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applications = await applicationRepository.find({
      where: { status: 'active' },
      relations: ['model'],
      order: { createdAt: 'DESC' }
    });
    return res.json(applications);
  } catch (error) {
    return next(error);
  }
});

// GET /api/applications/:id - Get application by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const application = await applicationRepository.findOne({
      where: { id: req.params.id },
      relations: ['model', 'components']
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    return res.json(application);
  } catch (error) {
    return next(error);
  }
});

// POST /api/applications - Create new application
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, displayName, description, modelId, userId, config } = req.body;

    if (!name || !displayName || !modelId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const application = applicationRepository.create({
      name,
      displayName,
      description: description || '',
      modelId,
      userId,
      config: config || {},
      status: 'draft'
    });

    const savedApplication = await applicationRepository.save(application);
    return res.status(201).json(savedApplication);
  } catch (error) {
    return next(error);
  }
});

// PUT /api/applications/:id - Update application
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const application = await applicationRepository.findOne({
      where: { id: req.params.id }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const { name, displayName, description, config, status } = req.body;

    if (name) application.name = name;
    if (displayName) application.displayName = displayName;
    if (description !== undefined) application.description = description;
    if (config) application.config = config;
    if (status) application.status = status;

    const updatedApplication = await applicationRepository.save(application);
    return res.json(updatedApplication);
  } catch (error) {
    return next(error);
  }
});

// POST /api/applications/:id/build - Build application
router.post('/:id/build', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const application = await applicationRepository.findOne({
      where: { id: req.params.id }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Publish build event to Redis queue
    await publishEvent('app_builds', {
      application_id: application.id,
      action: 'build',
      timestamp: new Date().toISOString()
    });

    // Update application status
    application.status = 'building';
    await applicationRepository.save(application);

    return res.json({
      message: 'Build started successfully',
      applicationId: application.id
    });
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/applications/:id - Delete application
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const application = await applicationRepository.findOne({
      where: { id: req.params.id }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    await applicationRepository.remove(application);
    return res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    return next(error);
  }
});

export { router as applicationRoutes };
