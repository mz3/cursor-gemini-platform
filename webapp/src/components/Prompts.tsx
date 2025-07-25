import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, History, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface Prompt {
  id: string;
  name: string;
  content: string;
  type: 'llm' | 'code_generation';
  description?: string;
  version: number;
  isActive: boolean;
  createdAt: string;
}

const Prompts: React.FC = () => {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await api.get('/prompts');
      setPrompts(response.data);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (promptId: string) => {
    if (window.confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      try {
        await api.delete(`/prompts/${promptId}`);
        await fetchPrompts(); // Refresh the list
      } catch (error) {
        console.error('Error deleting prompt:', error);
      }
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'llm':
        return 'bg-blue-100 text-blue-800';
      case 'code_generation':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Prompts</h1>
          <p className="text-gray-600 mt-1">Manage your LLM and code generation prompts</p>
        </div>
        <button
          onClick={() => navigate('/prompts/create')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Prompt
        </button>
      </div>

      {prompts.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No prompts</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating your first prompt.</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/prompts/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Prompt
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {prompts.map((prompt) => (
              <li key={prompt.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <MessageSquare className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{prompt.name}</p>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(prompt.type)}`}>
                            {prompt.type === 'llm' ? 'LLM' : 'Code Generation'}
                          </span>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            v{prompt.version}
                          </span>
                        </div>
                        {prompt.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{prompt.description}</p>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Created {new Date(prompt.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/prompts/${prompt.id}/versions`)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <History className="h-4 w-4 mr-1" />
                        Versions
                      </button>
                      <button
                        onClick={() => navigate(`/prompts/${prompt.id}/edit`)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(prompt.id)}
                        className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
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

export default Prompts;
