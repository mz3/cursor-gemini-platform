import React, { useState, useEffect } from 'react';
import ErrorDisplay from './ErrorDisplay';

interface Service {
  id?: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  type: string;
  endpoint?: string;
  config?: any;
  status: string;
  healthCheck?: any;
  authentication?: any;
}

interface ServiceFormProps {
  initialData?: Service;
  onSubmit: (data: Service) => Promise<void>;
  loading?: boolean;
  error?: string;
  readOnly?: boolean;
}

const ServiceForm: React.FC<ServiceFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  error = '',
  readOnly = false
}) => {
  const [form, setForm] = useState<Service>({
    name: '',
    displayName: '',
    description: '',
    isActive: true,
    type: 'http',
    endpoint: '',
    config: null,
    status: 'draft',
    healthCheck: null,
    authentication: null
  });
  const [localError, setLocalError] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  const handleChange = (field: keyof Service, value: string | boolean | any) => {
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
      setLocalError(err.message || 'Failed to save service');
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={e => handleChange('name', e.target.value)}
          required
          disabled={readOnly}
          className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          placeholder="e.g. user-service"
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
          className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          placeholder="e.g. User Management Service"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <textarea
          value={form.description}
          onChange={e => handleChange('description', e.target.value)}
          disabled={readOnly}
          rows={3}
          className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          placeholder="Describe what this service does..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
        <select
          value={form.type}
          onChange={e => handleChange('type', e.target.value)}
          disabled={readOnly}
          className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        >
          <option value="http">HTTP</option>
          <option value="grpc">gRPC</option>
          <option value="websocket">WebSocket</option>
          <option value="tcp">TCP</option>
          <option value="udp">UDP</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Endpoint</label>
        <input
          type="url"
          value={form.endpoint || ''}
          onChange={e => handleChange('endpoint', e.target.value)}
          disabled={readOnly}
          className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          placeholder="https://api.example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
        <select
          value={form.status}
          onChange={e => handleChange('status', e.target.value)}
          disabled={readOnly}
          className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="deprecated">Deprecated</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          checked={form.isActive}
          onChange={e => handleChange('isActive', e.target.checked)}
          disabled={readOnly}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
          Active
        </label>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setForm({
            name: '',
            displayName: '',
            description: '',
            isActive: true,
            type: 'http',
            endpoint: '',
            config: null,
            status: 'draft',
            healthCheck: null,
            authentication: null
          })}
          disabled={readOnly}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={loading || readOnly}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
};

export default ServiceForm;
