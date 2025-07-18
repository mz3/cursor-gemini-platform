import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Database, Calendar, User, Settings } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

interface Model {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  schema: any;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Entity {
  name: string;
  displayName: string;
  description?: string;
  tableName: string;
  fields: number;
  relationships: number;
  isSystem: boolean;
  createdAt: string;
  type: string;
}

const ViewModel: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [model, setModel] = useState<Model | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadModelData();
    }
  }, [id]);

  const loadModelData = async () => {
    try {
      setLoading(true);
      const [modelResponse, applicationsResponse, relationshipsResponse] = await Promise.all([
        api.get(`/models/${id}`),
        api.get('/applications'),
        api.get('/relationships')
      ]);

      setModel(modelResponse.data);
      
      // Get applications that use this model
      const modelApplications = applicationsResponse.data.filter((app: any) => app.modelId === id);
      
      // Get relationships where this model is involved
      const modelRelationships = relationshipsResponse.data.filter((rel: any) => 
        rel.sourceModelId === id || rel.targetModelId === id
      );

      // Transform into entities for display
      const entityList: Entity[] = [
        // Applications using this model
        ...modelApplications.map((app: any) => ({
          name: app.name,
          displayName: app.displayName,
          description: app.description,
          tableName: 'applications',
          fields: 0,
          relationships: 1, // Has relationship to model
          isSystem: false,
          createdAt: app.createdAt,
          type: 'Application'
        })),
        // Relationships involving this model
        ...modelRelationships.map((rel: any) => ({
          name: rel.name,
          displayName: rel.displayName,
          description: rel.description,
          tableName: 'relationships',
          fields: 0,
          relationships: 1,
          isSystem: false,
          createdAt: rel.createdAt,
          type: 'Relationship'
        }))
      ];

      setEntities(entityList);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load model');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderSchemaVisualization = (schema: any) => {
    if (!schema?.fields) return <p className="text-gray-500">No schema defined</p>;

    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Schema Fields</h4>
        <div className="space-y-2">
          {schema.fields.map((field: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{field.name}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {field.type}
                  </span>
                  {field.required && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      Required
                    </span>
                  )}
                  {field.unique && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Unique
                    </span>
                  )}
                </div>
                {field.description && (
                  <p className="text-sm text-gray-600 mt-1">{field.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Error Loading Model</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/models')}
            className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
          >
            Back to Models
          </button>
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Model Not Found</h2>
          <p className="text-gray-600 mb-4">The requested model could not be found.</p>
          <button
            onClick={() => navigate('/models')}
            className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
          >
            Back to Models
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/models')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Models
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{model.displayName}</h1>
            <p className="text-gray-600 mt-2">{model.description || 'No description provided'}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/models/${model.id}/edit`)}
              className="flex items-center bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Model
            </button>
          </div>
        </div>
      </div>

      {/* Model Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Database className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Model Details</h3>
          </div>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="text-sm text-gray-900 font-mono">{model.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="text-sm text-gray-900">
                {model.isSystem ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    System Model
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Custom Model
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="text-sm text-gray-900">
                {model.isActive ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Inactive
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Created By</h3>
          </div>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">User</dt>
              <dd className="text-sm text-gray-900">{model.user?.firstName} {model.user?.lastName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="text-sm text-gray-900">{model.user?.email}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Timestamps</h3>
          </div>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="text-sm text-gray-900">{formatDate(model.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="text-sm text-gray-900">{formatDate(model.updatedAt)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Schema Visualization */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex items-center mb-4">
          <Settings className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Schema Definition</h3>
        </div>
        {renderSchemaVisualization(model.schema)}
      </div>

      {/* Entities Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Model Entities</h3>
          <p className="text-sm text-gray-600 mt-1">
            Entities and relationships defined by this model
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Display Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fields
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Relationships
                </th>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Entity Type
                 </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entities.length > 0 ? (
                entities.map((entity, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{entity.name}</div>
                      {entity.description && (
                        <div className="text-sm text-gray-500">{entity.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entity.displayName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-800">
                        {entity.tableName}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entity.fields}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entity.relationships}
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                         {entity.type}
                       </span>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(entity.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No entities found for this model
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ViewModel; 