import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
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
  id?: string;
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

const EditSchema: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<SchemaFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Load schema data
  useEffect(() => {
    if (id) {
      loadSchema();
    }
  }, [id]);

  const loadSchema = async () => {
    try {
      setLoading(true);
      const [schemaResponse, relationshipsResponse] = await Promise.all([
        api.get(`/schemas/${id}`),
        api.get(`/relationships`)
      ]);

      const schema = schemaResponse.data;
      const relationships = relationshipsResponse.data.filter((rel: any) => rel.sourceSchemaId === id);

      setFormData({
        name: schema.name,
        displayName: schema.displayName,
        description: schema.description || '',
        fields: schema.schema?.fields || [],
        relationships: relationships.map((rel: any) => ({
          id: rel.id,
          name: rel.name,
          displayName: rel.displayName,
          type: rel.type,
          targetSchemaId: rel.targetSchemaId,
          sourceField: rel.sourceField,
          targetField: rel.targetField,
          cascade: rel.cascade,
          nullable: rel.nullable,
          description: rel.description || '',
        })),
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load schema');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: SchemaFormData) => {
    setSaving(true);
    setError('');

    try {
      // Update schema
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
      };

      // Update schema
      await api.put(`/schemas/${id}`, schemaData);

      // Update relationships
      if (data.relationships && data.relationships.length > 0) {
        // First, delete existing relationships
        const existingRelationships = data.relationships.filter(rel => rel.id);
        for (const rel of existingRelationships) {
          if (rel.id) {
            await api.delete(`/relationships/${rel.id}`);
          }
        }

        // Then create new relationships
        for (const rel of data.relationships) {
          await api.post('/relationships', {
            ...rel,
            sourceSchemaId: id,
            userId: user?.id,
          });
        }
      }

              navigate('/schemas');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update schema');
      throw err; // Re-throw so the form can handle it
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">Failed to load schema data</div>
        </div>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Edit Schema</h1>
        <p className="text-gray-600 mt-2">Update your data schema with custom fields and properties</p>
      </div>

              <SchemaForm
        initialData={formData}
        onSubmit={handleSubmit}
                  submitLabel="Update Schema"
        loading={saving}
        error={error}
        onCancel={() => navigate('/schemas')}
        showCancelButton={true}
        onError={setError}
      />
    </div>
  );
};

export default EditSchema;
