import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import BotForm from './BotForm';

const CreateBot: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: { name: string; displayName: string; description: string; isActive: boolean; modelId?: string }) => {
    setLoading(true);
    setError('');
    try {
      await api.post('/bots', {
        ...data,
        userId: user?.id,
      });
      navigate('/bots');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create bot');
      throw err;
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Create New Bot</h1>
        <p className="text-gray-600 mt-2">Create a new AI bot with associated prompts</p>
      </div>
      <BotForm
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default CreateBot;
