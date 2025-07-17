import React, { useState } from 'react';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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

interface ModelForm {
  name: string;
  displayName: string;
  description: string;
  fields: Field[];
}

const CreateModel: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<ModelForm>({
    name: '',
    displayName: '',
    description: '',
    fields: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (!form.name || !form.displayName) {
        setError('Name and Display Name are required');
        setLoading(false);
        return;
      }

      if (form.fields.length === 0) {
        setError('At least one field is required');
        setLoading(false);
        return;
      }

      // Validate fields
      for (const field of form.fields) {
        if (!field.name || !field.displayName) {
          setError('All fields must have a name and display name');
          setLoading(false);
          return;
        }
      }

      // Create model
      const modelData = {
        name: form.name,
        displayName: form.displayName,
        description: form.description,
        schema: {
          fields: form.fields.map(field => ({
            ...field,
            name: field.name.toLowerCase().replace(/\s+/g, '_')
          }))
        },
        isSystem: false,
        userId: user?.id
      };

      await api.post('/models', modelData);
      navigate('/models');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create model');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/models')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Models
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Model</h1>
        <p className="text-gray-600 mt-2">Design your data model with custom fields and properties</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Model Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <p className="text-xs text-gray-500 mt-1">Used for database table name and API endpoints</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <h2 className="text-lg font-medium text-gray-900">Fields</h2>
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
            <div className="text-center py-8 text-gray-500">
              <p>No fields added yet. Click "Add Field" to start building your schema.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {form.fields.map((field, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-900">Field {index + 1}</h3>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      <label htmlFor={`required-${index}`} className="ml-2 text-sm text-gray-700">
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
                      <label htmlFor={`unique-${index}`} className="ml-2 text-sm text-gray-700">
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/models')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Model'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateModel;
