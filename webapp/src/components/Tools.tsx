import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Play, Settings, Globe, Database, FileText, Terminal, Code, Workflow, Bot, Search, Eye } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface Tool {
  id: string;
  name: string;
  displayName: string;
  description: string;
  type: string;
  config: Record<string, any>;
  isActive: boolean;
  requiresAuth: boolean;
  botId?: string;
  bot?: {
    id: string;
    name: string;
    displayName: string;
  };
}

interface ToolsProps {
  botId?: string;
  showSystemTools?: boolean;
}

const toolTypeIcons = {
  http_request: Globe,
  database_query: Database,
  file_operation: FileText,
  shell_command: Terminal,
  custom_script: Code,
  workflow_action: Workflow,
  mcp_tool: Bot
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

export const Tools: React.FC<ToolsProps> = ({ botId, showSystemTools = false }) => {
  const { user } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [testingTool, setTestingTool] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchTools();
  }, [botId, showSystemTools]);

  const fetchTools = async () => {
    try {
      let endpoint = '/bot-tools/tools';
      if (botId) {
        endpoint = `/bot-tools/bots/${botId}/tools?userId=${user?.id}`;
      } else if (showSystemTools) {
        endpoint = '/bot-tools/system-tools';
      }
      
      const response = await api.get(endpoint);
      setTools(response.data);
    } catch (error) {
      console.error('Failed to fetch tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTool = async (toolData: Partial<Tool>) => {
    try {
      const endpoint = botId ? `/bot-tools/bots/${botId}/tools` : '/bot-tools/tools';
      await api.post(endpoint, {
        ...toolData,
        userId: user?.id
      });
      await fetchTools();
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add tool:', error);
    }
  };

  const updateTool = async (toolId: string, toolData: Partial<Tool>) => {
    try {
      const endpoint = botId 
        ? `/bot-tools/bots/${botId}/tools/${toolId}`
        : `/bot-tools/tools/${toolId}`;
      
      await api.put(endpoint, {
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
    if (!confirm('Are you sure you want to delete this tool?')) return;
    
    try {
      const endpoint = botId 
        ? `/bot-tools/bots/${botId}/tools/${toolId}?userId=${user?.id}`
        : `/bot-tools/tools/${toolId}?userId=${user?.id}`;
      
      await api.delete(endpoint);
      await fetchTools();
    } catch (error) {
      console.error('Failed to delete tool:', error);
    }
  };

  const testTool = async (toolId: string, params: Record<string, any> = {}) => {
    setTestingTool(toolId);
    try {
      const endpoint = botId 
        ? `/bot-tools/bots/${botId}/tools/${toolId}/test`
        : `/bot-tools/tools/${toolId}/test`;
      
      const response = await api.post(endpoint, {
        userId: user?.id,
        params
      });
      
      alert(`Tool test successful!\nResult: ${JSON.stringify(response.data.result, null, 2)}`);
    } catch (error) {
      console.error('Failed to test tool:', error);
      alert(`Tool test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTestingTool(null);
    }
  };

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || tool.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {botId ? 'Bot Tools' : showSystemTools ? 'System Tools' : 'All Tools'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and configure tools for {botId ? 'this bot' : 'the platform'}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Tool
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="all">All Types</option>
          {Object.entries(toolTypeLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map((tool) => {
          const IconComponent = toolTypeIcons[tool.type as keyof typeof toolTypeIcons] || Settings;
          
          return (
            <div
              key={tool.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <IconComponent className="w-5 h-5 text-primary-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {tool.displayName}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  {tool.isActive ? (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {tool.description}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span>{toolTypeLabels[tool.type as keyof typeof toolTypeLabels]}</span>
                {tool.requiresAuth && (
                  <span className="flex items-center">
                    <Settings className="w-4 h-4 mr-1" />
                    Auth Required
                  </span>
                )}
              </div>

              {tool.bot && (
                <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Bot: </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {tool.bot.displayName}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingTool(tool)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title="Edit tool"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => testTool(tool.id)}
                    disabled={testingTool === tool.id}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                    title="Test tool"
                  >
                    {testingTool === tool.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteTool(tool.id)}
                    className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    title="Delete tool"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No tools found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first tool'
            }
          </p>
        </div>
      )}

      {/* Add/Edit Tool Form */}
      {(showAddForm || editingTool) && (
        <ToolForm
          tool={editingTool}
          onSubmit={editingTool ? (data) => updateTool(editingTool.id, data) : addTool}
          onCancel={() => {
            setShowAddForm(false);
            setEditingTool(null);
          }}
          toolTypes={toolTypeLabels}
        />
      )}
    </div>
  );
};

interface ToolFormProps {
  tool?: Tool;
  onSubmit: (data: Partial<Tool>) => void;
  onCancel: () => void;
  toolTypes: Record<string, string>;
}

const ToolForm: React.FC<ToolFormProps> = ({ tool, onSubmit, onCancel, toolTypes }) => {
  const [formData, setFormData] = useState({
    name: tool?.name || '',
    displayName: tool?.displayName || '',
    description: tool?.description || '',
    type: tool?.type || 'http_request',
    isActive: tool?.isActive ?? true,
    requiresAuth: tool?.requiresAuth ?? false,
    config: tool?.config || {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateConfig = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {tool ? 'Edit Tool' : 'Add New Tool'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {Object.entries(toolTypes).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.requiresAuth}
                    onChange={(e) => setFormData(prev => ({ ...prev, requiresAuth: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Requires Auth</span>
                </label>
              </div>
            </div>

            {/* Type-specific configuration */}
            {formData.type === 'http_request' && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">HTTP Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      URL
                    </label>
                    <input
                      type="text"
                      value={formData.config.url || ''}
                      onChange={(e) => updateConfig('url', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Method
                    </label>
                    <select
                      value={formData.config.method || 'GET'}
                      onChange={(e) => updateConfig('method', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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

            {formData.type === 'shell_command' && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Shell Configuration</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Command
                  </label>
                  <input
                    type="text"
                    value={formData.config.command || ''}
                    onChange={(e) => updateConfig('command', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="e.g., ping -c 3 ${host}"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Working Directory
                    </label>
                    <input
                      type="text"
                      value={formData.config.workingDirectory || ''}
                      onChange={(e) => updateConfig('workingDirectory', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Timeout (seconds)
                    </label>
                    <input
                      type="number"
                      value={formData.config.timeout || 30}
                      onChange={(e) => updateConfig('timeout', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                {tool ? 'Update Tool' : 'Create Tool'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Tools; 