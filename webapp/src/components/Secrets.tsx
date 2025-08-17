import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Key, Edit, Trash2, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api';

interface Secret {
  id: string;
  name: string;
  description?: string;
  key: string;
  type: 'api_key' | 'oauth_token' | 'bearer_token' | 'basic_auth' | 'custom';
  provider?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  hasValue: boolean;
}

const Secrets: React.FC = () => {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchSecrets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/secrets');
      setSecrets(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching secrets:', err);
      setError('Failed to load secrets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecrets();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/secrets/${id}`);
      setSecrets(secrets.filter(s => s.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting secret:', err);
      setError('Failed to delete secret');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'api_key':
        return <Key className="w-4 h-4" />;
      case 'oauth_token':
        return <Shield className="w-4 h-4" />;
      case 'bearer_token':
        return <Shield className="w-4 h-4" />;
      case 'basic_auth':
        return <Shield className="w-4 h-4" />;
      default:
        return <Key className="w-4 h-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'api_key':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'oauth_token':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'bearer_token':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'basic_auth':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Secrets</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage API keys, tokens, and other sensitive credentials for your bots
          </p>
        </div>
        <Link
          to="/secrets/create"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Secret
        </Link>
      </div>

      {/* Security Warning */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Security Notice
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Secrets are encrypted and stored securely. Never share your secret values or API keys with others.
              Only authorized bots and workflows can access these secrets during execution.
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Secrets List */}
      {secrets.length === 0 ? (
        <div className="text-center py-12">
          <Key className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No secrets</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating your first secret.
          </p>
          <div className="mt-6">
            <Link
              to="/secrets/create"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Secret
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {secrets.map((secret) => (
              <div key={secret.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getTypeIcon(secret.type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {secret.name}
                        </h3>
                        {secret.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {secret.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Key: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">
                              {secret.key}
                            </code>
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(secret.type)}`}>
                            {secret.type.replace('_', ' ')}
                          </span>
                          {secret.provider && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Provider: {secret.provider}
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            secret.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {secret.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {secret.hasValue ? (
                            <span className="inline-flex items-center text-xs text-green-600 dark:text-green-400">
                              <Eye className="w-3 h-3 mr-1" />
                              Has Value
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs text-red-600 dark:text-red-400">
                              <EyeOff className="w-3 h-3 mr-1" />
                              No Value
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/secrets/${secret.id}/edit`}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm(secret.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Delete Secret
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete this secret? This action cannot be undone and may break
              bots or workflows that depend on it.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Secrets;
