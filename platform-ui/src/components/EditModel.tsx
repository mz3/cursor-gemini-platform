import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import ModelForm from './ModelForm';

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
  targetModelId: string;
  sourceField: string;
  targetField: string;
  cascade: boolean;
  nullable: boolean;
  description?: string;
}

interface ModelFormData {
  name: string;
  displayName: string;
  description: string;
  fields: Field[];
  relationships?: RelationshipForm[];
}

const EditModel: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<ModelFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Load model data
  useEffect(() => {
    if (id) {
      loadModel();
    }
  }, [id]);

  const loadModel = async () => {
    try {
      setLoading(true);
      const [modelResponse, relationshipsResponse] = await Promise.all([
        api.get(`/models/${id}`),
        api.get(`/relationships`)
      ]);

      const model = modelResponse.data;
      const relationships = relationshipsResponse.data.filter((rel: any) => rel.sourceModelId === id);

      setFormData({
        name: model.name,
        displayName: model.displayName,
        description: model.description || '',
        fields: model.schema?.fields || [],
        relationships: relationships.map((rel: any) => ({
          id: rel.id,
          name: rel.name,
          displayName: rel.displayName,
          type: rel.type,
          targetModelId: rel.targetModelId,
          sourceField: rel.sourceField,
          targetField: rel.targetField,
          cascade: rel.cascade,
          nullable: rel.nullable,
          description: rel.description || '',
        })),
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load model');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: ModelFormData) => {
    setSaving(true);
    setError('');

    try {
      // Update model
      const modelData: any = {
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

      // Update model
      await api.put(`/models/${id}`, modelData);

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
            sourceModelId: id,
            userId: user?.id,
          });
        }
      }

      navigate('/models');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update model');
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
          <div className="text-sm text-red-700">Failed to load model data</div>
        </div>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Edit Model</h1>
        <p className="text-gray-600 mt-2">Update your data model with custom fields and properties</p>
      </div>

      <ModelForm
        initialData={formData}
        onSubmit={handleSubmit}
        submitLabel="Update Model"
        loading={saving}
        error={error}
        onCancel={() => navigate('/models')}
        showCancelButton={true}
        onError={setError}
      />
    </div>
  );
};

export default EditModel;
