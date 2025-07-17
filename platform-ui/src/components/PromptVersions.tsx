import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

interface PromptVersion {
  id: string;
  name: string;
  content: string;
  type: 'llm' | 'code_generation';
  description?: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  promptId: string;
}

const PromptVersions: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);

  useEffect(() => {
    if (id) {
      fetchVersions();
    }
  }, [id]);

  const fetchVersions = async () => {
    try {
      const response = await api.get(`/prompts/${id}/versions`);
      setVersions(response.data);
      if (response.data.length > 0) {
        setSelectedVersion(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching prompt versions:', error);
      setError('Failed to load prompt versions');
    } finally {
      setLoading(false);
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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/prompts')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/prompts')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prompt Versions</h1>
          <p className="text-gray-600 mt-1">
            {versions.length > 0 ? `${versions[0].name} - ${versions.length} version${versions.length > 1 ? 's' : ''}` : 'No versions found'}
          </p>
        </div>
      </div>

      {versions.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No versions found</h3>
          <p className="mt-1 text-sm text-gray-500">This prompt has no version history.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Version List */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Versions</h3>
                <div className="space-y-2">
                  {versions.map((version) => (
                    <button
                      key={version.id}
                      onClick={() => setSelectedVersion(version)}
                      className={`w-full text-left p-3 rounded-md border transition-colors ${
                        selectedVersion?.id === version.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            v{version.version}
                          </span>
                          {version.isActive && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(version.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(version.type)}`}>
                          {version.type === 'llm' ? 'LLM' : 'Code Generation'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Version Content */}
          <div className="lg:col-span-2">
            {selectedVersion ? (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Version {selectedVersion.version}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Created {new Date(selectedVersion.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(selectedVersion.type)}`}>
                        {selectedVersion.type === 'llm' ? 'LLM' : 'Code Generation'}
                      </span>
                      {selectedVersion.isActive && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedVersion.description && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                      <p className="text-sm text-gray-600">{selectedVersion.description}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Content</h4>
                    <div className="bg-gray-50 rounded-md p-4">
                      <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
                        {selectedVersion.content}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6 text-center">
                  <Eye className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Select a version</h3>
                  <p className="mt-1 text-sm text-gray-500">Choose a version from the list to view its content.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptVersions;
