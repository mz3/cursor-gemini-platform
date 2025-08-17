import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, Clock, Webhook, Bot, Zap, ArrowDown, Settings, Play, Calendar, MessageSquare } from 'lucide-react';
import { api } from '../utils/api';
import WorkflowActionConfig from './WorkflowActionConfig';

interface Bot {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
}

interface WorkflowTrigger {
  id: string;
  type: 'webhook' | 'schedule' | 'manual' | 'chatbot';
  name: string;
  config: Record<string, any>;
  enabled: boolean;
}

interface WorkflowAction {
  id: string;
  type: 'bot' | 'webhook' | 'delay' | 'condition' | 'route';
  name: string;
  config: Record<string, any>;
  order: number;
  enabled: boolean;
  nextActions?: string[];
}

interface Workflow {
  id?: string;
  name: string;
  displayName: string;
  description: string;
  config: Record<string, any>;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface WorkflowFormProps {
  workflow?: Workflow;
  onSubmit: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const TRIGGER_TYPES = {
  manual: {
    icon: Play,
    label: 'Manual Trigger',
    description: 'Start workflow manually',
    color: 'bg-blue-500',
  },
  webhook: {
    icon: Webhook,
    label: 'Webhook Trigger',
    description: 'HTTP request trigger',
    color: 'bg-orange-500',
  },
  schedule: {
    icon: Clock,
    label: 'Schedule Trigger',
    description: 'Cron-based scheduling',
    color: 'bg-green-500',
  },
  chatbot: {
    icon: MessageSquare,
    label: 'Chatbot Trigger',
    description: 'Bot conversation trigger',
    color: 'bg-purple-500',
  },
};

const ACTION_TYPES = {
  bot: {
    icon: Bot,
    label: 'AI Bot Action',
    description: 'Execute AI bot',
    color: 'bg-purple-500',
  },
  webhook: {
    icon: Webhook,
    label: 'Webhook Action',
    description: 'HTTP request',
    color: 'bg-orange-500',
  },
  delay: {
    icon: Clock,
    label: 'Delay Action',
    description: 'Wait for time period',
    color: 'bg-gray-500',
  },
  condition: {
    icon: Settings,
    label: 'Condition Action',
    description: 'Conditional logic',
    color: 'bg-yellow-500',
  },
  route: {
    icon: ArrowDown,
    label: 'Route Action',
    description: 'Route to other actions',
    color: 'bg-indigo-500',
  },
};

const WorkflowForm: React.FC<WorkflowFormProps> = ({
  workflow,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    displayName: '',
    description: '',
    isActive: true,
    config: {
      triggers: [],
      actions: [],
      settings: {
        timeout: 30000,
        retries: 3,
        parallel: false,
        errorHandling: 'stop',
      },
    },
  });

  const [bots, setBots] = useState<Bot[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (workflow) {
      setFormData({
        name: workflow.name,
        displayName: workflow.displayName,
        description: workflow.description,
        isActive: workflow.isActive,
        config: workflow.config || {
          triggers: [],
          actions: [],
          settings: {
            timeout: 30000,
            retries: 3,
            parallel: false,
            errorHandling: 'stop',
          },
        },
      });
    }
    fetchBots();
  }, [workflow]);

  const fetchBots = async () => {
    try {
      const response = await api.get('/bots');
      const activeBots = response.data.filter((bot: Bot) => bot.isActive);
      setBots(activeBots);
    } catch (error) {
      console.error('Error fetching bots:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.name)) {
      newErrors.name = 'Name can only contain letters, numbers, hyphens, and underscores';
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.config.triggers.length === 0) {
      newErrors.triggers = 'At least one trigger is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting workflow:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleSettingsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        settings: {
          ...prev.config.settings,
          [field]: value,
        },
      },
    }));
  };

  // Trigger management
  const addTrigger = (type: keyof typeof TRIGGER_TYPES) => {
    const newTrigger: WorkflowTrigger = {
      id: `trigger_${Date.now()}`,
      type,
      name: `New ${TRIGGER_TYPES[type].label}`,
      config: type === 'schedule' ? { scheduleType: 'cron' } : {},
      enabled: true,
    };

    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        triggers: [...prev.config.triggers, newTrigger],
      },
    }));
  };

  const updateTrigger = (triggerId: string, updates: Partial<WorkflowTrigger>) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        triggers: prev.config.triggers.map((trigger: any) =>
          trigger.id === triggerId ? { ...trigger, ...updates } : trigger
        ),
      },
    }));
  };

  const removeTrigger = (triggerId: string) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        triggers: prev.config.triggers.filter((trigger: any) => trigger.id !== triggerId),
      },
    }));
  };

  // Action management
  const addAction = (type: keyof typeof ACTION_TYPES) => {
    const newAction: WorkflowAction = {
      id: `action_${Date.now()}`,
      type,
      name: `New ${ACTION_TYPES[type].label}`,
      config: {},
      order: formData.config.actions.length,
      enabled: true,
    };

    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        actions: [...prev.config.actions, newAction],
      },
    }));
  };

  const updateAction = (actionId: string, updates: Partial<WorkflowAction>) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        actions: prev.config.actions.map((action: any) =>
          action.id === actionId ? { ...action, ...updates } : action
        ),
      },
    }));
  };

  const removeAction = (actionId: string) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        actions: prev.config.actions.filter((action: any) => action.id !== actionId),
      },
    }));
  };

  const moveAction = (actionId: string, direction: 'up' | 'down') => {
    const actions = [...formData.config.actions];
    const index = actions.findIndex(action => action.id === actionId);

    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= actions.length) return;

    // Swap actions
    [actions[index], actions[newIndex]] = [actions[newIndex], actions[index]];

    // Update order values
    actions.forEach((action, idx) => {
      action.order = idx;
    });

    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        actions,
      },
    }));
  };

  const renderTriggerConfig = (trigger: WorkflowTrigger) => {
    const triggerType = TRIGGER_TYPES[trigger.type];
    const Icon = triggerType.icon;

    return (
      <div key={trigger.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 ${triggerType.color} rounded-lg flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">{triggerType.label}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{triggerType.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={trigger.enabled}
                onChange={(e) => updateTrigger(trigger.id, { enabled: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enabled</span>
            </label>
            <button
              onClick={() => removeTrigger(trigger.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <input
              type="text"
              value={trigger.name}
              onChange={(e) => updateTrigger(trigger.id, { name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          {trigger.type === 'webhook' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Method</label>
                <select
                  value={trigger.config.method || 'POST'}
                  onChange={(e) => updateTrigger(trigger.id, {
                    config: { ...trigger.config, method: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Path</label>
                <input
                  type="text"
                  value={trigger.config.path || ''}
                  onChange={(e) => updateTrigger(trigger.id, {
                    config: { ...trigger.config, path: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder="/webhook/my-trigger"
                />
              </div>
            </div>
          )}

          {trigger.type === 'schedule' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Schedule Type</label>
                <select
                  value={trigger.config.scheduleType || 'cron'}
                  onChange={(e) => updateTrigger(trigger.id, {
                    config: { ...trigger.config, scheduleType: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                >
                  <option value="cron">Cron Expression</option>
                  <option value="interval">Interval</option>
                </select>
              </div>
              {(trigger.config.scheduleType || 'cron') === 'cron' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cron Expression</label>
                  <input
                    type="text"
                    value={trigger.config.cronExpression || ''}
                    onChange={(e) => updateTrigger(trigger.id, {
                      config: { ...trigger.config, cronExpression: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    placeholder="0 0 * * *"
                  />
                  <p className="mt-1 text-xs text-gray-500">Examples: "0 0 * * *" (daily), "0 */6 * * *" (every 6 hours)</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Interval (minutes)</label>
                  <input
                    type="number"
                    value={trigger.config.intervalMinutes || 60}
                    onChange={(e) => updateTrigger(trigger.id, {
                      config: { ...trigger.config, intervalMinutes: parseInt(e.target.value) }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    min="1"
                  />
                </div>
              )}
            </div>
          )}

          {trigger.type === 'chatbot' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bot</label>
              <select
                value={trigger.config.botId || ''}
                onChange={(e) => updateTrigger(trigger.id, {
                  config: { ...trigger.config, botId: e.target.value }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="">Select a bot...</option>
                {bots.map(bot => (
                  <option key={bot.id} value={bot.id}>{bot.displayName}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                  errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder="workflow-name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Display Name *
              </label>
              <input
                type="text"
                id="displayName"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                  errors.displayName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder="My Workflow"
              />
              {errors.displayName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.displayName}</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description *
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
              }`}
              placeholder="Describe what this workflow does..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
            )}
          </div>

          <div className="mt-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Active (workflow can be executed)
              </span>
            </label>
          </div>
        </div>

        {/* Triggers */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Triggers</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Define what starts this workflow</p>
            </div>
            <div className="flex space-x-2">
              {Object.entries(TRIGGER_TYPES).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addTrigger(type as keyof typeof TRIGGER_TYPES)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    title={`Add ${config.label}`}
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {errors.triggers && (
            <p className="mb-4 text-sm text-red-600 dark:text-red-400">{errors.triggers}</p>
          )}

          <div className="space-y-4">
            {formData.config.triggers.map((trigger: any) => renderTriggerConfig(trigger))}
            {formData.config.triggers.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No triggers configured. Add a trigger to get started.
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Actions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Define what happens when triggered</p>
            </div>
            <div className="flex space-x-2">
              {Object.entries(ACTION_TYPES).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addAction(type as keyof typeof ACTION_TYPES)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    title={`Add ${config.label}`}
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {formData.config.actions.map((action: any, index: number) => (
              <WorkflowActionConfig
                key={action.id}
                action={action}
                index={index}
                totalActions={formData.config.actions.length}
                bots={bots}
                actions={formData.config.actions}
                onUpdate={updateAction}
                onRemove={removeAction}
                onMove={moveAction}
              />
            ))}
            {formData.config.actions.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No actions configured. Add an action to define workflow behavior.
              </div>
            )}
          </div>
        </div>

        {/* Execution Settings */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Execution Settings
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="timeout" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Timeout (ms)
              </label>
              <input
                type="number"
                id="timeout"
                value={formData.config.settings.timeout}
                onChange={(e) => handleSettingsChange('timeout', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                min="1000"
                step="1000"
              />
            </div>

            <div>
              <label htmlFor="retries" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Max Retries
              </label>
              <input
                type="number"
                id="retries"
                value={formData.config.settings.retries}
                onChange={(e) => handleSettingsChange('retries', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                min="0"
                max="10"
              />
            </div>

            <div>
              <label htmlFor="errorHandling" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Error Handling
              </label>
              <select
                id="errorHandling"
                value={formData.config.settings.errorHandling}
                onChange={(e) => handleSettingsChange('errorHandling', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="stop">Stop on Error</option>
                <option value="continue">Continue on Error</option>
                <option value="retry">Retry on Error</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center mt-6">
                <input
                  type="checkbox"
                  checked={formData.config.settings.parallel}
                  onChange={(e) => handleSettingsChange('parallel', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Parallel Execution
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : workflow ? 'Update Workflow' : 'Create Workflow'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkflowForm;
