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

    // Use QueryBuilder for explicit OR condition
    let query = serviceRepository.createQueryBuilder('service')
      .where('service.userId = :userId', { userId });

    if (systemUser) {
      query = query.orWhere('service.userId = :systemUserId', { systemUserId: systemUser.id });
    }

    const services = await query.orderBy('service.createdAt', 'DESC').getMany();
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

    // Use query builder for explicit OR condition
    let serviceQuery = serviceRepository.createQueryBuilder('service')
      .where('service.id = :id AND service.userId = :userId', { id: req.params.id, userId });

    // Add system service condition if system user exists
    if (systemUser) {
      serviceQuery = serviceQuery.orWhere('service.id = :id AND service.userId = :systemUserId', { id: req.params.id, systemUserId: systemUser.id });
    }

    const service = await serviceQuery.getOne();

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
