import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import FeatureForm from './FeatureForm';

interface Feature {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  status: string;
  config: any;
  applications: Array<{ id: string; name: string; displayName: string }>;
}

const EditFeature: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [feature, setFeature] = useState<Feature | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeature();
  }, [id]);

  const fetchFeature = async () => {
    try {
      const response = await api.get(`/features/${id}`);
      setFeature(response.data);
    } catch (error) {
      setError('Failed to load feature');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: {
    name: string;
    displayName: string;
    description: string;
    isActive: boolean;
    status: string;
    config: any;
    applicationIds: string[]
  }) => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/features/${id}`, data);
      navigate('/features');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update feature');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!feature) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">Feature not found</h2>
          <button
            onClick={() => navigate('/features')}
            className="mt-4 text-blue-600 hover:text-blue-500"
          >
            Back to Features
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/features')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Features
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Feature</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <FeatureForm
          initialData={{
            name: feature.name,
            displayName: feature.displayName,
            description: feature.description,
            isActive: feature.isActive,
            status: feature.status,
            config: feature.config,
            applicationIds: feature.applications.map(app => app.id),
          }}
          onSubmit={handleSubmit}
          loading={saving}
          error={error}
          submitLabel="Update Feature"
        />
      </div>
    </div>
  );
};

export default EditFeature;
