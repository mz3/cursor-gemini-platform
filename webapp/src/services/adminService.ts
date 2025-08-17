import api from '../utils/api';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  darkMode: boolean;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
  isActive?: boolean;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
  password?: string;
}

export interface SystemStats {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  roles: {
    total: number;
  };
  permissions: {
    total: number;
  };
  featureFlags: {
    total: number;
    enabled: number;
    disabled: number;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'unhealthy';
  services: {
    database: 'connected' | 'disconnected' | 'error';
    api: string;
  };
  timestamp: string;
}

class AdminService {
  // User Management
  async getAllUsers(): Promise<AdminUser[]> {
    try {
      const response = await api.get('/admin/users');
      return response.data;
    } catch (error) {
      console.error('Failed to load users:', error);
      throw error;
    }
  }

  async getUser(id: string): Promise<AdminUser> {
    try {
      const response = await api.get(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to load user:', error);
      throw error;
    }
  }

  async createUser(userData: CreateUserData): Promise<AdminUser> {
    try {
      const response = await api.post('/admin/users', userData);
      return response.data;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  async updateUser(id: string, userData: UpdateUserData): Promise<AdminUser> {
    try {
      const response = await api.put(`/admin/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await api.delete(`/admin/users/${id}`);
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  }

  // System Management
  async getSystemStats(): Promise<SystemStats> {
    try {
      const response = await api.get('/admin/system/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to load system stats:', error);
      throw error;
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await api.get('/admin/system/health');
      return response.data;
    } catch (error) {
      console.error('Failed to load system health:', error);
      throw error;
    }
  }

  // Roles and Permissions
  async getAllRoles(): Promise<any[]> {
    try {
      const response = await api.get('/admin/roles');
      return response.data;
    } catch (error) {
      console.error('Failed to load roles:', error);
      throw error;
    }
  }

  async getAllPermissions(): Promise<any[]> {
    try {
      const response = await api.get('/admin/permissions');
      return response.data;
    } catch (error) {
      console.error('Failed to load permissions:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
export default adminService;
