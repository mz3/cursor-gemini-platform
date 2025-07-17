// HOT RELOAD TEST: This comment was added to test live reload.
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Database, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface Model {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  schema: any;
  isSystem: boolean;
  createdAt: string;
}

const Models: React.FC = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await api.get('/models');
      setModels(response.data);
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (modelId: string) => {
    if (window.confirm('Are you sure you want to delete this model? This action cannot be undone.')) {
      try {
        await api.delete(`/models/${modelId}`);
        fetchModels(); // Refresh the list
      } catch (error) {
        console.error('Error deleting model:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Models</h1>
          <p className="text-gray-600">Manage your data models and sdsffsdfsdchemas</p>
        </div>
        <button
          onClick={() => navigate('/models/create')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Model
        </button>
      </div>

      {models.length === 0 ? (
        <div className="text-center py-12">
          <Database className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No models</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first data model.</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/models/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Model
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {models.map((model) => (
              <li key={model.id}>
                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Database className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">{model.displayName}</p>
                        {model.isSystem && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            System
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{model.name}</p>
                      {model.description && (
                        <p className="text-sm text-gray-400 mt-1">{model.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {model.schema?.fields?.length || 0} fields • Created {new Date(model.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/models/${model.id}`)}
                      className="text-gray-400 hover:text-blue-600 p-1 rounded"
                      title="View Model"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/models/${model.id}/edit`)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded"
                      title="Edit Model"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {!model.isSystem && (
                      <button
                        onClick={() => handleDelete(model.id)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded"
                        title="Delete Model"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Models;
