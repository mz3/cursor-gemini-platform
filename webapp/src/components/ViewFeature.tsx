import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Zap, Calendar, User, Settings, AppWindow } from 'lucide-react';
import api from '../utils/api';

interface Feature {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  status: string;
  config: any;
  applications: Array<{ id: string; name: string; displayName: string; description: string }>;
  createdAt: string;
  updatedAt: string;
}

const ViewFeature: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [feature, setFeature] = useState<Feature | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeature();
  }, [id]);

  const fetchFeature = async () => {
    try {
      const response = await api.get(`/features/${id}`);
      setFeature(response.data);
    } catch (error) {
      setError('Failed to load feature');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'deprecated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!feature) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">Feature not found</h2>
          <button
            onClick={() => navigate('/features')}
            className="mt-4 text-blue-600 hover:text-blue-500"
          >
            Back to Features
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/features')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Features
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{feature.displayName}</h1>
            <p className="text-gray-600 mt-1">{feature.name}</p>
          </div>
          <button
            onClick={() => navigate(`/features/${id}/edit`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-blue-600" />
              Feature Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">
                  {feature.description || 'No description provided'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}>
                    {feature.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Active</label>
                  <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${feature.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {feature.isActive ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-600" />
              Configuration
            </h2>
            <div className="bg-gray-50 rounded-md p-4">
              <pre className="text-sm text-gray-900 overflow-x-auto">
                {JSON.stringify(feature.config, null, 2)}
              </pre>
            </div>
          </div>

          {/* Associated Applications */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <AppWindow className="w-5 h-5 mr-2 text-blue-600" />
              Associated Applications
            </h2>
            {feature.applications.length === 0 ? (
              <p className="text-gray-500">No applications associated with this feature</p>
            ) : (
              <div className="space-y-3">
                {feature.applications.map((application) => (
                  <div key={application.id} className="border border-gray-200 rounded-md p-3">
                    <h3 className="font-medium text-gray-900">{application.displayName}</h3>
                    <p className="text-sm text-gray-600">{application.name}</p>
                    {application.description && (
                      <p className="text-sm text-gray-500 mt-1">{application.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Details</h2>
            <div className="space-y-4">
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-gray-600">Created:</span>
                <span className="ml-auto text-gray-900">
                  {new Date(feature.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-gray-600">Updated:</span>
                <span className="ml-auto text-gray-900">
                  {new Date(feature.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-gray-600">Applications:</span>
                <span className="ml-auto text-gray-900">
                  {feature.applications.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewFeature;
