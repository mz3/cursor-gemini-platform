import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import ApplicationForm from './ApplicationForm';

const EditApplication: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      api.get(`/applications/${id}`)
        .then(res => setApplication({
          ...res.data,
          config: JSON.stringify(res.data.config, null, 2)
        }))
        .catch(err => setError(err.response?.data?.error || 'Failed to load application'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (data: { name: string; displayName: string; description: string }) => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/applications/${id}` , {
        ...data,
        config: application.config ? JSON.parse(application.config) : {},
      });
      navigate('/applications');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update application');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }
  if (error) {
    return <div className="max-w-2xl mx-auto p-6"><div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">{error}</div></div>;
  }
  if (!application) {
    return <div className="max-w-2xl mx-auto p-6"><div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">Application not found</div></div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/applications')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Applications
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Application</h1>
      </div>
      <ApplicationForm
        initialData={application}
        onSubmit={handleSubmit}
        loading={saving}
        error={error}
      />
    </div>
  );
};

export default EditApplication;
