import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';
import { Role } from '../entities/Role.js';
import { Permission, PermissionResource, PermissionAction } from '../entities/Permission.js';
import { AuthenticationError, NotFoundError, ForbiddenError } from './errorHandler.js';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    roleName: string;
    permissions: string[];
  };
}

// Basic authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authentication token required');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

    // Fetch user with role and permissions
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.userId },
      relations: ['role', 'role.permissions']
    });

    if (!user || !user.isActive) {
      throw new AuthenticationError('Invalid or inactive user');
    }

    // Extract permissions
    const permissions = user.role?.permissions?.map(p => p.name) || [];

    (req as AuthenticatedRequest).user = {
      userId: user.id,
      email: user.email,
      roleName: user.role?.name || user.legacyRole || 'user',
      permissions
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AuthenticationError('Authentication token has expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      return next(new AuthenticationError('Invalid authentication token'));
    }
    next(error);
  }
};

// Role-based authorization middleware
export const requireRole = (...roleNames: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      if (!authReq.user) {
        throw new AuthenticationError('Authentication required');
      }

      const userRole = authReq.user.roleName;

      if (!userRole || !roleNames.includes(userRole)) {
        throw new ForbiddenError(`Access denied. Required roles: ${roleNames.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Permission-based authorization middleware
export const requirePermission = (resource: PermissionResource, action: PermissionAction) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      if (!authReq.user) {
        throw new AuthenticationError('Authentication required');
      }

      const requiredPermission = `${resource}:${action}`;
      const hasPermission = authReq.user.permissions.includes(requiredPermission);

      if (!hasPermission) {
        throw new ForbiddenError(`Access denied. Required permission: ${requiredPermission}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Admin-only middleware (shortcut for admin role)
export const requireAdmin = requireRole('admin');

// System-only middleware (shortcut for system role)
export const requireSystem = requireRole('system');
