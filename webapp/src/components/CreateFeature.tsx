import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import FeatureForm from './FeatureForm';

const CreateFeature: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: {
    name: string;
    displayName: string;
    description: string;
    isActive: boolean;
    status: string;
    config: any;
    applicationIds: string[]
  }) => {
    setLoading(true);
    setError('');
    try {
      await api.post('/features', {
        ...data,
        userId: user?.id,
      });
      navigate('/features');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create feature');
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Create Feature</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <FeatureForm
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          submitLabel="Create Feature"
        />
      </div>
    </div>
  );
};

export default CreateFeature;
