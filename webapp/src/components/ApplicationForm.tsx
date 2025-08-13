import React, { useState, useEffect } from 'react';
import ErrorDisplay from './ErrorDisplay';

interface Application {
  id?: string;
  name: string;
  displayName: string;
  description: string;
  modelId?: string;
}

interface ApplicationFormProps {
  initialData?: Application;
  onSubmit: (data: Application) => Promise<void>;
  loading?: boolean;
  error?: string;
  readOnly?: boolean;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  error = '',
  readOnly = false
}) => {
  const [form, setForm] = useState<Application>({
    name: '',
    displayName: '',
    description: '',
    modelId: ''
  });
  const [localError, setLocalError] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  const handleChange = (field: keyof Application, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear local error when user starts typing
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

    try {
      await onSubmit(form);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to save application');
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
          placeholder="e.g. my-app"
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
          placeholder="e.g. My App"
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
          placeholder="Describe this application..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Model ID</label>
        <input
          type="text"
          value={form.modelId || ''}
          onChange={e => handleChange('modelId', e.target.value)}
          disabled={readOnly}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          placeholder="Optional model ID"
        />
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

export default ApplicationForm;
