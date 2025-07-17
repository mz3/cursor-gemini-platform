import React, { useState, useEffect } from 'react';
import { Database, AppWindow, Users, TrendingUp } from 'lucide-react';
import axios from 'axios';

interface Stats {
  models: number;
  applications: number;
  users: number;
  builds: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ models: 0, applications: 0, users: 0, builds: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [modelsRes, appsRes] = await Promise.all([
        axios.get('/api/models'),
        axios.get('/api/applications')
      ]);

      setStats({
        models: modelsRes.data.length,
        applications: appsRes.data.length,
        users: 1, // For demo
        builds: appsRes.data.filter((app: any) => app.status === 'built').length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { name: 'Models', value: stats.models, icon: Database, color: 'bg-blue-500' },
    { name: 'Applications', value: stats.applications, icon: AppWindow, color: 'bg-green-500' },
    { name: 'Users', value: stats.users, icon: Users, color: 'bg-purple-500' },
    { name: 'Builds', value: stats.builds, icon: TrendingUp, color: 'bg-orange-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your meta-application platform</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${stat.color} rounded-md p-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                      <dd className="text-lg font-medium text-gray-900">{stat.value}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Getting Started</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Create your first model to start building applications.</p>
          </div>
          <div className="mt-5">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
              Create Model
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
