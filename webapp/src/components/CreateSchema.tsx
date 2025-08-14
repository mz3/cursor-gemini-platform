import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import SchemaForm from './SchemaForm';

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

interface RelationshipForm {
  name: string;
  displayName: string;
  type: string;
  targetSchemaId: string;
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

const CreateSchema: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (data: SchemaFormData) => {
    setLoading(true);
    setError('');

    try {
      // Create schema
      const schemaData: any = {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        schema: {
          fields: data.fields.map(field => ({
            ...field,
            name: field.name.toLowerCase().replace(/\s+/g, '_'),
          })),
        },
        isSystem: false,
        userId: user?.id,
      };
      if (data.relationships && data.relationships.length > 0) {
        schemaData.relationships = data.relationships;
      }
      await api.post('/schemas', schemaData);
              navigate('/schemas');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create schema');
      throw err; // Re-throw so the form can handle it
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/schemas')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Schemas
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Schema</h1>
        <p className="text-gray-600 mt-2">Design your data schema with custom fields and properties</p>
      </div>

              <SchemaForm
        onSubmit={handleSubmit}
                  submitLabel="Create Schema"
        loading={loading}
        error={error}
        onCancel={() => navigate('/schemas')}
        showCancelButton={true}
        onError={setError}
      />
    </div>
  );
};

export default CreateSchema;
