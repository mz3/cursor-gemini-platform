import React, { useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Edit, TestTube, MessageSquare, ArrowLeft, Send, Loader2 } from 'lucide-react';
import { aiModelApi, AIModel, GenerateResponseRequest } from '../services/aiModelService';

const ViewAIModel: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isChatRoute = location.pathname.includes('/chat');
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: aiModel, isLoading, error } = useQuery({
    queryKey: ['ai-model', id],
    queryFn: () => aiModelApi.getById(id!),
    enabled: !!id,
  });

  const testConnectionMutation = useMutation({
    mutationFn: () => aiModelApi.testConnection(id!),
  });

  const generateResponseMutation = useMutation({
    mutationFn: (data: GenerateResponseRequest) => aiModelApi.generateResponse(id!, data),
  });

  const handleTestConnection = async () => {
    try {
      const result = await testConnectionMutation.mutateAsync();
      alert(result.connected ? 'Connection successful!' : 'Connection failed: ' + result.message);
    } catch (error: any) {
      alert('Connection test failed: ' + error.message);
    }
  };

  const handleSendMessage = async () => {
    if (!prompt.trim()) return;

    const userMessage = { role: 'user' as const, content: prompt, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsGenerating(true);

    try {
      const response = await generateResponseMutation.mutateAsync({
        prompt,
        systemPrompt: systemPrompt || undefined,
        temperature,
        maxTokens,
      });

      const assistantMessage = {
        role: 'assistant' as const,
        content: response.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage = {
        role: 'assistant' as const,
        content: `Error: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'gemini':
        return '🤖';
      case 'openai':
        return '🧠';
      case 'anthropic':
        return '🎭';
      case 'deepseek':
        return '🔍';
      case 'local':
        return '🏠';
      default:
        return '🤖';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'gemini':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'openai':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'anthropic':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'deepseek':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'local':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !aiModel) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            AI Model Details
          </h2>
        </div>
        <div className="p-6">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">
              {error?.message || 'AI model not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/ai-models"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {aiModel.displayName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {aiModel.description || 'No description provided'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isChatRoute && (
                <button
                  onClick={handleTestConnection}
                  disabled={testConnectionMutation.isPending}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/40"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {testConnectionMutation.isPending ? 'Testing...' : 'Test Connection'}
                </button>
              )}
              <Link
                to={`/ai-models/${id}/edit`}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </div>
          </div>
        </div>

        {!isChatRoute && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                  Model Information
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Provider</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getProviderColor(aiModel.provider)}`}>
                        <span className="mr-1">{getProviderIcon(aiModel.provider)}</span>
                        {aiModel.provider.charAt(0).toUpperCase() + aiModel.provider.slice(1)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Model ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{aiModel.modelId}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        aiModel.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {aiModel.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </dd>
                  </div>
                  {aiModel.isDefault && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Default</dt>
                      <dd className="mt-1">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          Default Model
                        </span>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                  Configuration
                </h3>
                <dl className="space-y-3">
                  {aiModel.apiVersion && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">API Version</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{aiModel.apiVersion}</dd>
                    </div>
                  )}
                  {aiModel.baseUrl && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Base URL</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 font-mono">{aiModel.baseUrl}</dd>
                    </div>
                  )}
                  {aiModel.capabilities && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Capabilities</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{aiModel.capabilities}</dd>
                    </div>
                  )}
                  {aiModel.secretId && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Secret ID</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{aiModel.secretId}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Test Chat */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            {isChatRoute ? `Chat with ${aiModel.displayName}` : 'Test Chat'}
          </h3>
        </div>

        <div className="p-6">
          {/* Chat Messages */}
          <div className="mb-4 h-96 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Start a conversation with {aiModel.displayName}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Generating...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  System Prompt (Optional)
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-gray-100"
                  rows={2}
                  placeholder="You are a helpful assistant..."
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Temperature
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{temperature}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="4000"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-gray-100"
                disabled={isGenerating}
              />
              <button
                onClick={handleSendMessage}
                disabled={!prompt.trim() || isGenerating}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewAIModel;
