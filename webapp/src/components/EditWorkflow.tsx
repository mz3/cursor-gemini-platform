import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import WorkflowForm from './WorkflowForm';
import { api } from '../utils/api';

interface Workflow {
  id: string;
  name: string;
  displayName: string;
  description: string;
  config: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const EditWorkflow: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchWorkflow(id);
    }
  }, [id]);

  const fetchWorkflow = async (workflowId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/workflows/${workflowId}`);
      setWorkflow(response.data);
    } catch (error) {
      console.error('Error fetching workflow:', error);
      setError('Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (workflowData: any) => {
    if (!id) return;

    try {
      setIsSubmitting(true);
      await api.put(`/api/workflows/${id}`, workflowData);
      navigate(`/workflows/${id}`);
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/workflows/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/workflows')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Workflow</h1>
        </div>
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="text-sm text-red-700 dark:text-red-400">
            {error || 'Workflow not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(`/workflows/${id}`)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Workflow</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Modify the settings for "{workflow.displayName}"
          </p>
        </div>
      </div>

      {/* Form */}
      <WorkflowForm
        workflow={workflow}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default EditWorkflow;
