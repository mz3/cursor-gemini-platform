import { Request, Response, NextFunction } from 'express';
import { featureFlagService } from '../services/featureFlagService.js';
import { AuthenticatedRequest } from './auth.js';
import { ForbiddenError, AuthenticationError } from './errorHandler.js';
import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';

// Middleware to check if a feature flag is enabled for the current user
export const requireFeatureFlag = (flagKey: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      if (!authReq.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Get full user with role information
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: authReq.user.userId },
        relations: ['role']
      });

      if (!user) {
        throw new AuthenticationError('User not found');
      }

      const isEnabled = await featureFlagService.isFeatureEnabled(flagKey, user);

      if (!isEnabled) {
        throw new ForbiddenError(`Feature '${flagKey}' is not enabled for your account`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware to add feature flags to the request for the current user
export const attachFeatureFlags = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (authReq.user) {
      // Get full user with role information
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: authReq.user.userId },
        relations: ['role']
      });

      if (user) {
        const featureFlags = await featureFlagService.getUserFeatureFlags(user);
        (authReq as any).featureFlags = featureFlags;
      }
    }

    next();
  } catch (error) {
    // Don't fail the request if feature flags can't be loaded
    console.error('Error loading feature flags:', error);
    next();
  }
};
