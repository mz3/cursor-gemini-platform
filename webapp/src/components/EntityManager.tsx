import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface Schema {
  id: string;
  name: string;
  displayName: string;
  schema: {
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
    }>;
  };
  createdAt: string;
}

interface Entity {
  id: string;
  name: string;
  displayName: string;
  data: Record<string, any>;
  schemaId: string;
  schema: Schema;
  createdAt: string;
}

interface Field {
  name: string;
  type: string;
  required: boolean;
}

export const Entities: React.FC = () => {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<Schema | null>(null);
  const [activeTab, setActiveTab] = useState<'schemas' | 'entities'>('schemas');

  // Schema creation state
  const [newSchema, setNewSchema] = useState({
    name: '',
    displayName: '',
    fields: [] as Field[]
  });

  // Entity creation state
  const [newEntity, setNewEntity] = useState({
    name: '',
    displayName: '',
    schemaId: '',
    data: {} as Record<string, any>
  });

  useEffect(() => {
    loadSchemas();
    loadEntities();
  }, []);

  const loadSchemas = async () => {
    try {
      const response = await api.get('/schemas');
      setSchemas(response.data);
    } catch (error) {
      console.error('Error loading schemas:', error);
    }
  };

  const loadEntities = async () => {
    try {
      const response = await api.get('/entities');
      setEntities(response.data);
    } catch (error) {
      console.error('Error loading entities:', error);
    }
  };

  const addField = () => {
    setNewSchema(prev => ({
      ...prev,
      fields: [...prev.fields, { name: '', type: 'string', required: true }]
    }));
  };

  const updateField = (index: number, field: Partial<Field>) => {
    setNewSchema(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? { ...f, ...field } : f)
    }));
  };

  const removeField = (index: number) => {
    setNewSchema(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const createSchema = async () => {
    try {
      const response = await api.post('/schemas', {
        name: newSchema.name,
        displayName: newSchema.displayName,
        userId: '48d1e67a-5db8-4a0d-8c34-83ab66a4d7ee', // Use the admin user ID
        schema: { fields: newSchema.fields }
      });

      setSchemas(prev => [...prev, response.data]);
      setNewSchema({ name: '', displayName: '', fields: [] });
      alert('Schema created successfully!');
    } catch (error) {
      console.error('Error creating schema:', error);
      alert('Error creating schema');
    }
  };

  const createEntity = async () => {
    try {
      const response = await api.post('/entities', newEntity);
      setEntities(prev => [...prev, response.data]);
      setNewEntity({ name: '', displayName: '', schemaId: '', data: {} });
      alert('Entity created successfully!');
    } catch (error) {
      console.error('Error creating entity:', error);
      alert('Error creating entity');
    }
  };

  const handleEntityDataChange = (fieldName: string, value: any) => {
    setNewEntity(prev => ({
      ...prev,
      data: { ...prev.data, [fieldName]: value }
    }));
  };

  const renderFieldInput = (field: any, value: any, onChange: (value: any) => void) => {
    switch (field.type) {
      case 'string':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`Enter ${field.name}`}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`Enter ${field.name}`}
          />
        );
      case 'boolean':
        return (
          <select
            value={value?.toString() || 'true'}
            onChange={(e) => onChange(e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`Enter ${field.name}`}
          />
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Entities</h1>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('schemas')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'schemas'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Schemas
        </button>
        <button
          onClick={() => setActiveTab('entities')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'entities'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Entities
        </button>
      </div>

      {activeTab === 'schemas' && (
        <div className="space-y-8">
          {/* Create Schema Form */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Create New Schema</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schema Name
                </label>
                <input
                  type="text"
                  value={newSchema.name}
                  onChange={(e) => setNewSchema(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Dog, Product, User"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newSchema.displayName}
                  onChange={(e) => setNewSchema(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Dog Schema, Product Schema"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fields
                </label>
                <div className="space-y-3">
                  {newSchema.fields.map((field, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateField(index, { name: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Field name"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => updateField(index, { type: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                      </select>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(index, { required: e.target.checked })}
                          className="mr-2"
                        />
                        Required
                      </label>
                      <button
                        onClick={() => removeField(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addField}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Add Field
                  </button>
                </div>
              </div>

              <button
                onClick={createSchema}
                disabled={!newSchema.name || !newSchema.displayName}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Create Schema
              </button>
            </div>
          </div>

          {/* Schemas List */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Existing Schemas</h2>
            <div className="space-y-4">
              {schemas.map((schema) => (
                <div key={schema.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{schema.displayName || schema.name}</h3>
                  <p className="text-gray-600 text-sm">Name: {schema.name}</p>
                  <div className="mt-2">
                    <h4 className="font-medium text-sm text-gray-700">Fields:</h4>
                    <div className="mt-1 space-y-1">
                      {schema.schema.fields.map((field, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          • {field.name} ({field.type}) {field.required ? '(required)' : '(optional)'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'entities' && (
        <div className="space-y-8">
          {/* Create Entity Form */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Create New Entity</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entity Name
                </label>
                <input
                  type="text"
                  value={newEntity.name}
                  onChange={(e) => setNewEntity(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., spot, laptop, john"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newEntity.displayName}
                  onChange={(e) => setNewEntity(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Spot the Dog, Gaming Laptop"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schema Type
                </label>
                <select
                  value={newEntity.schemaId}
                  onChange={(e) => {
                    const schemaId = e.target.value;
                    setNewEntity(prev => ({ ...prev, schemaId, data: {} }));
                    const selectedSchema = schemas.find(m => m.id === schemaId);
                    setSelectedSchema(selectedSchema || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a schema</option>
                  {schemas.map((schema) => (
                    <option key={schema.id} value={schema.id}>
                      {schema.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSchema && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entity Data
                  </label>
                  <div className="space-y-3">
                    {selectedSchema.schema.fields.map((field) => (
                      <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.name} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {renderFieldInput(
                          field,
                          newEntity.data[field.name],
                          (value) => handleEntityDataChange(field.name, value)
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={createEntity}
                disabled={!newEntity.name || !newEntity.displayName || !newEntity.schemaId}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Create Entity
              </button>
            </div>
          </div>

          {/* Entities List */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Existing Entities</h2>
            <div className="space-y-4">
              {entities.map((entity) => (
                <div key={entity.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{entity.displayName}</h3>
                  <p className="text-gray-600 text-sm">Name: {entity.name}</p>
                  <p className="text-gray-600 text-sm">Schema: {entity.schema?.displayName || entity.schema?.name}</p>
                  <div className="mt-2">
                    <h4 className="font-medium text-sm text-gray-700">Data:</h4>
                    <div className="mt-1 space-y-1">
                      {Object.entries(entity.data).map(([key, value]) => (
                        <div key={key} className="text-sm text-gray-600">
                          • {key}: {String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
