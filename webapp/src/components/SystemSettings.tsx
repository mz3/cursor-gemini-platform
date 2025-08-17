import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminService, SystemStats, SystemHealth } from '../services/adminService';
import { Settings, Activity, Database, Users, Shield, Zap, Server, CheckCircle, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

interface SystemSettingsProps {
  onBack?: () => void;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ onBack }) => {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Check if user has admin role
  if (!hasRole('admin')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-400" />
          <h1 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">Access Denied</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            You don't have permission to access system settings.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, healthData] = await Promise.all([
        adminService.getSystemStats(),
        adminService.getSystemHealth()
      ]);

      setStats(statsData);
      setHealth(healthData);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load system data');
      console.error('Error loading system data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getServiceStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'running':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected':
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="mr-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">
                    System Settings
                  </h1>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Monitor system health, statistics, and configuration.
                  </p>
                </div>
              </div>
              <button
                onClick={loadSystemData}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Activity className="w-4 h-4 mr-2" />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 sm:px-0 mb-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="px-4 sm:px-0 mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastRefresh.toLocaleString()}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* System Health */}
            {health && (
              <div className="px-4 sm:px-0">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <Server className="w-5 h-5 mr-2" />
                      System Health
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Overall Status
                          </h3>
                          {getHealthIcon(health.status)}
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                            {health.status}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Last checked: {new Date(health.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                          Services
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(health.services).map(([service, status]) => (
                            <div key={service} className="flex items-center justify-between">
                              <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                                {service}
                              </span>
                              <div className="flex items-center">
                                {getServiceStatusIcon(status)}
                                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 capitalize">
                                  {status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Statistics */}
            {stats && (
              <div className="px-4 sm:px-0">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      System Statistics
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Users */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <div className="flex items-center">
                          <Users className="w-8 h-8 text-blue-600" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Users</p>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                              {stats.users.total}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              {stats.users.active} active, {stats.users.inactive} inactive
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Roles */}
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <div className="flex items-center">
                          <Shield className="w-8 h-8 text-green-600" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">Roles</p>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                              {stats.roles.total}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              User roles defined
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Permissions */}
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                        <div className="flex items-center">
                          <Shield className="w-8 h-8 text-purple-600" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Permissions</p>
                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                              {stats.permissions.total}
                            </p>
                            <p className="text-xs text-purple-600 dark:text-purple-400">
                              Access controls
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Feature Flags */}
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                        <div className="flex items-center">
                          <Zap className="w-8 h-8 text-yellow-600" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Feature Flags</p>
                            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                              {stats.featureFlags.total}
                            </p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-400">
                              {stats.featureFlags.enabled} enabled, {stats.featureFlags.disabled} disabled
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Configuration Settings */}
            <div className="px-4 sm:px-0">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Configuration
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {/* Database Configuration */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Database</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Connection Status
                            </label>
                            <div className="mt-1 flex items-center">
                              {health && getServiceStatusIcon(health.services.database)}
                              <span className="ml-2 text-sm text-gray-900 dark:text-gray-100 capitalize">
                                {health?.services.database || 'Unknown'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Database Type
                            </label>
                            <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                              PostgreSQL
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* API Configuration */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">API Server</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Status
                            </label>
                            <div className="mt-1 flex items-center">
                              {health && getServiceStatusIcon(health.services.api)}
                              <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                                {health?.services.api || 'Unknown'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Port
                            </label>
                            <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                              4000
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Environment Information */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Environment</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Environment
                            </label>
                            <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                              {process.env.NODE_ENV || 'development'}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Node.js Version
                            </label>
                            <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                              v24.x
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Platform
                            </label>
                            <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                              Meta-Application Platform
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSettings;
