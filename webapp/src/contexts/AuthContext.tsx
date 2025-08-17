import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';
import { handleError, isAuthError } from '../utils/errorHandler';
import { featureFlagService, UserFeatureFlags } from '../services/featureFlagService';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface UserSettings {
  darkMode: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  darkMode: boolean;
  setDarkMode: (value: boolean) => Promise<void>;
  clearError: () => void;
  featureFlags: UserFeatureFlags;
  isFeatureEnabled: (key: string) => boolean;
  hasRole: (role: string) => boolean;
  refreshFeatureFlags: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkModeState] = useState(false);
  const [featureFlags, setFeatureFlags] = useState<UserFeatureFlags>({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, []);

  const clearError = () => {
    setError(null);
  };

  const fetchUser = async () => {
    try {
      const response = await api.get('/users/profile');
      setUser(response.data);
      setError(null);

      // Initialize feature flags after successful user fetch
      await initializeFeatureFlags();
    } catch (error: any) {
      const processedError = handleError(error, 'Fetch User Profile');

      // Handle authentication errors
      if (isAuthError(error)) {
        setError('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        setUser(null);
      } else {
        setError(processedError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/users/settings');
      setDarkModeState(response.data.darkMode);
    } catch (error: any) {
      // Don't show error for settings, just use default
      handleError(error, 'Fetch User Settings');
      setDarkModeState(false);
    }
  };

  const setDarkMode = async (value: boolean) => {
    try {
      await api.put('/users/settings', { darkMode: value });
      setDarkModeState(value);
      setError(null);
    } catch (error: any) {
      const processedError = handleError(error, 'Update Dark Mode Setting');
      setError(processedError.message);
    }
  };

  const initializeFeatureFlags = async () => {
    try {
      await featureFlagService.initialize();
      setFeatureFlags(featureFlagService.getAll());
    } catch (error) {
      console.error('Failed to initialize feature flags:', error);
      setFeatureFlags({});
    }
  };

  const refreshFeatureFlags = async () => {
    try {
      await featureFlagService.refresh();
      setFeatureFlags(featureFlagService.getAll());
    } catch (error) {
      console.error('Failed to refresh feature flags:', error);
    }
  };

  const isFeatureEnabled = (key: string): boolean => {
    return featureFlagService.isEnabled(key);
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await api.post('/users/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      setError(null);

      // Fetch settings and feature flags after successful login
      await fetchSettings();
      await initializeFeatureFlags();
    } catch (error: any) {
      const processedError = handleError(error, 'User Login');
      setError(processedError.message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
    setFeatureFlags({});
  };

  const value = {
    user,
    login,
    logout,
    loading,
    error,
    darkMode,
    setDarkMode,
    clearError,
    featureFlags,
    isFeatureEnabled,
    hasRole,
    refreshFeatureFlags
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
