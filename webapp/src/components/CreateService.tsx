import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ServiceForm from './ServiceForm';
import api from '../utils/api';

const CreateService: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    setLoading(true);
    setError('');

    try {
      await api.post('/services', data);
      navigate('/services');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create Service</h1>
        <p className="text-gray-600 dark:text-gray-400">Add a new external service to your platform</p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Service Details</h2>
        </div>
        <div className="p-6">
          <ServiceForm
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateService;
