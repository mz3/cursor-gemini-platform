import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

const CreateModel: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (data: ModelFormData) => {
    setLoading(true);
    setError('');

    try {
      // Create model
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
        isSystem: false,
        userId: user?.id,
      };
      if (data.relationships && data.relationships.length > 0) {
        modelData.relationships = data.relationships;
      }
      await api.post('/models', modelData);
      navigate('/models');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create model');
      throw err; // Re-throw so the form can handle it
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

      <ModelForm
        onSubmit={handleSubmit}
        submitLabel="Create Model"
        loading={loading}
        error={error}
        onCancel={() => navigate('/models')}
        showCancelButton={true}
        onError={setError}
      />
    </div>
  );
};

export default CreateModel;
