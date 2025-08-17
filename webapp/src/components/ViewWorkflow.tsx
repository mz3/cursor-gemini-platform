import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Play, Pause, Settings, Trash2, Calendar, User, Activity } from 'lucide-react';
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

const ViewWorkflow: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchWorkflow(id);
    }
  }, [id]);

  const fetchWorkflow = async (workflowId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/workflows/${workflowId}`);
      setWorkflow(response.data);
    } catch (error) {
      console.error('Error fetching workflow:', error);
      setError('Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!workflow) return;

    try {
      await api.patch(`/workflows/${workflow.id}`, { isActive: !workflow.isActive });
      setWorkflow(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
    } catch (error) {
      console.error('Error toggling workflow status:', error);
      setError('Failed to update workflow status');
    }
  };

  const handleDelete = async () => {
    if (!workflow) return;

    if (!confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/workflows/${workflow.id}`);
      navigate('/workflows');
    } catch (error) {
      console.error('Error deleting workflow:', error);
      setError('Failed to delete workflow');
    }
  };

  const handleExecute = async () => {
    if (!workflow) return;

    try {
      await api.post(`/workflows/${workflow.id}/execute`);
      // TODO: Show success message and maybe redirect to execution logs
      alert('Workflow execution started!');
    } catch (error) {
      console.error('Error executing workflow:', error);
      setError('Failed to execute workflow');
    }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Workflow Details</h1>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/workflows')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {workflow.displayName}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {workflow.name}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              workflow.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {workflow.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {workflow.isActive && (
            <button
              onClick={handleExecute}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Play className="w-4 h-4 mr-2" />
              Execute
            </button>
          )}
          <Link
            to={`/workflows/${workflow.id}/designer`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Settings className="w-4 h-4 mr-2" />
            Open Designer
          </Link>
          <Link
            to={`/workflows/${workflow.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={handleToggleActive}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              workflow.isActive
                ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            }`}
          >
            {workflow.isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {workflow.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
        </div>
      )}

      {/* Workflow Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Description</h3>
            <p className="text-gray-700 dark:text-gray-300">{workflow.description}</p>
          </div>

          {/* Configuration */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Configuration</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Timeout</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {workflow.config.settings?.timeout || 30000}ms
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Max Retries</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {workflow.config.settings?.retries || 3}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Execution Mode</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {workflow.config.settings?.parallel ? 'Parallel' : 'Sequential'}
                  </dd>
                </div>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Raw Configuration</dt>
                <dd className="mt-1">
                  <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(workflow.config, null, 2)}
                  </pre>
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Metadata</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Created
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {new Date(workflow.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                  <Activity className="w-4 h-4 mr-1" />
                  Last Updated
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {new Date(workflow.updatedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to={`/workflows/${workflow.id}/designer`}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Settings className="w-4 h-4 mr-2" />
                Open Designer
              </Link>
              <button
                onClick={() => navigate(`/workflows/${workflow.id}/edit`)}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewWorkflow;
