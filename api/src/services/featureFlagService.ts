import { AppDataSource } from '../config/database.js';
import { FeatureFlag, FeatureFlagType } from '../entities/FeatureFlag.js';
import { Role } from '../entities/Role.js';
import { User } from '../entities/User.js';

export class FeatureFlagService {
  private featureFlagRepository = AppDataSource.getRepository(FeatureFlag);

  async isFeatureEnabled(key: string, user?: User): Promise<boolean> {
    try {
      const featureFlag = await this.featureFlagRepository.findOne({
        where: { key, isActive: true },
        relations: ['roles']
      });

      if (!featureFlag) {
        return false;
      }

      if (!featureFlag.enabled) {
        return false;
      }

      // Handle different flag types
      switch (featureFlag.type) {
        case FeatureFlagType.BOOLEAN:
          return featureFlag.enabled;

        case FeatureFlagType.PERCENTAGE:
          if (featureFlag.percentage === undefined) {
            return false;
          }
          // Use user ID hash for consistent percentage-based rollout
          if (user) {
            const hash = this.hashUserId(user.id);
            return hash < featureFlag.percentage;
          }
          return Math.random() * 100 < featureFlag.percentage;

        case FeatureFlagType.ROLE_BASED:
          if (!user || !user.role) {
            return false;
          }
          return featureFlag.roles.some(role => role.id === user.role!.id);

        case FeatureFlagType.USER_BASED:
          if (!user || !featureFlag.userIds) {
            return false;
          }
          return featureFlag.userIds.includes(user.id);

        default:
          return false;
      }
    } catch (error) {
      console.error(`Error checking feature flag ${key}:`, error);
      return false;
    }
  }

  async getUserFeatureFlags(user: User): Promise<Record<string, boolean>> {
    try {
      // Ensure user has role loaded
      if (!user.role) {
        const userWithRole = await AppDataSource.getRepository(User).findOne({
          where: { id: user.id },
          relations: ['role']
        });
        if (userWithRole) {
          user = userWithRole;
        }
      }

      const featureFlags = await this.featureFlagRepository.find({
        where: { isActive: true },
        relations: ['roles']
      });

      const result: Record<string, boolean> = {};

      for (const flag of featureFlags) {
        result[flag.key] = await this.isFeatureEnabled(flag.key, user);
      }

      return result;
    } catch (error) {
      console.error('Error getting user feature flags:', error);
      return {};
    }
  }

  async createFeatureFlag(data: Partial<FeatureFlag>): Promise<FeatureFlag> {
    const featureFlag = this.featureFlagRepository.create(data);
    return await this.featureFlagRepository.save(featureFlag);
  }

  async updateFeatureFlag(key: string, data: Partial<FeatureFlag>): Promise<FeatureFlag | null> {
    const featureFlag = await this.featureFlagRepository.findOne({ where: { key } });
    if (!featureFlag) {
      return null;
    }

    Object.assign(featureFlag, data);
    return await this.featureFlagRepository.save(featureFlag);
  }

  async deleteFeatureFlag(key: string): Promise<boolean> {
    const result = await this.featureFlagRepository.delete({ key });
    return result.affected !== undefined && result.affected !== null && result.affected > 0;
  }

  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    return await this.featureFlagRepository.find({
      relations: ['roles'],
      order: { name: 'ASC' }
    });
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }
}

export const featureFlagService = new FeatureFlagService();
