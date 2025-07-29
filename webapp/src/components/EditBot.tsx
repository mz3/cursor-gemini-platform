import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import BotForm from './BotForm';

interface Bot {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  prompts: Array<{ id: string; name: string }>;
}

const EditBot: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [bot, setBot] = useState<Bot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBot();
  }, [id]);

  const fetchBot = async () => {
    try {
      const response = await api.get(`/bots/${id}`);
      setBot(response.data);
    } catch (error) {
      console.error('Error fetching bot:', error);
      setError('Failed to load bot');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: { name: string; displayName: string; description: string; isActive: boolean; promptIds: string[] }) => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/bots/${id}`, data);
      navigate('/bots');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update bot');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Bot Not Found</h1>
          <p className="text-gray-600 mt-2">The bot you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/bots')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Back to Bots
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/bots')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Bots
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Bot</h1>
        <p className="text-gray-600 mt-2">Update bot settings and associated prompts</p>
      </div>
      <BotForm
        initialData={{
          name: bot.name,
          displayName: bot.displayName,
          description: bot.description,
          isActive: bot.isActive,
          promptIds: bot.prompts.map(p => p.id),
        }}
        onSubmit={handleSubmit}
        loading={saving}
        error={error}
        submitLabel="Update Bot"
        onCancel={() => navigate('/bots')}
      />
    </div>
  );
};

export default EditBot;
