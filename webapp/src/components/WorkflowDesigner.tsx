import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Play, Plus, Trash2, Settings, Zap, Webhook, Bot, Clock } from 'lucide-react';
import { api } from '../utils/api';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'bot' | 'webhook';
  name: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: string[];
}

interface Workflow {
  id: string;
  name: string;
  displayName: string;
  description: string;
  config: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const NODE_TYPES = {
  trigger: {
    icon: Clock,
    color: 'bg-green-500',
    label: 'Trigger',
    description: 'Start the workflow',
  },
  action: {
    icon: Zap,
    color: 'bg-blue-500',
    label: 'Action',
    description: 'Perform an action',
  },
  bot: {
    icon: Bot,
    color: 'bg-purple-500',
    label: 'Bot',
    description: 'AI Bot interaction',
  },
  webhook: {
    icon: Webhook,
    color: 'bg-orange-500',
    label: 'Webhook',
    description: 'HTTP request',
  },
};

const WorkflowDesigner: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchWorkflow(id);
    }
  }, [id]);

  const fetchWorkflow = async (workflowId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/workflows/${workflowId}`);
      const workflowData = response.data;
      setWorkflow(workflowData);

      // Load nodes from workflow config
      if (workflowData.config.nodes) {
        setNodes(workflowData.config.nodes);
      }
    } catch (error) {
      console.error('Error fetching workflow:', error);
      setError('Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  const saveWorkflow = async () => {
    if (!workflow) return;

    try {
      setSaving(true);
      const updatedConfig = {
        ...workflow.config,
        nodes: nodes,
      };

      await api.put(`/workflows/${workflow.id}`, {
        ...workflow,
        config: updatedConfig,
      });

      setWorkflow(prev => prev ? { ...prev, config: updatedConfig } : null);
    } catch (error) {
      console.error('Error saving workflow:', error);
      setError('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (nodeType: string) => {
    setDraggedNodeType(nodeType);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNodeType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: draggedNodeType as any,
      name: `New ${NODE_TYPES[draggedNodeType as keyof typeof NODE_TYPES].label}`,
      config: {},
      position: { x, y },
      connections: [],
    };

    setNodes(prev => [...prev, newNode]);
    setDraggedNodeType(null);
  }, [draggedNodeType]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleNodeClick = (node: WorkflowNode) => {
    setSelectedNode(node);
  };

  const handleNodeUpdate = (nodeId: string, updates: Partial<WorkflowNode>) => {
    setNodes(prev =>
      prev.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    );

    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleNodeDelete = (nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const executeWorkflow = async () => {
    if (!workflow) return;

    try {
      await api.post(`/workflows/${workflow.id}/execute`);
      alert('Workflow execution started!');
    } catch (error) {
      console.error('Error executing workflow:', error);
      setError('Failed to execute workflow');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/workflows')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Workflow Designer</h1>
        </div>
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="text-sm text-red-700 dark:text-red-400">
            {error || 'Workflow not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/workflows/${workflow.id}`)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {workflow.displayName} - Designer
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Drag and drop components to build your workflow
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={saveWorkflow}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            {workflow.isActive && (
              <button
                onClick={executeWorkflow}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Play className="w-4 h-4 mr-2" />
                Execute
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Node Palette */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Components</h3>
          <div className="space-y-2">
            {Object.entries(NODE_TYPES).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <div
                  key={type}
                  draggable
                  onDragStart={() => handleDragStart(type)}
                  className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-move hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className={`w-8 h-8 ${config.color} rounded-lg flex items-center justify-center mr-3`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{config.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{config.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <div
            ref={canvasRef}
            className="absolute inset-0 bg-gray-100 dark:bg-gray-900"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            style={{
              backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            {/* Render Nodes */}
            {nodes.map((node) => {
              const nodeConfig = NODE_TYPES[node.type];
              const Icon = nodeConfig.icon;
              return (
                <div
                  key={node.id}
                  className={`absolute bg-white dark:bg-gray-800 border-2 rounded-lg p-4 cursor-pointer shadow-md hover:shadow-lg transition-shadow ${
                    selectedNode?.id === node.id
                      ? 'border-primary-500'
                      : 'border-gray-200 dark:border-gray-600'
                  }`}
                  style={{
                    left: node.position.x,
                    top: node.position.y,
                    width: '200px',
                  }}
                  onClick={() => handleNodeClick(node)}
                >
                  <div className="flex items-center mb-2">
                    <div className={`w-6 h-6 ${nodeConfig.color} rounded flex items-center justify-center mr-2`}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {node.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNodeDelete(node.id);
                      }}
                      className="ml-auto text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {nodeConfig.description}
                  </div>
                </div>
              );
            })}

            {/* Drop Zone Hint */}
            {draggedNodeType && (
              <div className="absolute inset-0 bg-primary-500 bg-opacity-10 border-2 border-dashed border-primary-500 rounded-lg flex items-center justify-center">
                <div className="text-primary-600 dark:text-primary-400 text-lg font-medium">
                  Drop here to add {NODE_TYPES[draggedNodeType as keyof typeof NODE_TYPES].label}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Properties</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={selectedNode.name}
                  onChange={(e) => handleNodeUpdate(selectedNode.id, { name: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={selectedNode.type}
                  onChange={(e) => handleNodeUpdate(selectedNode.id, { type: e.target.value as any })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                >
                  {Object.entries(NODE_TYPES).map(([type, config]) => (
                    <option key={type} value={type}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type-specific configuration */}
              {selectedNode.type === 'webhook' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    value={selectedNode.config.url || ''}
                    onChange={(e) => handleNodeUpdate(selectedNode.id, {
                      config: { ...selectedNode.config, url: e.target.value }
                    })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    placeholder="https://example.com/webhook"
                  />
                </div>
              )}

              {selectedNode.type === 'bot' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bot ID
                  </label>
                  <input
                    type="text"
                    value={selectedNode.config.botId || ''}
                    onChange={(e) => handleNodeUpdate(selectedNode.id, {
                      config: { ...selectedNode.config, botId: e.target.value }
                    })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    placeholder="Select a bot..."
                  />
                </div>
              )}

              {selectedNode.type === 'trigger' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Trigger Type
                  </label>
                  <select
                    value={selectedNode.config.triggerType || 'manual'}
                    onChange={(e) => handleNodeUpdate(selectedNode.id, {
                      config: { ...selectedNode.config, triggerType: e.target.value }
                    })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  >
                    <option value="manual">Manual</option>
                    <option value="schedule">Schedule</option>
                    <option value="webhook">Webhook</option>
                    <option value="event">Event</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Configuration (JSON)
                </label>
                <textarea
                  rows={6}
                  value={JSON.stringify(selectedNode.config, null, 2)}
                  onChange={(e) => {
                    try {
                      const config = JSON.parse(e.target.value);
                      handleNodeUpdate(selectedNode.id, { config });
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 font-mono text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowDesigner;
