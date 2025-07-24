/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home, Database, AppWindow, Settings, Plus, LogOut, User, MessageSquare } from 'lucide-react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Models from './components/Models';
import CreateModel from './components/CreateModel';
import EditModel from './components/EditModel';
import ViewModel from './components/ViewModel';
import Applications from './components/Applications';
import Prompts from './components/Prompts';
import CreatePrompt from './components/CreatePrompt';
import EditPrompt from './components/EditPrompt';
import PromptVersions from './components/PromptVersions';
import CreateApplication from './components/CreateApplication';
import ViewApplication from './components/ViewApplication';
import EditApplication from './components/EditApplication';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { cn } from './utils/cn';

// Debug: Log all environment variables at startup
console.log('VITE ENV:', import.meta.env);

const AppContent: React.FC = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <Login />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Models', href: '/models', icon: Database },
    { name: 'Applications', href: '/applications', icon: AppWindow },
    { name: 'Prompts', href: '/prompts', icon: MessageSquare },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="app-root">
      {/* Sidebar */}
      <aside className={cn(
        "app-sidebar",
        "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:static lg:inset-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Meta Platform</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={logout}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="app-main lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1" />
          </div>
        </div>

        {/* Page content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/models" element={<Models />} />
            <Route path="/models/create" element={<CreateModel />} />
            <Route path="/models/:id" element={<ViewModel />} />
            <Route path="/models/:id/edit" element={<EditModel />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/applications/create" element={<CreateApplication />} />
            <Route path="/applications/:id" element={<ViewApplication />} />
            <Route path="/applications/:id/edit" element={<EditApplication />} />
            <Route path="/prompts" element={<Prompts />} />
            <Route path="/prompts/create" element={<CreatePrompt />} />
            <Route path="/prompts/:id/edit" element={<EditPrompt />} />
            <Route path="/prompts/:id/versions" element={<PromptVersions />} />
            <Route path="/settings" element={<div className="text-center py-12"><h2 className="text-2xl font-semibold text-gray-900">Settings</h2><p className="text-gray-600 mt-2">Settings page coming soon...</p></div>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
