import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserSettings } from '../entities/UserSettings.js';

const router = Router();
const userRepository = AppDataSource.getRepository(User);
const userSettingsRepository = AppDataSource.getRepository(UserSettings);

// POST /api/users/login - User login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await userRepository.findOne({ where: { email } });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
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
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await userRepository.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
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
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

    const user = await userRepository.findOne({ where: { id: decoded.userId } });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token' });
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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const user = await userRepository.findOne({ where: { id: decoded.userId } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    let settings = await userSettingsRepository.findOne({ where: { user: { id: user.id } } });
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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const user = await userRepository.findOne({ where: { id: decoded.userId } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    let settings = await userSettingsRepository.findOne({ where: { user: { id: user.id } } });
    if (!settings) {
      settings = userSettingsRepository.create({ user, darkMode: false });
    }
    if (typeof req.body.darkMode === 'boolean') {
      settings.darkMode = req.body.darkMode;
    }
    await userSettingsRepository.save(settings);
    return res.json({ darkMode: settings.darkMode });
  } catch (error) {
    return next(error);
  }
});

export { router as userRoutes };
