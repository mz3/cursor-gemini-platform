import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserSettings } from '../entities/UserSettings.js';
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  DatabaseError
} from '../middleware/errorHandler.js';

const router = Router();
const userRepository = AppDataSource.getRepository(User);
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

    const user = await userRepository.findOne({ where: { email } });

    if (!user || !user.isActive) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
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
        role: user.role
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

    const user = userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'user'
    });

    const savedUser = await userRepository.save(user);

    const token = jwt.sign(
      { userId: savedUser.id, email: savedUser.email, role: savedUser.role },
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
        role: savedUser.role
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

    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user || !user.isActive) {
      throw new NotFoundError('User profile');
    }

    return res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
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

export { router as userRoutes };
