import React, { useState, useEffect } from 'react';

interface ApplicationFormProps {
  initialData?: {
    name: string;
    displayName: string;
    description: string;
    config: string;
  };
  onSubmit?: (data: { name: string; displayName: string; description: string; config: string }) => Promise<void>;
  loading?: boolean;
  error?: string;
  readOnly?: boolean;
  onCancel?: () => void;
  submitLabel?: string;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({
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
    config: initialData?.config || '{}',
  });
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setForm({
      name: initialData?.name || '',
      displayName: initialData?.displayName || '',
      description: initialData?.description || '',
      config: initialData?.config || '{}',
    });
  }, [initialData]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
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
        setLocalError(err.message || 'Failed to save application');
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
        <label className="block text-sm font-medium text-gray-700">Config (JSON)</label>
        <textarea
          value={form.config}
          onChange={e => handleChange('config', e.target.value)}
          disabled={readOnly}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono"
          rows={3}
          placeholder="{ }"
        />
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

export default ApplicationForm;
