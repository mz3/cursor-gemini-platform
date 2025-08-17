import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { requireFeatureFlag } from '../middleware/featureFlag.js';
import { seedDatabase } from '../utils/seedDatabase.js';
import { featureFlagService } from '../services/featureFlagService.js';
import { AppDataSource } from '../config/database.js';
import { Role } from '../entities/Role.js';
import { Permission } from '../entities/Permission.js';
import { FeatureFlag } from '../entities/FeatureFlag.js';

const router = Router();

// Apply authentication and admin role to all admin routes
router.use(authenticate);
router.use(requireAdmin);

// POST /api/admin/seed - Seed the database (admin only, behind feature flag)
router.post('/seed', requireFeatureFlag('admin_database_seed'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🌱 Admin-triggered database seeding started...');
    await seedDatabase();
    console.log('✅ Admin-triggered database seeding completed');

    res.json({
      success: true,
      message: 'Database seeded successfully'
    });
  } catch (error) {
    console.error('💥 Admin-triggered seeding failed:', error);
    next(error);
  }
});

// GET /api/admin/feature-flags - Get all feature flags
router.get('/feature-flags', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const featureFlags = await featureFlagService.getAllFeatureFlags();
    res.json(featureFlags);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/feature-flags - Create a new feature flag
router.post('/feature-flags', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const featureFlag = await featureFlagService.createFeatureFlag(req.body);
    res.status(201).json(featureFlag);
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/feature-flags/:key - Update a feature flag
router.put('/feature-flags/:key', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const key = req.params.key;
    if (!key) {
      res.status(400).json({ error: 'Feature flag key is required' });
      return;
    }

    const featureFlag = await featureFlagService.updateFeatureFlag(key, req.body);
    if (!featureFlag) {
      res.status(404).json({ error: 'Feature flag not found' });
      return;
    }
    res.json(featureFlag);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/feature-flags/:key - Delete a feature flag
router.delete('/feature-flags/:key', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const key = req.params.key;
    if (!key) {
      res.status(400).json({ error: 'Feature flag key is required' });
      return;
    }

    const deleted = await featureFlagService.deleteFeatureFlag(key);
    if (!deleted) {
      res.status(404).json({ error: 'Feature flag not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/roles - Get all roles
router.get('/roles', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const roleRepository = AppDataSource.getRepository(Role);
    const roles = await roleRepository.find({
      relations: ['permissions'],
      order: { name: 'ASC' }
    });
    res.json(roles);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/permissions - Get all permissions
router.get('/permissions', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const permissionRepository = AppDataSource.getRepository(Permission);
    const permissions = await permissionRepository.find({
      order: { resource: 'ASC', action: 'ASC' }
    });
    res.json(permissions);
  } catch (error) {
    next(error);
  }
});

export default router;
