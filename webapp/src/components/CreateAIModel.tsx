import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { aiModelApi, CreateAIModelDto } from '../services/aiModelService';
import AIModelForm from './AIModelForm';

const CreateAIModel: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');

  const createMutation = useMutation({
    mutationFn: aiModelApi.create,
    onSuccess: () => {
      navigate('/ai-models');
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create AI model');
    },
  });

  const handleSubmit = async (data: CreateAIModelDto) => {
    setError('');
    await createMutation.mutateAsync(data);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Create AI Model
        </h2>
      </div>

      <div className="p-6">
        <AIModelForm
          onSubmit={handleSubmit}
          loading={createMutation.isPending}
          error={error}
        />
      </div>
    </div>
  );
};

export default CreateAIModel;
