/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Home, Database, AppWindow, Settings as SettingsIcon, Plus, LogOut, User, MessageSquare, Bot, Zap, Wrench, Layers, Workflow as WorkflowIcon, Shield, Key, Server } from 'lucide-react';
import { initializeSentry, SentryErrorBoundary } from './config/sentry';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Schemas from './components/Schemas';
import CreateSchema from './components/CreateSchema';
import EditSchema from './components/EditSchema';
import ViewSchema from './components/ViewSchema';
import Applications from './components/Applications';
import Prompts from './components/Prompts';
import CreatePrompt from './components/CreatePrompt';
import EditPrompt from './components/EditPrompt';
import PromptVersions from './components/PromptVersions';
import CreateApplication from './components/CreateApplication';
import ViewApplication from './components/ViewApplication';
import EditApplication from './components/EditApplication';
import Bots from './components/Bots';
import CreateBot from './components/CreateBot';
import EditBot from './components/EditBot';
import ViewBot from './components/ViewBot';
import Features from './components/Features';
import CreateFeature from './components/CreateFeature';
import EditFeature from './components/EditFeature';
import ViewFeature from './components/ViewFeature';
import Settings from './components/Settings';
import Tools from './components/Tools';
import { Entities } from './components/Entities';
import Workflows from './components/Workflows';
import CreateWorkflow from './components/CreateWorkflow';
import EditWorkflow from './components/EditWorkflow';
import ViewWorkflow from './components/ViewWorkflow';
import WorkflowDesigner from './components/WorkflowDesigner';
import Services from './components/Services';
import CreateService from './components/CreateService';
import EditService from './components/EditService';
import ViewService from './components/ViewService';

import AdminDashboard from './components/AdminDashboard';
import Secrets from './components/Secrets';
import CreateSecret from './components/CreateSecret';
import EditSecret from './components/EditSecret';
import Profile from './components/Profile';
import PrivateRoute from './components/PrivateRoute';
import AIModels from './components/AIModels';
import CreateAIModel from './components/CreateAIModel';
import EditAIModel from './components/EditAIModel';
import ViewAIModel from './components/ViewAIModel';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { cn } from './utils/cn';

// Initialize Sentry
// Test comment for webapp hot reload
initializeSentry();

// Debug: Log all environment variables at startup
// console.log('VITE ENV:', import.meta.env); // Removed to reduce console noise

const AppContent: React.FC = () => {
  const { user, logout, loading, darkMode, hasRole, isFeatureEnabled } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Always render the routes, let PrivateRoute handle authentication

  const navigation = [
    { name: 'Applications', href: '/applications', icon: AppWindow },
    { name: 'Bots', href: '/bots', icon: Bot },
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Entities', href: '/entity-manager', icon: Layers },
    { name: 'Features', href: '/features', icon: Zap },
    { name: 'Prompts', href: '/prompts', icon: MessageSquare },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Schemas', href: '/schemas', icon: Database },
    { name: 'Services', href: '/services', icon: Server },
    { name: 'Secrets', href: '/secrets', icon: Key },
    { name: 'AI Models', href: '/ai-models', icon: Bot },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
    { name: 'Tools', href: '/tools', icon: Wrench },
    { name: 'Workflows', href: '/workflows', icon: WorkflowIcon },
    // Admin navigation - only show if user has admin role and feature is enabled
    ...(hasRole('admin') && isFeatureEnabled('admin_dashboard') ? [
      { name: 'Admin', href: '/admin', icon: Shield }
    ] : [])
  ];

  return (
    <div className="min-h-screen w-full flex flex-row bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar - only show when user is authenticated */}
      {user && (
        <aside className={cn(
          "w-64 h-screen bg-white dark:bg-gray-800 shadow-lg flex flex-col",
          "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:inset-0"
        )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Meta Platform</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-gray-100'}
                  `}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
      )}

      {/* Main content */}
      <main className={`${user ? 'flex-1' : 'w-full'} flex flex-col min-h-screen overflow-x-hidden bg-gray-50 dark:bg-gray-900`}>
        {/* Top bar - only show when user is authenticated */}
        {user && (
          <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
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
        )}

        {/* Page content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/schemas" element={<PrivateRoute><Schemas /></PrivateRoute>} />
            <Route path="/schemas/create" element={<PrivateRoute><CreateSchema /></PrivateRoute>} />
            <Route path="/schemas/:id" element={<PrivateRoute><ViewSchema /></PrivateRoute>} />
            <Route path="/schemas/:id/edit" element={<PrivateRoute><EditSchema /></PrivateRoute>} />
            <Route path="/applications" element={<PrivateRoute><Applications /></PrivateRoute>} />
            <Route path="/applications/create" element={<PrivateRoute><CreateApplication /></PrivateRoute>} />
            <Route path="/applications/:id" element={<PrivateRoute><ViewApplication /></PrivateRoute>} />
            <Route path="/applications/:id/edit" element={<PrivateRoute><EditApplication /></PrivateRoute>} />
            <Route path="/features" element={<PrivateRoute><Features /></PrivateRoute>} />
            <Route path="/features/create" element={<PrivateRoute><CreateFeature /></PrivateRoute>} />
            <Route path="/features/:id" element={<PrivateRoute><ViewFeature /></PrivateRoute>} />
            <Route path="/features/:id/edit" element={<PrivateRoute><EditFeature /></PrivateRoute>} />
            <Route path="/prompts" element={<PrivateRoute><Prompts /></PrivateRoute>} />
            <Route path="/prompts/create" element={<PrivateRoute><CreatePrompt /></PrivateRoute>} />
            <Route path="/prompts/:id/edit" element={<PrivateRoute><EditPrompt /></PrivateRoute>} />
            <Route path="/prompts/:id/versions" element={<PrivateRoute><PromptVersions /></PrivateRoute>} />
            <Route path="/bots" element={<PrivateRoute><Bots /></PrivateRoute>} />
            <Route path="/bots/create" element={<PrivateRoute><CreateBot /></PrivateRoute>} />
            <Route path="/bots/:id" element={<PrivateRoute><ViewBot /></PrivateRoute>} />
            <Route path="/bots/:id/details" element={<PrivateRoute><ViewBot /></PrivateRoute>} />
            <Route path="/bots/:id/chat" element={<PrivateRoute><ViewBot /></PrivateRoute>} />
            <Route path="/bots/:id/tools" element={<PrivateRoute><ViewBot /></PrivateRoute>} />
            <Route path="/bots/:id/edit" element={<PrivateRoute><EditBot /></PrivateRoute>} />
            <Route path="/workflows" element={<PrivateRoute><Workflows /></PrivateRoute>} />
            <Route path="/workflows/create" element={<PrivateRoute><CreateWorkflow /></PrivateRoute>} />
            <Route path="/workflows/:id" element={<PrivateRoute><ViewWorkflow /></PrivateRoute>} />
            <Route path="/workflows/:id/edit" element={<PrivateRoute><EditWorkflow /></PrivateRoute>} />
            <Route path="/workflows/:id/designer" element={<PrivateRoute><WorkflowDesigner /></PrivateRoute>} />
            <Route path="/secrets" element={<PrivateRoute><Secrets /></PrivateRoute>} />
            <Route path="/secrets/create" element={<PrivateRoute><CreateSecret /></PrivateRoute>} />
            <Route path="/secrets/:id/edit" element={<PrivateRoute><EditSecret /></PrivateRoute>} />
            <Route path="/ai-models" element={<PrivateRoute><AIModels /></PrivateRoute>} />
            <Route path="/ai-models/create" element={<PrivateRoute><CreateAIModel /></PrivateRoute>} />
            <Route path="/ai-models/:id" element={<PrivateRoute><ViewAIModel /></PrivateRoute>} />
            <Route path="/ai-models/:id/edit" element={<PrivateRoute><EditAIModel /></PrivateRoute>} />
            <Route path="/services" element={<PrivateRoute><Services /></PrivateRoute>} />
            <Route path="/services/create" element={<PrivateRoute><CreateService /></PrivateRoute>} />
            <Route path="/services/:id" element={<PrivateRoute><ViewService /></PrivateRoute>} />
            <Route path="/services/:id/edit" element={<PrivateRoute><EditService /></PrivateRoute>} />
            <Route path="/tools" element={<PrivateRoute><Tools /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/entity-manager" element={<PrivateRoute><Entities /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
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
    <SentryErrorBoundary fallback={<div>Something went wrong. Please refresh the page.</div>}>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent />
        </Router>
      </AuthProvider>
    </SentryErrorBoundary>
  );
};

export default App;
