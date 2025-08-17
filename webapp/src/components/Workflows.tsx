import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Play, Pause, Edit, Eye, Trash2, Workflow as WorkflowIcon, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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

const Workflows: React.FC = () => {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const response = await api.get('/workflows');
      setWorkflows(response.data);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      setError('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (workflowId: string, isActive: boolean) => {
    try {
      await api.patch(`/workflows/${workflowId}`, { isActive: !isActive });
      setWorkflows(prev =>
        prev.map(workflow =>
          workflow.id === workflowId
            ? { ...workflow, isActive: !isActive }
            : workflow
        )
      );
    } catch (error) {
      console.error('Error toggling workflow status:', error);
      setError('Failed to update workflow status');
    }
  };

  const handleDelete = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/workflows/${workflowId}`);
      setWorkflows(prev => prev.filter(workflow => workflow.id !== workflowId));
    } catch (error) {
      console.error('Error deleting workflow:', error);
      setError('Failed to delete workflow');
    }
  };

  const handleExecute = async (workflowId: string) => {
    try {
      await api.post(`/workflows/${workflowId}/execute`);
      // TODO: Show success message and maybe redirect to execution logs
      alert('Workflow execution started!');
    } catch (error) {
      console.error('Error executing workflow:', error);
      setError('Failed to execute workflow');
    }
  };

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Workflows</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Design and manage automated workflows with visual tools
          </p>
        </div>
        <Link
          to="/workflows/create"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Search workflows..."
        />
      </div>

      {/* Workflows Grid */}
      {filteredWorkflows.length === 0 ? (
        <div className="text-center py-12">
          <WorkflowIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No workflows</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No workflows match your search.' : 'Get started by creating a new workflow.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <Link
                to="/workflows/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Workflow
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredWorkflows.map((workflow) => (
            <div
              key={workflow.id}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <WorkflowIcon className="w-6 h-6 text-primary-600 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {workflow.displayName}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        workflow.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {workflow.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {workflow.description}
                </p>

                <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <p>Name: {workflow.name}</p>
                  <p>Updated: {new Date(workflow.updatedAt).toLocaleDateString()}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/workflows/${workflow.id}`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/workflows/${workflow.id}/designer`}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Open Designer"
                    >
                      <Settings className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/workflows/${workflow.id}/edit`}
                      className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="flex items-center space-x-2">
                    {workflow.isActive && (
                      <button
                        onClick={() => handleExecute(workflow.id)}
                        className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                        title="Execute Workflow"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleActive(workflow.id, workflow.isActive)}
                      className={`${
                        workflow.isActive
                          ? 'text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300'
                          : 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                      }`}
                      title={workflow.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {workflow.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(workflow.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Workflows;
