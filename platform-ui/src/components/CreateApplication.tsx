import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import ApplicationForm from './ApplicationForm';

const CreateApplication: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: { name: string; displayName: string; description: string; config: string }) => {
    setLoading(true);
    setError('');
    try {
      await api.post('/applications', {
        ...data,
        config: data.config ? JSON.parse(data.config) : {},
        userId: user?.id,
      });
      navigate('/applications');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create application');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/applications')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Applications
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Application</h1>
        <p className="text-gray-600 mt-2">Create a new application</p>
      </div>
      <ApplicationForm
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        submitLabel="Create Application"
        onCancel={() => navigate('/applications')}
      />
    </div>
  );
};

export default CreateApplication;
