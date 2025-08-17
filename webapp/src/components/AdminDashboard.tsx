import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { featureFlagService, FeatureFlag } from '../services/featureFlagService';
import { Database, Users, Settings, Flag, Shield, Zap } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user, isFeatureEnabled, hasRole } = useAuth();
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if user has admin role
  if (!hasRole('admin')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-400" />
          <h1 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">Access Denied</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            You don't have permission to access the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Check if admin dashboard feature is enabled
  if (!isFeatureEnabled('admin_dashboard')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Flag className="mx-auto h-12 w-12 text-yellow-400" />
          <h1 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">Feature Unavailable</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            The admin dashboard feature is currently disabled.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadFeatureFlags();
  }, []);

  const loadFeatureFlags = async () => {
    try {
      setLoading(true);
      const flags = await featureFlagService.getAllFeatureFlags();
      setFeatureFlags(flags);
      setError(null);
    } catch (err) {
      setError('Failed to load feature flags');
      console.error('Error loading feature flags:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    if (!isFeatureEnabled('admin_database_seed')) {
      setError('Database seeding feature is not enabled');
      return;
    }

    try {
      setSeeding(true);
      setError(null);
      setSuccess(null);

      await featureFlagService.seedDatabase();
      setSuccess('Database seeded successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to seed database');
      console.error('Error seeding database:', err);
    } finally {
      setSeeding(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Welcome, {user?.firstName} {user?.lastName}. Manage your platform from here.
            </p>
          </div>
        </div>

        {/* Messages */}
        {(error || success) && (
          <div className="px-4 sm:px-0 mb-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="h-5 w-5 text-red-400">⚠</div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      onClick={clearMessages}
                      className="text-red-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            )}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="h-5 w-5 text-green-400">✓</div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      onClick={clearMessages}
                      className="text-green-400 hover:text-green-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="px-4 sm:px-0 mb-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Database Seeding */}
            {isFeatureEnabled('admin_database_seed') && (
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Database className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Database
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-white">
                          Seed Data
                        </dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-5">
                    <button
                      onClick={handleSeedDatabase}
                      disabled={seeding}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      {seeding ? 'Seeding...' : 'Seed Database'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* User Management */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Users
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        Manage
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-5">
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    View Users
                  </button>
                </div>
              </div>
            </div>

            {/* System Settings */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Settings className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        System
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        Settings
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-5">
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    Configure
                  </button>
                </div>
              </div>
            </div>

            {/* Feature Flags */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Zap className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Features
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {featureFlags.length} Flags
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-5">
                  <button
                    onClick={loadFeatureFlags}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Manage Flags
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Flags Table */}
        <div className="px-4 sm:px-0">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Feature Flags</h2>
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading feature flags...</p>
              </div>
            ) : featureFlags.length === 0 ? (
              <div className="p-6 text-center">
                <Flag className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No feature flags found</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {featureFlags.map((flag) => (
                  <li key={flag.key} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`h-3 w-3 rounded-full ${
                            flag.enabled ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {flag.name}
                            </p>
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                              {flag.type}
                            </span>
                            {flag.isSystem && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                System
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {flag.key}
                          </p>
                          {flag.description && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {flag.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {flag.type === 'percentage' && flag.percentage !== undefined && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {flag.percentage}%
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          flag.enabled
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}>
                          {flag.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
