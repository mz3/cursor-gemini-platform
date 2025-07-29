import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface Application {
  id: string;
  name: string;
  displayName: string;
  description: string;
}

interface FeatureFormProps {
  initialData?: {
    name: string;
    displayName: string;
    description: string;
    isActive: boolean;
    status: string;
    config: any;
    applicationIds: string[];
  };
  onSubmit?: (data: {
    name: string;
    displayName: string;
    description: string;
    isActive: boolean;
    status: string;
    config: any;
    applicationIds: string[]
  }) => Promise<void>;
  loading?: boolean;
  error?: string;
  readOnly?: boolean;
  onCancel?: () => void;
  submitLabel?: string;
}

const FeatureForm: React.FC<FeatureFormProps> = ({
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
    status: initialData?.status || 'draft',
    config: initialData?.config || {},
    applicationIds: initialData?.applicationIds || [],
  });

  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoadingApplications(true);
    try {
      const response = await api.get('/applications');
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      await onSubmit(form);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleApplicationToggle = (applicationId: string) => {
    setForm(prev => ({
      ...prev,
      applicationIds: prev.applicationIds.includes(applicationId)
        ? prev.applicationIds.filter(id => id !== applicationId)
        : [...prev.applicationIds, applicationId]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            placeholder="feature-name"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Internal name (slug format)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Display Name *
          </label>
          <input
            type="text"
            value={form.displayName}
            onChange={(e) => handleInputChange('displayName', e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            placeholder="Feature Display Name"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          disabled={readOnly}
          rows={3}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          placeholder="Describe this feature..."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="deprecated">Deprecated</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={form.isActive}
            onChange={(e) => handleInputChange('isActive', e.target.checked)}
            disabled={readOnly}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
            Active
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Configuration (JSON)
        </label>
        <textarea
          value={JSON.stringify(form.config, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              handleInputChange('config', parsed);
            } catch (error) {
              // Invalid JSON, don't update
            }
          }}
          disabled={readOnly}
          rows={6}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 font-mono text-sm"
          placeholder='{"key": "value"}'
        />
        <p className="mt-1 text-sm text-gray-500">
          JSON configuration for this feature
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Associated Applications
        </label>
        {loadingApplications ? (
          <div className="text-sm text-gray-500">Loading applications...</div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
            {applications.length === 0 ? (
              <div className="text-sm text-gray-500">No applications available</div>
            ) : (
              applications.map((application) => (
                <label key={application.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.applicationIds.includes(application.id)}
                    onChange={() => handleApplicationToggle(application.id)}
                    disabled={readOnly}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    {application.displayName} ({application.name})
                  </span>
                </label>
              ))
            )}
          </div>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Select applications that use this feature
        </p>
      </div>

      {!readOnly && (
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : submitLabel}
          </button>
        </div>
      )}
    </form>
  );
};

export default FeatureForm;
