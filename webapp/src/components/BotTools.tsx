import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Play, Settings, Globe, Database, FileText, Terminal, Code, Workflow, X } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface BotTool {
  id: string;
  name: string;
  displayName: string;
  description: string;
  type: string;
  config: Record<string, any>;
  isActive: boolean;
  requiresAuth: boolean;
  bot?: {
    id: string;
    displayName: string;
  };
}

interface BotToolsProps {
  botId: string;
}

const toolTypeIcons = {
  http_request: Globe,
  database_query: Database,
  file_operation: FileText,
  shell_command: Terminal,
  custom_script: Code,
  workflow_action: Workflow,
  mcp_tool: Settings
};

const toolTypeLabels = {
  http_request: 'HTTP Request',
  database_query: 'Database Query',
  file_operation: 'File Operation',
  shell_command: 'Shell Command',
  custom_script: 'Custom Script',
  workflow_action: 'Workflow Action',
  mcp_tool: 'MCP Tool'
};

export const BotTools: React.FC<BotToolsProps> = ({ botId }) => {
  const { user } = useAuth();
  const [tools, setTools] = useState<BotTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showToolSelector, setShowToolSelector] = useState(false);
  const [availableTools, setAvailableTools] = useState<BotTool[]>([]);
  const [editingTool, setEditingTool] = useState<BotTool | null>(null);
  const [testingTool, setTestingTool] = useState<string | null>(null);

  useEffect(() => {
    fetchTools();
  }, [botId]);

  const fetchTools = async () => {
    try {
      const response = await api.get(`/bot-tools/bots/${botId}/tools?userId=${user?.id}`);
      setTools(response.data);
    } catch (error) {
      console.error('Failed to fetch tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTool = async (toolData: Partial<BotTool>) => {
    try {
      await api.post(`/bot-tools/bots/${botId}/tools`, {
        ...toolData,
        userId: user?.id
      });
      await fetchTools();
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add tool:', error);
    }
  };

  const fetchAvailableTools = async () => {
    try {
      const response = await api.get(`/bot-tools/bots/${botId}/available-tools?userId=${user?.id}`);
      setAvailableTools(response.data);
    } catch (error) {
      console.error('Failed to fetch available tools:', error);
    }
  };

  const addExistingTool = async (toolId: string) => {
    try {
      await api.post(`/bot-tools/bots/${botId}/add-existing-tool`, {
        userId: user?.id,
        toolId
      });
      await fetchTools();
      setShowToolSelector(false);
    } catch (error) {
      console.error('Failed to add existing tool:', error);
    }
  };

  const updateTool = async (toolId: string, toolData: Partial<BotTool>) => {
    try {
      await api.put(`/bot-tools/bots/${botId}/tools/${toolId}`, {
        ...toolData,
        userId: user?.id
      });
      await fetchTools();
      setEditingTool(null);
    } catch (error) {
      console.error('Failed to update tool:', error);
    }
  };

  const deleteTool = async (toolId: string) => {
    try {
      await api.delete(`/bot-tools/bots/${botId}/tools/${toolId}?userId=${user?.id}`);
      await fetchTools();
    } catch (error) {
      console.error('Failed to delete tool:', error);
    }
  };

  const testTool = async (toolId: string, params: Record<string, any> = {}) => {
    setTestingTool(toolId);
    try {
      const response = await api.post(`/bot-tools/bots/${botId}/tools/${toolId}/test`, {
        userId: user?.id,
        params
      });
      alert(`Tool test successful: ${JSON.stringify(response.data.result)}`);
    } catch (error) {
      console.error('Failed to test tool:', error);
      alert(`Tool test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTestingTool(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Bot Tools</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setShowToolSelector(true);
              fetchAvailableTools();
            }}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Select from Existing
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Tool
          </button>
        </div>
      </div>

      {tools.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No tools configured for this bot.</p>
          <p className="text-sm">Add tools to make your bot more powerful!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tools.map(tool => {
            const IconComponent = toolTypeIcons[tool.type as keyof typeof toolTypeIcons] || Settings;

            return (
              <div key={tool.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <IconComponent className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{tool.displayName}</h4>
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">
                          {toolTypeLabels[tool.type as keyof typeof toolTypeLabels] || tool.type}
                        </span>
                        {tool.requiresAuth && (
                          <span className="inline-block px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 rounded">
                            Auth Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{tool.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Trigger: <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 rounded">{tool.name}</code>
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => testTool(tool.id)}
                      disabled={testingTool === tool.id}
                      className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded disabled:opacity-50"
                      title="Test Tool"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingTool(tool)}
                      className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                      title="Edit Tool"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTool(tool.id)}
                      className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title="Delete Tool"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddForm && (
        <ToolForm
          onSubmit={addTool}
          onCancel={() => setShowAddForm(false)}
          toolTypes={toolTypeLabels}
        />
      )}

      {editingTool && (
        <ToolForm
          tool={editingTool}
          onSubmit={(data) => updateTool(editingTool.id, data)}
          onCancel={() => setEditingTool(null)}
          toolTypes={toolTypeLabels}
        />
      )}

      {showToolSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Select from Existing Tools</h3>
              <button
                onClick={() => setShowToolSelector(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {availableTools.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>No available tools to add.</p>
                <p className="text-sm">All system tools are already assigned to this bot.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {availableTools.map(tool => {
                  const IconComponent = toolTypeIcons[tool.type as keyof typeof toolTypeIcons];

                  return (
                    <div key={tool.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            {IconComponent && <IconComponent className="w-5 h-5 mr-2 text-blue-600" />}
                            <h4 className="font-medium">{tool.displayName}</h4>
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                              {toolTypeLabels[tool.type as keyof typeof toolTypeLabels]}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{tool.description}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            <span className="mr-4">Bot: {tool.bot?.displayName || 'Unknown'}</span>
                            {tool.requiresAuth && (
                              <span className="flex items-center">
                                <Settings className="w-3 h-3 mr-1" />
                                Auth Required
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => addExistingTool(tool.id)}
                          className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Add to Bot
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ToolFormProps {
  tool?: BotTool;
  onSubmit: (data: Partial<BotTool>) => void;
  onCancel: () => void;
  toolTypes: Record<string, string>;
}

const ToolForm: React.FC<ToolFormProps> = ({ tool, onSubmit, onCancel, toolTypes }) => {
  const [formData, setFormData] = useState({
    name: tool?.name || '',
    displayName: tool?.displayName || '',
    description: tool?.description || '',
    type: tool?.type || 'http_request',
    config: tool?.config || {},
    isActive: tool?.isActive ?? true,
    requiresAuth: tool?.requiresAuth ?? false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateConfig = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      config: { ...prev.config, [key]: value }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {tool ? 'Edit Tool' : 'Add New Tool'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tool Name (Internal)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                placeholder="weather_api"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                placeholder="Weather API"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
              rows={3}
              placeholder="Get weather information for a location"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tool Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
              required
            >
              {Object.entries(toolTypes).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Tool-specific configuration */}
          {formData.type === 'http_request' && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">HTTP Request Configuration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
                  <input
                    type="text"
                    value={formData.config.url || ''}
                    onChange={(e) => updateConfig('url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                    placeholder="https://api.example.com/{{param1}}"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Method</label>
                  <select
                    value={formData.config.method || 'GET'}
                    onChange={(e) => updateConfig('method', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {formData.type === 'file_operation' && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">File Operation Configuration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Operation</label>
                  <select
                    value={formData.config.operation || 'read'}
                    onChange={(e) => updateConfig('operation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="read">Read</option>
                    <option value="write">Write</option>
                    <option value="list">List Directory</option>
                    <option value="exists">Check Exists</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Path</label>
                  <input
                    type="text"
                    value={formData.config.path || ''}
                    onChange={(e) => updateConfig('path', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                    placeholder="/app/data/{{filename}}"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.type === 'custom_script' && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Custom Script Configuration</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">JavaScript Code</label>
                <textarea
                  value={formData.config.script || ''}
                  onChange={(e) => updateConfig('script', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md font-mono text-sm dark:bg-gray-700 dark:text-gray-100"
                  rows={6}
                  placeholder="// Your JavaScript code here&#10;return params.param1 + params.param2;"
                />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="mr-2 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.requiresAuth}
                onChange={(e) => setFormData(prev => ({ ...prev, requiresAuth: e.target.checked }))}
                className="mr-2 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Requires Authentication</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {tool ? 'Update Tool' : 'Add Tool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
