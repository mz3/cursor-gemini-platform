import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { darkMode, setDarkMode, loading } = useAuth();

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await setDarkMode(e.target.checked);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your application preferences</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Dark Mode</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes</p>
            </div>
            <label className="inline-flex relative items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={darkMode}
                onChange={handleToggle}
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:bg-gray-700 rounded-full peer peer-checked:bg-blue-600 transition-all"></div>
              <div className="absolute left-1 top-1 bg-white dark:bg-gray-800 w-4 h-4 rounded-full transition-all peer-checked:translate-x-5 shadow-sm"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Future settings sections can be added here */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Account</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Account settings will be available here in the future.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
