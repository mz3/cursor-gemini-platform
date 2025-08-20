import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aiModelApi, UpdateAIModelDto } from '../services/aiModelService';
import AIModelForm from './AIModelForm';

const EditAIModel: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');

  const { data: aiModel, isLoading, error: fetchError } = useQuery({
    queryKey: ['ai-model', id],
    queryFn: () => aiModelApi.getById(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAIModelDto }) =>
      aiModelApi.update(id, data),
    onSuccess: () => {
      navigate('/ai-models');
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update AI model');
    },
  });

  const handleSubmit = async (data: UpdateAIModelDto) => {
    setError('');
    await updateMutation.mutateAsync({ id: id!, data });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (fetchError || !aiModel) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Edit AI Model
          </h2>
        </div>
        <div className="p-6">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">
              {fetchError?.message || 'AI model not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Edit AI Model
        </h2>
      </div>

      <div className="p-6">
        <AIModelForm
          initialData={aiModel}
          onSubmit={handleSubmit}
          loading={updateMutation.isPending}
          error={error}
        />
      </div>
    </div>
  );
};

export default EditAIModel;
