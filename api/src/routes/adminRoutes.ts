import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { requireFeatureFlag } from '../middleware/featureFlag.js';
import { seedDatabase } from '../utils/seedDatabase.js';
import { featureFlagService } from '../services/featureFlagService.js';
import { AppDataSource } from '../config/database.js';
import { Role } from '../entities/Role.js';
import { Permission } from '../entities/Permission.js';
import { FeatureFlag } from '../entities/FeatureFlag.js';
import { User } from '../entities/User.js';
import { UserSettings } from '../entities/UserSettings.js';
import bcrypt from 'bcryptjs';

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

// User Management Routes

// GET /api/admin/users - Get all users (admin only)
router.get('/users', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find({
      relations: ['role'],
      order: { createdAt: 'DESC' }
    });

    // Get user settings separately
    const userSettingsRepository = AppDataSource.getRepository(UserSettings);
    const userSettings = await userSettingsRepository.find({
      relations: ['user']
    });

    const usersWithoutPasswords = users.map(user => {
      const userSetting = userSettings.find(setting => setting.user.id === user.id);
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role?.name || user.legacyRole || 'user',
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        darkMode: userSetting?.darkMode || false
      };
    });

    res.json(usersWithoutPasswords);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users/:id - Get specific user (admin only)
router.get('/users/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { id },
      relations: ['role']
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get user settings separately
    const userSettingsRepository = AppDataSource.getRepository(UserSettings);
    const userSetting = await userSettingsRepository.findOne({
      where: { user: { id } }
    });

    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role?.name || user.legacyRole || 'user',
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      darkMode: userSetting?.darkMode || false
    };

    res.json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/users - Create new user (admin only)
router.post('/users', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role, isActive = true } = req.body;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ error: 'Email, password, firstName, and lastName are required' });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const roleRepository = AppDataSource.getRepository(Role);

    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    // Get role if specified
    let userRole = null;
    if (role) {
      userRole = await roleRepository.findOne({ where: { name: role } });
      if (!userRole) {
        res.status(400).json({ error: 'Invalid role specified' });
        return;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      roleId: userRole?.id,
      legacyRole: role || 'user',
      isActive
    });

    const savedUser = await userRepository.save(user);

    // Create user settings
    const userSettingsRepository = AppDataSource.getRepository(UserSettings);
    const settings = userSettingsRepository.create({
      user: savedUser,
      darkMode: false
    });
    await userSettingsRepository.save(settings);

    const userWithoutPassword = {
      id: savedUser.id,
      email: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      role: userRole?.name || role || 'user',
      isActive: savedUser.isActive,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
      darkMode: false
    };

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/users/:id - Update user (admin only)
router.put('/users/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role, isActive, password } = req.body;

    const userRepository = AppDataSource.getRepository(User);
    const roleRepository = AppDataSource.getRepository(Role);

    const user = await userRepository.findOne({
      where: { id },
      relations: ['role']
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update basic fields
    if (email) user.email = email;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    // Update password if provided
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    // Update role if provided
    if (role) {
      const userRole = await roleRepository.findOne({ where: { name: role } });
      if (!userRole) {
        res.status(400).json({ error: 'Invalid role specified' });
        return;
      }
      user.roleId = userRole.id;
      user.legacyRole = role;
    }

    const updatedUser = await userRepository.save(user);

    const userWithoutPassword = {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role?.name || updatedUser.legacyRole || 'user',
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    res.json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/users/:id - Delete user (admin only)
router.delete('/users/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Soft delete by setting isActive to false
    user.isActive = false;
    await userRepository.save(user);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// System Settings Routes

// GET /api/admin/system/stats - Get system statistics
router.get('/system/stats', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const roleRepository = AppDataSource.getRepository(Role);
    const permissionRepository = AppDataSource.getRepository(Permission);
    const featureFlagRepository = AppDataSource.getRepository(FeatureFlag);

    const [
      totalUsers,
      activeUsers,
      totalRoles,
      totalPermissions,
      totalFeatureFlags,
      enabledFeatureFlags
    ] = await Promise.all([
      userRepository.count(),
      userRepository.count({ where: { isActive: true } }),
      roleRepository.count(),
      permissionRepository.count(),
      featureFlagRepository.count(),
      featureFlagRepository.count({ where: { enabled: true } })
    ]);

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      roles: {
        total: totalRoles
      },
      permissions: {
        total: totalPermissions
      },
      featureFlags: {
        total: totalFeatureFlags,
        enabled: enabledFeatureFlags,
        disabled: totalFeatureFlags - enabledFeatureFlags
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/system/health - Get system health status
router.get('/system/health', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isDatabaseConnected = AppDataSource.isInitialized;

    // Test database connection
    let databaseStatus = 'disconnected';
    if (isDatabaseConnected) {
      try {
        await AppDataSource.query('SELECT 1');
        databaseStatus = 'connected';
      } catch (error) {
        databaseStatus = 'error';
      }
    }

    res.json({
      status: databaseStatus === 'connected' ? 'healthy' : 'unhealthy',
      services: {
        database: databaseStatus,
        api: 'running'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
