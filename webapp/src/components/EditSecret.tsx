import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Key, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api';

interface Secret {
  id: string;
  name: string;
  description?: string;
  key: string;
  type: 'api_key' | 'oauth_token' | 'bearer_token' | 'basic_auth' | 'custom';
  provider?: string;
  isActive: boolean;
  hasValue: boolean;
}

interface EditSecretForm {
  name: string;
  description: string;
  key: string;
  value: string;
  type: 'api_key' | 'oauth_token' | 'bearer_token' | 'basic_auth' | 'custom';
  provider: string;
  isActive: boolean;
}

const EditSecret: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [secret, setSecret] = useState<Secret | null>(null);
  const [form, setForm] = useState<EditSecretForm>({
    name: '',
    description: '',
    key: '',
    value: '',
    type: 'api_key',
    provider: '',
    isActive: true
  });
  const [showValue, setShowValue] = useState(false);
  const [updateValue, setUpdateValue] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSecret = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await api.get(`/secrets/${id}`);
      const secretData = response.data;
      setSecret(secretData);
      setForm({
        name: secretData.name,
        description: secretData.description || '',
        key: secretData.key,
        value: '',
        type: secretData.type,
        provider: secretData.provider || '',
        isActive: secretData.isActive
      });
      setError(null);
    } catch (err: any) {
      console.error('Error fetching secret:', err);
      setError('Failed to load secret');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecret();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updateData: any = {
        name: form.name,
        description: form.description,
        key: form.key,
        type: form.type,
        provider: form.provider,
        isActive: form.isActive
      };

      // Only include value if user wants to update it
      if (updateValue && form.value) {
        updateData.value = form.value;
      }

      await api.put(`/secrets/${id}`, updateData);
      navigate('/secrets');
    } catch (err: any) {
      console.error('Error updating secret:', err);
      setError(err.response?.data?.message || 'Failed to update secret');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const commonProviders = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic (Claude)' },
    { value: 'github', label: 'GitHub' },
    { value: 'slack', label: 'Slack' },
    { value: 'discord', label: 'Discord' },
    { value: 'google', label: 'Google' },
    { value: 'aws', label: 'Amazon Web Services' },
    { value: 'azure', label: 'Microsoft Azure' },
    { value: 'stripe', label: 'Stripe' },
    { value: 'twilio', label: 'Twilio' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!secret) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Secret not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/secrets')}
          className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Secret</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update your secret configuration
          </p>
        </div>
      </div>

      {/* Security Warning */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Editing Secret
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              You can update the secret metadata without changing the encrypted value.
              Check "Update secret value" only if you need to change the actual secret.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* Key */}
            <div>
              <label htmlFor="key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Key *
              </label>
              <input
                type="text"
                id="key"
                name="key"
                value={form.key}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This is how bots will reference this secret
              </p>
            </div>

            {/* Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type *
              </label>
              <select
                id="type"
                name="type"
                value={form.type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="api_key">API Key</option>
                <option value="oauth_token">OAuth Token</option>
                <option value="bearer_token">Bearer Token</option>
                <option value="basic_auth">Basic Auth</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Provider */}
            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Provider
              </label>
              <select
                id="provider"
                name="provider"
                value={form.provider}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">Select a provider (optional)</option>
                {commonProviders.map(provider => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
                <option value="custom">Other</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Active (bots can use this secret)
            </label>
          </div>

          {/* Update Value Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="updateValue"
                checked={updateValue}
                onChange={(e) => setUpdateValue(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="updateValue" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Update secret value
              </label>
            </div>

            {updateValue && (
              <div>
                <label htmlFor="value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Value *
                </label>
                <div className="relative">
                  <input
                    type={showValue ? 'text' : 'password'}
                    id="value"
                    name="value"
                    value={form.value}
                    onChange={handleChange}
                    required={updateValue}
                    placeholder="Enter new secret value"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowValue(!showValue)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This will replace the current encrypted value
                </p>
              </div>
            )}

            {!updateValue && secret.hasValue && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Current secret value is preserved and encrypted
              </p>
            )}

            {!updateValue && !secret.hasValue && (
              <p className="text-sm text-red-600 dark:text-red-400">
                No current value - check "Update secret value" to add one
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/secrets')}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Update Secret
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSecret;
