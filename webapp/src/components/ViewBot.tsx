import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Bot, MessageSquare, Calendar, User } from 'lucide-react';
import api from '../utils/api';

interface Bot {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  prompts: Array<{ id: string; name: string; description?: string }>;
  createdAt: string;
  updatedAt: string;
}

const ViewBot: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [bot, setBot] = useState<Bot | null>(null);
  const [loading, setLoading] = useState(true);
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/bots')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Bots
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{bot.displayName}</h1>
            <p className="text-gray-600 mt-2">{bot.description}</p>
          </div>
          <button
            onClick={() => navigate(`/bots/${bot.id}/edit`)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Bot
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bot Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bot Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{bot.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Name</label>
                <p className="mt-1 text-sm text-gray-900">{bot.displayName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">{bot.description || 'No description provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                  bot.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {bot.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Associated Prompts */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Associated Prompts</h2>
              <div className="flex items-center text-sm text-gray-500">
                <MessageSquare className="w-4 h-4 mr-1" />
                {bot.prompts.length} prompt{bot.prompts.length !== 1 ? 's' : ''}
              </div>
            </div>
            {bot.prompts.length > 0 ? (
              <div className="space-y-3">
                {bot.prompts.map((prompt) => (
                  <div key={prompt.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">{prompt.name}</h3>
                    {prompt.description && (
                      <p className="text-sm text-gray-600 mt-1">{prompt.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No prompts associated with this bot.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bot Information</h3>
            <div className="space-y-4">
              <div className="flex items-center text-sm text-gray-600">
                <Bot className="w-4 h-4 mr-2" />
                <span>Bot ID: {bot.id}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Created: {new Date(bot.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Updated: {new Date(bot.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewBot;
