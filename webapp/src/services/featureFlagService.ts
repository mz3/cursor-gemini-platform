import api from '../utils/api';

export interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  type: 'boolean' | 'percentage' | 'role_based' | 'user_based';
  enabled: boolean;
  percentage?: number;
  config?: Record<string, any>;
  userIds?: string[];
  isSystem: boolean;
  isActive: boolean;
  roles?: Array<{ id: string; name: string; displayName: string }>;
}

export interface UserFeatureFlags {
  [key: string]: boolean;
}

class FeatureFlagService {
  private featureFlags: UserFeatureFlags = {};
  private initialized = false;

  // Initialize feature flags for the current user
  async initialize(): Promise<void> {
    try {
      const response = await api.get('/users/feature-flags');
      this.featureFlags = response.data;
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load feature flags:', error);
      this.featureFlags = {};
      this.initialized = true;
    }
  }

  // Check if a feature flag is enabled for the current user
  isEnabled(key: string): boolean {
    if (!this.initialized) {
      console.warn(`Feature flag ${key} checked before initialization`);
      return false;
    }
    return this.featureFlags[key] || false;
  }

  // Get all feature flags for the current user
  getAll(): UserFeatureFlags {
    return { ...this.featureFlags };
  }

  // Refresh feature flags (useful after role changes)
  async refresh(): Promise<void> {
    await this.initialize();
  }

  // Admin functions (require admin role)
  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    try {
      const response = await api.get('/admin/feature-flags');
      return response.data;
    } catch (error) {
      console.error('Failed to load admin feature flags:', error);
      throw error;
    }
  }

  async createFeatureFlag(data: Partial<FeatureFlag>): Promise<FeatureFlag> {
    try {
      const response = await api.post('/admin/feature-flags', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create feature flag:', error);
      throw error;
    }
  }

  async updateFeatureFlag(key: string, data: Partial<FeatureFlag>): Promise<FeatureFlag> {
    try {
      const response = await api.put(`/admin/feature-flags/${key}`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update feature flag:', error);
      throw error;
    }
  }

  async deleteFeatureFlag(key: string): Promise<void> {
    try {
      await api.delete(`/admin/feature-flags/${key}`);
    } catch (error) {
      console.error('Failed to delete feature flag:', error);
      throw error;
    }
  }

  // Seed database (admin only)
  async seedDatabase(): Promise<void> {
    try {
      await api.post('/admin/seed');
    } catch (error) {
      console.error('Failed to seed database:', error);
      throw error;
    }
  }
}

export const featureFlagService = new FeatureFlagService();
export default featureFlagService;
