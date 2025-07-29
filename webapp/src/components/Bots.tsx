import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Bot, Eye, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface Bot {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  prompts: Array<{ id: string; name: string }>;
  createdAt: string;
}

const Bots: React.FC = () => {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      const response = await api.get('/bots');
      setBots(response.data);
    } catch (error) {
      console.error('Error fetching bots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (botId: string) => {
    if (!window.confirm('Are you sure you want to delete this bot?')) {
      return;
    }

    try {
      await api.delete(`/bots/${botId}`);
      setBots(bots.filter(bot => bot.id !== botId));
    } catch (error) {
      console.error('Error deleting bot:', error);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bots</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your AI bots</p>
        </div>
        <button
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          onClick={() => navigate('/bots/create')}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Bot
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {bots.map((bot) => (
            <li key={bot.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      bot.isActive ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Bot className={`h-4 w-4 ${
                        bot.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                      }`} />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{bot.displayName}</p>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        bot.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {bot.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{bot.description}</p>
                    <div className="flex items-center mt-1">
                      <MessageSquare className="w-3 h-3 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {bot.prompts.length} prompt{bot.prompts.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/bots/${bot.id}`)}
                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded"
                    title="View Bot"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/bots/${bot.id}/edit`)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded"
                    title="Edit Bot"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(bot.id)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded"
                    title="Delete Bot"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Bots;
