import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';
import { Role } from '../entities/Role.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserSettings } from '../entities/UserSettings.js';
import { featureFlagService } from '../services/featureFlagService.js';
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  DatabaseError
} from '../middleware/errorHandler.js';

const router = Router();
const userRepository = AppDataSource.getRepository(User);
const roleRepository = AppDataSource.getRepository(Role);
const userSettingsRepository = AppDataSource.getRepository(UserSettings);

// Helper function to extract user from token
const extractUserFromToken = (req: Request): { userId: string; email: string; role: string } => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('No authentication token provided');
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Authentication token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid authentication token');
    }
    throw new AuthenticationError('Authentication failed');
  }
};

// POST /api/users/login - User login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const user = await userRepository.findOne({
      where: { email },
      relations: ['role']
    });

    if (!user || !user.isActive) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role?.name || user.legacyRole || 'user' },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role?.name || user.legacyRole || 'user'
      }
    });
  } catch (error) {
    return next(error);
  }
});

// POST /api/users/register - User registration
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      throw new ValidationError('All fields (email, password, firstName, lastName) are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Please provide a valid email address');
    }

    // Validate password strength
    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }

    const existingUser = await userRepository.findOne({ where: { email } });

    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Get the default user role
    const userRole = await roleRepository.findOne({ where: { name: 'user' } });

    const user = userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      roleId: userRole?.id,
      legacyRole: 'user'
    });

    const savedUser = await userRepository.save(user);

    // Fetch the user with role relationship
    const userWithRole = await userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['role']
    });

    const token = jwt.sign(
      { userId: savedUser.id, email: savedUser.email, role: userWithRole?.role?.name || 'user' },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      token,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: userWithRole?.role?.name || 'user'
      }
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/users/profile - Get user profile
router.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = extractUserFromToken(req);

    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['role']
    });

    if (!user || !user.isActive) {
      throw new NotFoundError('User profile');
    }

    return res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role?.name || user.legacyRole || 'user'
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/users/settings - Get user settings (dark mode)
router.get('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = extractUserFromToken(req);

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new NotFoundError('User');
    }

    let settings = await userSettingsRepository.findOne({ where: { user: { id: userId } } });
    if (!settings) {
      settings = userSettingsRepository.create({ user, darkMode: false });
      await userSettingsRepository.save(settings);
    }

    return res.json({ darkMode: settings.darkMode });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/users/settings - Update user settings (dark mode)
router.put('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = extractUserFromToken(req);

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new NotFoundError('User');
    }

    if (typeof req.body.darkMode !== 'boolean') {
      throw new ValidationError('darkMode must be a boolean value');
    }

    let settings = await userSettingsRepository.findOne({ where: { user: { id: userId } } });
    if (!settings) {
      settings = userSettingsRepository.create({ user, darkMode: false });
    }

    settings.darkMode = req.body.darkMode;
    await userSettingsRepository.save(settings);

    return res.json({ darkMode: settings.darkMode });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/users/profile - Update user profile (email and password)
router.put('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = extractUserFromToken(req);
    const { email, currentPassword, newPassword } = req.body;

    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['role']
    });

    if (!user || !user.isActive) {
      throw new NotFoundError('User');
    }

    // Update email if provided
    if (email && email !== user.email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ValidationError('Please provide a valid email address');
      }

      // Check if email is already taken
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictError('A user with this email already exists');
      }

      user.email = email;
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      // Validate current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new AuthenticationError('Current password is incorrect');
      }

      // Validate new password strength
      if (newPassword.length < 6) {
        throw new ValidationError('Password must be at least 6 characters long');
      }

      // Hash new password
      user.password = await bcrypt.hash(newPassword, 10);
    }

    // Save updated user
    const updatedUser = await userRepository.save(user);

    return res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role?.name || updatedUser.legacyRole || 'user'
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/users/feature-flags - Get feature flags for the current user
router.get('/feature-flags', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = extractUserFromToken(req);

    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['role']
    });

    if (!user || !user.isActive) {
      throw new NotFoundError('User');
    }

    const featureFlags = await featureFlagService.getUserFeatureFlags(user);
    return res.json(featureFlags);
  } catch (error) {
    return next(error);
  }
});

export { router as userRoutes };
