import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

interface Field {
  name: string;
  displayName: string;
  type: string;
  required: boolean;
  unique: boolean;
  defaultValue?: string;
  validation?: any;
  options?: string[];
  description?: string;
  order: number;
}

// Relationship type for form state
interface RelationshipForm {
  id?: string;
  name: string;
  displayName: string;
  type: string; // one-to-one, one-to-many, many-to-one, many-to-many
  targetModelId: string;
  sourceField: string;
  targetField: string;
  cascade: boolean;
  nullable: boolean;
  description?: string;
}

interface SchemaFormData {
  name: string;
  displayName: string;
  description: string;
  fields: Field[];
  relationships?: RelationshipForm[];
}

interface SchemaFormProps {
  initialData?: SchemaFormData;
  onSubmit: (data: SchemaFormData) => Promise<void>;
  submitLabel: string;
  loading: boolean;
  error: string;
  onCancel?: () => void;
  showCancelButton?: boolean;
  onError?: (error: string) => void;
}

const relationshipTypes = [
  { value: 'one-to-one', label: 'One to One' },
  { value: 'one-to-many', label: 'One to Many' },
  { value: 'many-to-one', label: 'Many to One' },
  { value: 'many-to-many', label: 'Many to Many' },
];

const fieldTypes = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
  { value: 'text', label: 'Long Text' },
  { value: 'json', label: 'JSON' },
  { value: 'uuid', label: 'UUID' },
  { value: 'select', label: 'Select/Enum' }
];

const SchemaForm: React.FC<SchemaFormProps> = ({
  initialData,
  onSubmit,
  submitLabel,
  loading,
  error,
  onCancel,
  showCancelButton = true,
  onError
}) => {
  const [form, setForm] = useState<SchemaFormData>(initialData || {
    name: '',
    displayName: '',
    description: '',
    fields: [],
    relationships: [],
  });
  const [models, setModels] = useState<any[]>([]); // For dropdown
  const { user } = useAuth();

  // Fetch models for relationship dropdown
  useEffect(() => {
    api.get('/schemas')
      .then(res => setModels(res.data))
      .catch(() => setModels([]));
  }, []);

  const addField = () => {
    const newField: Field = {
      name: '',
      displayName: '',
      type: 'string',
      required: false,
      unique: false,
      order: form.fields.length
    };
    setForm(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  const removeField = (index: number) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const updateField = (index: number, field: Partial<Field>) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? { ...f, ...field } : f)
    }));
  };

  // Relationship handlers
  const addRelationship = () => {
    setForm(prev => ({
      ...prev,
      relationships: [
        ...(prev.relationships || []),
        {
          name: '',
          displayName: '',
          type: 'one-to-many',
          targetModelId: '',
          sourceField: '',
          targetField: '',
          cascade: false,
          nullable: true,
          description: '',
        },
      ],
    }));
  };

  const removeRelationship = (index: number) => {
    setForm(prev => ({
      ...prev,
      relationships: (prev.relationships || []).filter((_, i) => i !== index),
    }));
  };

  const updateRelationship = (index: number, rel: Partial<RelationshipForm>) => {
    setForm(prev => ({
      ...prev,
      relationships: (prev.relationships || []).map((r, i) => i === index ? { ...r, ...rel } : r),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!form.name || !form.displayName) {
      onError?.('Name and Display Name are required');
      return;
    }

    if (form.fields.length === 0) {
      onError?.('At least one field is required');
      return;
    }

    // Validate fields
    for (const field of form.fields) {
      if (!field.name || !field.displayName) {
        onError?.('All fields must have a name and display name');
        return;
      }
    }

    // Validate relationships
    if (form.relationships && form.relationships.length > 0) {
      for (const rel of form.relationships) {
        if (!rel.name || !rel.displayName || !rel.type || !rel.targetModelId || !rel.sourceField || !rel.targetField) {
          onError?.('All relationships must have name, display name, type, target model, source field, and target field');
          return;
        }
      }
    }

    try {
      await onSubmit(form);
    } catch (err: any) {
      onError?.(err.message || 'An error occurred while saving the model');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Model Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Model Name *
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Product, Customer, Order"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Used for database table name and API endpoints</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Name *
            </label>
            <input
              id="displayName"
              type="text"
              value={form.displayName}
              onChange={(e) => setForm(prev => ({ ...prev, displayName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Products, Customers, Orders"
            />
            <p className="text-xs text-gray-500 mt-1">Shown in the UI and navigation</p>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={3}
            placeholder="Describe what this model represents..."
          />
        </div>
      </div>

      {/* Fields Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Fields</h2>
          <button
            type="button"
            onClick={addField}
            className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </button>
        </div>

        {form.fields.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No fields added yet. Click "Add Field" to start building your schema.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {form.fields.map((field, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Field {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Field Name *
                    </label>
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => updateField(index, { name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Field name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      value={field.displayName}
                      onChange={(e) => updateField(index, { displayName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Display name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data Type *
                    </label>
                    <select
                      value={field.type}
                      onChange={(e) => updateField(index, { type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {fieldTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Value
                    </label>
                    <input
                      type="text"
                      value={field.defaultValue || ''}
                      onChange={(e) => updateField(index, { defaultValue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Default value for this field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`required-${index}`}
                      checked={field.required}
                      onChange={(e) => updateField(index, { required: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`required-${index}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Required
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`unique-${index}`}
                      checked={field.unique}
                      onChange={(e) => updateField(index, { unique: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`unique-${index}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Unique
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={field.order}
                      onChange={(e) => updateField(index, { order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      min="0"
                    />
                  </div>
                </div>

                {field.type === 'select' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Options (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={field.options?.join(', ') || ''}
                      onChange={(e) => updateField(index, {
                        options: e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Active, Inactive, Pending"
                    />
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={field.description || ''}
                    onChange={(e) => updateField(index, { description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={2}
                    placeholder="Describe this field..."
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Relationships Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Relationships</h2>
          <button
            type="button"
            onClick={addRelationship}
            className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Relationship
          </button>
        </div>
        {(form.relationships?.length === 0) ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No relationships defined yet. Click "Add Relationship" to link this model to others.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {form.relationships?.map((rel, idx) => (
              <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Relationship {idx + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeRelationship(idx)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name *</label>
                    <input
                      type="text"
                      value={rel.name}
                      onChange={e => updateRelationship(idx, { name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., project_tasks"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name *</label>
                    <input
                      type="text"
                      value={rel.displayName}
                      onChange={e => updateRelationship(idx, { displayName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Project Tasks"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type *</label>
                    <select
                      value={rel.type}
                      onChange={e => updateRelationship(idx, { type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {relationshipTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Model *</label>
                    <select
                      value={rel.targetModelId}
                      onChange={e => updateRelationship(idx, { targetModelId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select model...</option>
                      {models.filter(m => m.name !== form.name).map(model => (
                        <option key={model.id} value={model.id}>{model.displayName || model.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Source Field *</label>
                    <input
                      type="text"
                      value={rel.sourceField}
                      onChange={e => updateRelationship(idx, { sourceField: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., projectId"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Field *</label>
                    <input
                      type="text"
                      value={rel.targetField}
                      onChange={e => updateRelationship(idx, { targetField: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., id"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cascade</label>
                    <input
                      type="checkbox"
                      checked={rel.cascade}
                      onChange={e => updateRelationship(idx, { cascade: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nullable</label>
                    <input
                      type="checkbox"
                      checked={rel.nullable}
                      onChange={e => updateRelationship(idx, { nullable: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={rel.description || ''}
                    onChange={e => updateRelationship(idx, { description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={2}
                    placeholder="Describe this relationship..."
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        {showCancelButton && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default SchemaForm;
