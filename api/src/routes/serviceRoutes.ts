import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database.js';
import { Service } from '../entities/Service.js';
import { User } from '../entities/User.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const serviceRepository = AppDataSource.getRepository(Service);

// GET /api/services - Get all services for the authenticated user (including system services)
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;

    // Find system user for system services
    const systemUser = await AppDataSource.getRepository(User).findOne({
      where: { email: 'system@platform.com' }
    });

    const whereConditions = [
      { userId } // User's own services
    ];

    // Add system services if system user exists
    if (systemUser) {
      whereConditions.push({ userId: systemUser.id });
    }

    const services = await serviceRepository.find({
      where: whereConditions,
      order: { createdAt: 'DESC' }
    });
    return res.json(services);
  } catch (error) {
    return next(error);
  }
});

// GET /api/services/:id - Get service by ID (user-specific or system service)
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;

    // Find system user for system services
    const systemUser = await AppDataSource.getRepository(User).findOne({
      where: { email: 'system@platform.com' }
    });

    const whereConditions = [
      { id: req.params.id, userId } // User's own service
    ];

    // Add system service condition if system user exists
    if (systemUser) {
      whereConditions.push({ id: req.params.id, userId: systemUser.id });
    }

    const service = await serviceRepository.findOne({
      where: whereConditions
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    return res.json(service);
  } catch (error) {
    return next(error);
  }
});

// POST /api/services - Create new service
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { name, displayName, description, type, endpoint, config, status, healthCheck, authentication } = req.body;

    if (!name || !displayName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const service = serviceRepository.create({
      name,
      displayName,
      description: description || '',
      type: type || 'http',
      endpoint: endpoint || '',
      config: config || null,
      status: status || 'draft',
      healthCheck: healthCheck || null,
      authentication: authentication || null,
      userId,
      isActive: true
    });

    const savedService = await serviceRepository.save(service);
    return res.status(201).json(savedService);
  } catch (error) {
    return next(error);
  }
});

// PUT /api/services/:id - Update service
router.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const service = await serviceRepository.findOne({
      where: { id: req.params.id, userId }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const { name, displayName, description, isActive, type, endpoint, config, status, healthCheck, authentication } = req.body;

    if (name) service.name = name;
    if (displayName) service.displayName = displayName;
    if (description !== undefined) service.description = description;
    if (isActive !== undefined) service.isActive = isActive;
    if (type) service.type = type;
    if (endpoint !== undefined) service.endpoint = endpoint;
    if (config !== undefined) service.config = config;
    if (status) service.status = status;
    if (healthCheck !== undefined) service.healthCheck = healthCheck;
    if (authentication !== undefined) service.authentication = authentication;

    const updatedService = await serviceRepository.save(service);
    return res.json(updatedService);
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/services/:id - Delete service
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const service = await serviceRepository.findOne({
      where: { id: req.params.id, userId }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await serviceRepository.remove(service);
    return res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    return next(error);
  }
});

export { router as serviceRoutes };
