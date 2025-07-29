import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface Prompt {
  id: string;
  name: string;
  description?: string;
}

interface BotFormProps {
  initialData?: {
    name: string;
    displayName: string;
    description: string;
    isActive: boolean;
    promptIds: string[];
  };
  onSubmit?: (data: { name: string; displayName: string; description: string; isActive: boolean; promptIds: string[] }) => Promise<void>;
  loading?: boolean;
  error?: string;
  readOnly?: boolean;
  onCancel?: () => void;
  submitLabel?: string;
}

const BotForm: React.FC<BotFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  error = '',
  readOnly = false,
  onCancel,
  submitLabel = 'Save',
}) => {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    displayName: initialData?.displayName || '',
    description: initialData?.description || '',
    isActive: initialData?.isActive ?? true,
    promptIds: initialData?.promptIds || [],
  });
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    fetchPrompts();
  }, []);

  useEffect(() => {
    setForm({
      name: initialData?.name || '',
      displayName: initialData?.displayName || '',
      description: initialData?.description || '',
      isActive: initialData?.isActive ?? true,
      promptIds: initialData?.promptIds || [],
    });
  }, [initialData]);

  const fetchPrompts = async () => {
    try {
      const response = await api.get('/prompts');
      setPrompts(response.data);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    }
  };

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePromptToggle = (promptId: string) => {
    setForm(prev => ({
      ...prev,
      promptIds: prev.promptIds.includes(promptId)
        ? prev.promptIds.filter(id => id !== promptId)
        : [...prev.promptIds, promptId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!form.name || !form.displayName) {
      setLocalError('Name and Display Name are required');
      return;
    }
    if (onSubmit) {
      try {
        await onSubmit(form);
      } catch (err: any) {
        setLocalError(err.message || 'Failed to save bot');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(error || localError) && <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">{error || localError}</div>}

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
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={e => handleChange('isActive', e.target.checked)}
            disabled={readOnly}
            className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
          />
          <span className="ml-2 text-sm font-medium text-gray-700">Active</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Associated Prompts</label>
        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
          {prompts.map((prompt) => (
            <label key={prompt.id} className="flex items-center">
              <input
                type="checkbox"
                checked={form.promptIds.includes(prompt.id)}
                onChange={() => handlePromptToggle(prompt.id)}
                disabled={readOnly}
                className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">{prompt.name}</span>
              {prompt.description && (
                <span className="ml-2 text-xs text-gray-500">- {prompt.description}</span>
              )}
            </label>
          ))}
          {prompts.length === 0 && (
            <p className="text-sm text-gray-500">No prompts available</p>
          )}
        </div>
      </div>

      {!readOnly && (
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : submitLabel}
          </button>
        </div>
      )}
    </form>
  );
};

export default BotForm;
