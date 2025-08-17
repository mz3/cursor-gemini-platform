import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Key, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api';

interface CreateSecretForm {
  name: string;
  description: string;
  key: string;
  value: string;
  type: 'api_key' | 'oauth_token' | 'bearer_token' | 'basic_auth' | 'custom';
  provider: string;
}

const CreateSecret: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateSecretForm>({
    name: '',
    description: '',
    key: '',
    value: '',
    type: 'api_key',
    provider: ''
  });
  const [showValue, setShowValue] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/secrets', form);
      navigate('/secrets');
    } catch (err: any) {
      console.error('Error creating secret:', err);
      setError(err.response?.data?.message || 'Failed to create secret');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create Secret</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add a new API key, token, or other sensitive credential
          </p>
        </div>
      </div>

      {/* Security Warning */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Security Best Practices
            </h3>
            <ul className="text-sm text-amber-700 dark:text-amber-300 mt-1 space-y-1">
              <li>• Use descriptive names to identify your secrets</li>
              <li>• Choose appropriate key names that match your bot configurations</li>
              <li>• Never share secret values with others</li>
              <li>• Regularly rotate your API keys and tokens</li>
            </ul>
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
                placeholder="e.g., OpenAI API Key"
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
                placeholder="e.g., OPENAI_API_KEY"
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
              <div className="relative">
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
              placeholder="Optional description of what this secret is used for"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Value */}
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Value *
            </label>
            <div className="relative">
              <input
                type={showValue ? 'text' : 'password'}
                id="value"
                name="value"
                value={form.value}
                onChange={handleChange}
                required
                placeholder="Enter your secret value"
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
              This value will be encrypted and stored securely
            </p>
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
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Create Secret
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSecret;
