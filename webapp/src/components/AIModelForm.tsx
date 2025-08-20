import React, { useState, useEffect } from 'react';
import { AIModel, CreateAIModelDto, UpdateAIModelDto } from '../services/aiModelService';

interface AIModelFormProps {
  initialData?: AIModel;
  onSubmit: (data: CreateAIModelDto | UpdateAIModelDto) => Promise<void>;
  loading?: boolean;
  error?: string;
  readOnly?: boolean;
}

const AIModelForm: React.FC<AIModelFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  error = '',
  readOnly = false
}) => {
  const [form, setForm] = useState<CreateAIModelDto>({
    name: '',
    displayName: '',
    description: '',
    provider: 'gemini',
    modelId: '',
    apiVersion: '',
    baseUrl: '',
    capabilities: '',
    configuration: {},
    isActive: true,
    isDefault: false,
    secretId: ''
  });
  const [localError, setLocalError] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        displayName: initialData.displayName,
        description: initialData.description || '',
        provider: initialData.provider,
        modelId: initialData.modelId,
        apiVersion: initialData.apiVersion || '',
        baseUrl: initialData.baseUrl || '',
        capabilities: initialData.capabilities || '',
        configuration: initialData.configuration || {},
        isActive: initialData.isActive,
        isDefault: initialData.isDefault,
        secretId: initialData.secretId || ''
      });
    }
  }, [initialData]);

  const handleChange = (field: keyof CreateAIModelDto, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (localError) {
      setLocalError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!form.name.trim()) {
      setLocalError('Name is required');
      return;
    }

    if (!form.displayName.trim()) {
      setLocalError('Display name is required');
      return;
    }

    if (!form.modelId.trim()) {
      setLocalError('Model ID is required');
      return;
    }

    try {
      await onSubmit(form);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to save AI model');
    }
  };

  const getProviderOptions = () => {
    return [
      { value: 'gemini', label: '🤖 Gemini (Google)', icon: '🤖' },
      { value: 'openai', label: '🧠 OpenAI (ChatGPT)', icon: '🧠' },
      { value: 'anthropic', label: '🎭 Anthropic (Claude)', icon: '🎭' },
      { value: 'deepseek', label: '🔍 DeepSeek', icon: '🔍' },
      { value: 'local', label: '🏠 Local (LM Studio)', icon: '🏠' }
    ];
  };

  const getDefaultModelId = (provider: string) => {
    switch (provider) {
      case 'gemini':
        return 'gemini-1.5-flash';
      case 'openai':
        return 'gpt-4o';
      case 'anthropic':
        return 'claude-3-5-sonnet-20241022';
      case 'deepseek':
        return 'deepseek-chat';
      case 'local':
        return 'gemma-2b-it';
      default:
        return '';
    }
  };

  const getDefaultBaseUrl = (provider: string) => {
    switch (provider) {
      case 'local':
        return 'http://localhost:1234/v1';
      default:
        return '';
    }
  };

  const handleProviderChange = (provider: string) => {
    handleChange('provider', provider);
    // Set default values for the selected provider
    handleChange('modelId', getDefaultModelId(provider));
    handleChange('baseUrl', getDefaultBaseUrl(provider));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {localError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{localError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => handleChange('name', e.target.value)}
            required
            disabled={readOnly}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
            placeholder="e.g. gemini-flash"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name *</label>
          <input
            type="text"
            value={form.displayName}
            onChange={e => handleChange('displayName', e.target.value)}
            required
            disabled={readOnly}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
            placeholder="e.g. Gemini 1.5 Flash"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <textarea
          value={form.description}
          onChange={e => handleChange('description', e.target.value)}
          disabled={readOnly}
          className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
          rows={3}
          placeholder="Describe this AI model..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Provider *</label>
          <select
            value={form.provider}
            onChange={e => handleProviderChange(e.target.value)}
            required
            disabled={readOnly}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
          >
            {getProviderOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Model ID *</label>
          <input
            type="text"
            value={form.modelId}
            onChange={e => handleChange('modelId', e.target.value)}
            required
            disabled={readOnly}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
            placeholder="e.g. gemini-1.5-flash"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">API Version</label>
          <input
            type="text"
            value={form.apiVersion}
            onChange={e => handleChange('apiVersion', e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
            placeholder="e.g. v1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Base URL</label>
          <input
            type="text"
            value={form.baseUrl}
            onChange={e => handleChange('baseUrl', e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
            placeholder="e.g. http://localhost:1234/v1"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Capabilities</label>
        <textarea
          value={form.capabilities}
          onChange={e => handleChange('capabilities', e.target.value)}
          disabled={readOnly}
          className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
          rows={2}
          placeholder="e.g. text generation, code completion, reasoning"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Secret ID</label>
        <input
          type="text"
          value={form.secretId}
          onChange={e => handleChange('secretId', e.target.value)}
          disabled={readOnly}
          className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
          placeholder="Optional secret ID for API key"
        />
      </div>

      <div className="flex items-center space-x-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={e => handleChange('isActive', e.target.checked)}
            disabled={readOnly}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <span className="ml-2 block text-sm text-gray-900 dark:text-gray-100">Active</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={e => handleChange('isDefault', e.target.checked)}
            disabled={readOnly}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <span className="ml-2 block text-sm text-gray-900 dark:text-gray-100">Default Model</span>
        </label>
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </form>
  );
};

export default AIModelForm;
