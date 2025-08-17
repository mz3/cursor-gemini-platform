import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import WorkflowForm from './WorkflowForm';
import { api } from '../utils/api';

const CreateWorkflow: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (workflowData: any) => {
    try {
      setIsLoading(true);
      const response = await api.post('/workflows', workflowData);
      navigate(`/workflows/${response.data.id}`);
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/workflows');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/workflows')}
          className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create Workflow</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Create a new automated workflow
          </p>
        </div>
      </div>

      {/* Form */}
      <WorkflowForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
};

export default CreateWorkflow;
