import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { featureFlagService, FeatureFlag } from '../services/featureFlagService';
import { Zap, Plus, Edit, Trash2, Search, Shield, ToggleLeft, ToggleRight, Users, Percent, ArrowLeft } from 'lucide-react';

interface FeatureFlagManagementProps {
  onBack?: () => void;
}

const FeatureFlagManagement: React.FC<FeatureFlagManagementProps> = ({ onBack }) => {
  const { user, hasRole } = useAuth();
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);

  // Check if user has admin role
  if (!hasRole('admin')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-400" />
          <h1 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">Access Denied</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            You don't have permission to access feature flag management.
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load feature flags');
      console.error('Error loading feature flags:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFlag = async (flagData: Partial<FeatureFlag>) => {
    try {
      setError(null);
      await featureFlagService.createFeatureFlag(flagData);
      setSuccess('Feature flag created successfully!');
      setShowCreateModal(false);
      loadFeatureFlags();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create feature flag');
      console.error('Error creating feature flag:', err);
    }
  };

  const handleUpdateFlag = async (key: string, flagData: Partial<FeatureFlag>) => {
    try {
      setError(null);
      await featureFlagService.updateFeatureFlag(key, flagData);
      setSuccess('Feature flag updated successfully!');
      setEditingFlag(null);
      loadFeatureFlags();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update feature flag');
      console.error('Error updating feature flag:', err);
    }
  };

  const handleDeleteFlag = async (key: string) => {
    if (!window.confirm('Are you sure you want to delete this feature flag?')) {
      return;
    }

    try {
      setError(null);
      await featureFlagService.deleteFeatureFlag(key);
      setSuccess('Feature flag deleted successfully!');
      loadFeatureFlags();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete feature flag');
      console.error('Error deleting feature flag:', err);
    }
  };

  const handleToggleFlag = async (flag: FeatureFlag) => {
    try {
      setError(null);
      await featureFlagService.updateFeatureFlag(flag.key, {
        enabled: !flag.enabled
      });
      setSuccess(`Feature flag ${flag.enabled ? 'disabled' : 'enabled'} successfully!`);
      loadFeatureFlags();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle feature flag');
      console.error('Error toggling feature flag:', err);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const filteredFlags = featureFlags.filter(flag => {
    return (
      flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flag.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flag.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flag.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'boolean':
        return <ToggleLeft className="w-4 h-4" />;
      case 'percentage':
        return <Percent className="w-4 h-4" />;
      case 'role_based':
      case 'user_based':
        return <Users className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
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
                    Feature Flag Management
                  </h1>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Manage feature flags and control feature rollouts.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Flag
              </button>
            </div>
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

        {/* Controls */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Feature Flags ({filteredFlags.length})
                </h2>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search feature flags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredFlags.length === 0 ? (
                <div className="text-center py-8">
                  <Zap className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No feature flags found</p>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Flag
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Configuration
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredFlags.map((flag) => (
                        <tr key={flag.key} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {flag.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {flag.key}
                              </div>
                              {flag.description && (
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {flag.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getTypeIcon(flag.type)}
                              <span className="ml-2 text-sm text-gray-900 dark:text-gray-100 capitalize">
                                {flag.type.replace('_', ' ')}
                              </span>
                              {flag.isSystem && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                  System
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleFlag(flag)}
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                flag.enabled
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              }`}
                            >
                              {flag.enabled ? (
                                <>
                                  <ToggleRight className="w-3 h-3 mr-1" />
                                  Enabled
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="w-3 h-3 mr-1" />
                                  Disabled
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {flag.type === 'percentage' && flag.percentage !== undefined && (
                              <span>{flag.percentage}% rollout</span>
                            )}
                            {flag.type === 'role_based' && flag.roles && flag.roles.length > 0 && (
                              <span>{flag.roles.length} role(s)</span>
                            )}
                            {flag.type === 'user_based' && flag.userIds && flag.userIds.length > 0 && (
                              <span>{flag.userIds.length} user(s)</span>
                            )}
                            {flag.type === 'boolean' && (
                              <span>Simple toggle</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => setEditingFlag(flag)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {!flag.isSystem && (
                                <button
                                  onClick={() => handleDeleteFlag(flag.key)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Feature Flag Modal */}
        {showCreateModal && (
          <CreateFeatureFlagModal
            onSubmit={handleCreateFlag}
            onCancel={() => setShowCreateModal(false)}
          />
        )}

        {/* Edit Feature Flag Modal */}
        {editingFlag && (
          <EditFeatureFlagModal
            flag={editingFlag}
            onSubmit={(flagData) => handleUpdateFlag(editingFlag.key, flagData)}
            onCancel={() => setEditingFlag(null)}
          />
        )}
      </div>
    </div>
  );
};

// Create Feature Flag Modal Component
interface CreateFeatureFlagModalProps {
  onSubmit: (flagData: Partial<FeatureFlag>) => void;
  onCancel: () => void;
}

const CreateFeatureFlagModal: React.FC<CreateFeatureFlagModalProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    type: 'boolean' as const,
    enabled: false,
    percentage: 50,
    isSystem: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const flagData: Partial<FeatureFlag> = {
      ...formData,
      percentage: (formData.type as any) === 'percentage' ? formData.percentage : undefined
    };
    onSubmit(flagData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Create Feature Flag</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Key</label>
              <input
                type="text"
                required
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="feature_key_name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Feature Flag Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="boolean">Boolean</option>
                <option value="percentage">Percentage</option>
                <option value="role_based">Role Based</option>
                <option value="user_based">User Based</option>
              </select>
            </div>
            {(formData.type as string) === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Percentage</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.percentage}
                  onChange={(e) => setFormData({ ...formData, percentage: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            )}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Enabled
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isSystem"
                checked={formData.isSystem}
                onChange={(e) => setFormData({ ...formData, isSystem: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isSystem" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                System Flag
              </label>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Create Flag
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Edit Feature Flag Modal Component
interface EditFeatureFlagModalProps {
  flag: FeatureFlag;
  onSubmit: (flagData: Partial<FeatureFlag>) => void;
  onCancel: () => void;
}

const EditFeatureFlagModal: React.FC<EditFeatureFlagModalProps> = ({ flag, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: flag.name,
    description: flag.description || '',
    type: flag.type,
    enabled: flag.enabled,
    percentage: flag.percentage || 50,
    isSystem: flag.isSystem
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const flagData: Partial<FeatureFlag> = {
      ...formData,
      percentage: (formData.type as any) === 'percentage' ? formData.percentage : undefined
    };
    onSubmit(flagData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Edit Feature Flag</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Key</label>
              <input
                type="text"
                value={flag.key}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm bg-gray-100 dark:bg-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="boolean">Boolean</option>
                <option value="percentage">Percentage</option>
                <option value="role_based">Role Based</option>
                <option value="user_based">User Based</option>
              </select>
            </div>
            {(formData.type as string) === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Percentage</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.percentage}
                  onChange={(e) => setFormData({ ...formData, percentage: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            )}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Enabled
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isSystem"
                checked={formData.isSystem}
                onChange={(e) => setFormData({ ...formData, isSystem: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isSystem" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                System Flag
              </label>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Update Flag
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeatureFlagManagement;
