import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Server, Activity, Settings, Globe, Shield, Clock } from 'lucide-react';
import api from '../utils/api';

interface Service {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  type: string;
  endpoint?: string;
  config?: any;
  status: string;
  healthCheck?: any;
  authentication?: any;
  createdAt: string;
  updatedAt: string;
}

const ViewService: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchService();
    }
  }, [id]);

  const fetchService = async () => {
    try {
      const response = await api.get(`/services/${id}`);
      setService(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch service');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Service Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">The service you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/services')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/services')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Services
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{service.displayName}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{service.description}</p>
          </div>
          <button
            onClick={() => navigate(`/services/${service.id}/edit`)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Service
          </button>
        </div>
      </div>

      {/* Service Status */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Service Status</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                service.isActive ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <Server className={`h-4 w-4 ${
                  service.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                }`} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Status</p>
                <p className={`text-sm ${
                  service.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {service.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900">
                <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Type</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{service.type.toUpperCase()}</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-yellow-100 dark:bg-yellow-900">
                <Activity className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">State</p>
                <p className={`text-sm ${
                  service.status === 'active' ? 'text-green-600 dark:text-green-400' :
                  service.status === 'draft' ? 'text-yellow-600 dark:text-yellow-400' :
                  service.status === 'deprecated' ? 'text-red-600 dark:text-red-400' :
                  'text-gray-500 dark:text-gray-400'
                }`}>
                  {service.status}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Details */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Service Details</h2>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{service.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Display Name</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{service.displayName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{service.description || 'No description provided'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Endpoint</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{service.endpoint || 'No endpoint configured'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {new Date(service.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {new Date(service.updatedAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Configuration */}
      {(service.config || service.healthCheck || service.authentication) && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Configuration</h2>
          </div>
          <div className="p-6">
            {service.config && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Service Configuration</h3>
                <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md text-sm overflow-x-auto">
                  {JSON.stringify(service.config, null, 2)}
                </pre>
              </div>
            )}
            {service.healthCheck && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Health Check</h3>
                <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md text-sm overflow-x-auto">
                  {JSON.stringify(service.healthCheck, null, 2)}
                </pre>
              </div>
            )}
            {service.authentication && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Authentication</h3>
                <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md text-sm overflow-x-auto">
                  {JSON.stringify(service.authentication, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewService;
