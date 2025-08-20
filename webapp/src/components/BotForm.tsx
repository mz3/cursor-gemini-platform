import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import ErrorDisplay from './ErrorDisplay';
import { aiModelApi, AIModel } from '../services/aiModelService';

interface Bot {
  id?: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  aiModelId?: string;
}

interface BotFormProps {
  initialData?: Bot;
  onSubmit: (data: Bot) => Promise<void>;
  loading?: boolean;
  error?: string;
  readOnly?: boolean;
}

const BotForm: React.FC<BotFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  error = '',
  readOnly = false
}) => {
  const [form, setForm] = useState<Bot>({
    name: '',
    displayName: '',
    description: '',
    isActive: true,
    aiModelId: ''
  });
  const [localError, setLocalError] = useState<string>('');

  const { data: aiModels = [] } = useQuery({
    queryKey: ['ai-models'],
    queryFn: aiModelApi.getAll,
  });

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  const handleChange = (field: keyof Bot, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear local error when user starts typing
    if (localError) {
      setLocalError('');
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'gemini':
        return '🤖';
      case 'openai':
        return '🧠';
      case 'anthropic':
        return '🎭';
      case 'deepseek':
        return '🔍';
      case 'local':
        return '🏠';
      default:
        return '🤖';
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

    try {
      await onSubmit(form);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to save bot');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ErrorDisplay
        error={error || localError}
        onDismiss={() => {
          setLocalError('');
        }}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700">Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={e => handleChange('name', e.target.value)}
          required
          disabled={readOnly}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          placeholder="e.g. customer-support-bot"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Display Name *</label>
        <input
          type="text"
          value={form.displayName}
          onChange={e => handleChange('displayName', e.target.value)}
          required
          disabled={readOnly}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          placeholder="e.g. Customer Support Bot"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={form.description}
          onChange={e => handleChange('description', e.target.value)}
          disabled={readOnly}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          rows={3}
          placeholder="Describe this bot..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">AI Model</label>
        <select
          value={form.aiModelId || ''}
          onChange={e => handleChange('aiModelId', e.target.value)}
          disabled={readOnly}
          className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
        >
          <option value="">Select an AI Model</option>
          {aiModels.map((model) => (
            <option key={model.id} value={model.id}>
              {getProviderIcon(model.provider)} {model.displayName} ({model.provider})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={e => handleChange('isActive', e.target.checked)}
            disabled={readOnly}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <span className="ml-2 block text-sm text-gray-900">Active</span>
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

export default BotForm;
