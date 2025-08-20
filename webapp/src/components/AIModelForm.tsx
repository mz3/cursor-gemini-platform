import React, { useState, useEffect } from 'react';
import { AIModel, CreateAIModelDto, UpdateAIModelDto } from '../services/aiModelService';
import { TestTube } from 'lucide-react';

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
  const [testConnectionStatus, setTestConnectionStatus] = useState<{
    testing: boolean;
    connected?: boolean;
    error?: string;
    models?: string[];
  }>({ testing: false });

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
        return 'google/gemma-3-12b'; // Default to Gemma 3 12B
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

  const getLocalModelSuggestions = () => {
    return [
      { id: 'google/gemma-3-12b', name: 'Gemma 3 12B', description: 'Google\'s latest Gemma model' },
      { id: 'google/gemma-2-27b', name: 'Gemma 2 27B', description: 'Large Gemma 2 model' },
      { id: 'google/gemma-2-9b', name: 'Gemma 2 9B', description: 'Medium Gemma 2 model' },
      { id: 'meta-llama/Llama-3.1-8B-Instruct', name: 'Llama 3.1 8B', description: 'Meta\'s Llama 3.1 model' },
      { id: 'microsoft/Phi-3-mini-4k-instruct', name: 'Phi-3 Mini', description: 'Microsoft\'s Phi-3 model' },
      { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen 2.5 7B', description: 'Alibaba\'s Qwen model' }
    ];
  };

  const handleProviderChange = (provider: string) => {
    handleChange('provider', provider);
    // Set default values for the selected provider
    handleChange('modelId', getDefaultModelId(provider));
    handleChange('baseUrl', getDefaultBaseUrl(provider));
  };

  const handleTestConnection = async () => {
    if (form.provider !== 'local' || !form.baseUrl) {
      return;
    }

    setTestConnectionStatus({ testing: true });

    try {
      const response = await fetch(`${form.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as { data: Array<{ id: string }> };
      
      if (!data.data || data.data.length === 0) {
        throw new Error('No models found in LM Studio');
      }

      const models = data.data.map(model => model.id);
      setTestConnectionStatus({
        testing: false,
        connected: true,
        models
      });
    } catch (error) {
      setTestConnectionStatus({
        testing: false,
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      });
    }
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
          <div className="mt-1 relative">
            <input
              type="text"
              value={form.modelId}
              onChange={e => handleChange('modelId', e.target.value)}
              required
              disabled={readOnly}
              className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
              placeholder="e.g. google/gemma-3-12b"
            />
            {form.provider === 'local' && (
              <div className="mt-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Popular Local Models:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {getLocalModelSuggestions().map(model => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => handleChange('modelId', model.id)}
                      className="text-left p-2 text-xs border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100">{model.name}</div>
                      <div className="text-gray-500 dark:text-gray-400">{model.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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
          <div className="mt-1 flex space-x-2">
            <input
              type="text"
              value={form.baseUrl}
              onChange={e => handleChange('baseUrl', e.target.value)}
              disabled={readOnly}
              className="flex-1 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
              placeholder="e.g. http://localhost:1234/v1"
            />
            {form.provider === 'local' && (
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testConnectionStatus.testing || !form.baseUrl}
                className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/40 disabled:opacity-50"
              >
                <TestTube className="w-4 h-4" />
              </button>
            )}
          </div>
          {form.provider === 'local' && testConnectionStatus.connected && (
            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-xs text-green-600 dark:text-green-400">
                ✅ Connected! Found {testConnectionStatus.models?.length || 0} model(s)
              </p>
              {testConnectionStatus.models && testConnectionStatus.models.length > 0 && (
                <div className="mt-1">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">Available models:</p>
                  <div className="mt-1 space-y-1">
                    {testConnectionStatus.models.slice(0, 3).map(model => (
                      <div key={model} className="text-xs text-green-600 dark:text-green-400 font-mono">
                        • {model}
                      </div>
                    ))}
                    {testConnectionStatus.models.length > 3 && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        ... and {testConnectionStatus.models.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {form.provider === 'local' && testConnectionStatus.error && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-xs text-red-600 dark:text-red-400">
                ❌ Connection failed: {testConnectionStatus.error}
              </p>
            </div>
          )}
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
