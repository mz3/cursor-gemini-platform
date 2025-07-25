import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { darkMode, setDarkMode, loading } = useAuth();

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await setDarkMode(e.target.checked);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-900 rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Settings</h2>
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-800 dark:text-gray-200">Dark Mode</span>
        <label className="inline-flex relative items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={darkMode}
            onChange={handleToggle}
            disabled={loading}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:bg-gray-700 rounded-full peer peer-checked:bg-blue-600 transition-all"></div>
          <div className="absolute left-1 top-1 bg-white dark:bg-gray-800 w-4 h-4 rounded-full transition-all peer-checked:translate-x-5"></div>
        </label>
      </div>
      {/* Future settings go here */}
    </div>
  );
};

export default Settings;
