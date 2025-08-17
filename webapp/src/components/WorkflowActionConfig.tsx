import React from 'react';
import { Trash2, Clock, Webhook, Bot, Settings, ArrowDown } from 'lucide-react';

interface Bot {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
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

interface WorkflowActionConfigProps {
  action: WorkflowAction;
  index: number;
  totalActions: number;
  bots: Bot[];
  actions: WorkflowAction[];
  onUpdate: (actionId: string, updates: Partial<WorkflowAction>) => void;
  onRemove: (actionId: string) => void;
  onMove: (actionId: string, direction: 'up' | 'down') => void;
}

const WorkflowActionConfig: React.FC<WorkflowActionConfigProps> = ({
  action,
  index,
  totalActions,
  bots,
  actions,
  onUpdate,
  onRemove,
  onMove,
}) => {
  const actionType = ACTION_TYPES[action.type];
  const Icon = actionType.icon;

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 ${actionType.color} rounded-lg flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100">{actionType.label}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{actionType.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onMove(action.id, 'up')}
            disabled={index === 0}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
            title="Move up"
          >
            ↑
          </button>
          <button
            onClick={() => onMove(action.id, 'down')}
            disabled={index === totalActions - 1}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
            title="Move down"
          >
            ↓
          </button>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={action.enabled}
              onChange={(e) => onUpdate(action.id, { enabled: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enabled</span>
          </label>
          <button
            onClick={() => onRemove(action.id)}
            className="text-red-500 hover:text-red-700"
            title="Remove action"
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
            value={action.name}
            onChange={(e) => onUpdate(action.id, { name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
        </div>

        {action.type === 'bot' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bot</label>
              <select
                value={action.config.botId || ''}
                onChange={(e) => onUpdate(action.id, {
                  config: { ...action.config, botId: e.target.value }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="">Select a bot...</option>
                {bots.map(bot => (
                  <option key={bot.id} value={bot.id}>{bot.displayName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Input Message</label>
              <textarea
                value={action.config.message || ''}
                onChange={(e) => onUpdate(action.id, {
                  config: { ...action.config, message: e.target.value }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                rows={3}
                placeholder="Message to send to the bot..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Use Previous Output</label>
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={action.config.usePreviousOutput || false}
                  onChange={(e) => onUpdate(action.id, {
                    config: { ...action.config, usePreviousOutput: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Use output from previous action as input
                </span>
              </label>
            </div>
          </div>
        )}

        {action.type === 'webhook' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL</label>
              <input
                type="url"
                value={action.config.url || ''}
                onChange={(e) => onUpdate(action.id, {
                  config: { ...action.config, url: e.target.value }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                placeholder="https://api.example.com/webhook"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Method</label>
              <select
                value={action.config.method || 'POST'}
                onChange={(e) => onUpdate(action.id, {
                  config: { ...action.config, method: e.target.value }
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Headers (JSON)</label>
              <textarea
                value={action.config.headers ? JSON.stringify(action.config.headers, null, 2) : '{}'}
                onChange={(e) => {
                  try {
                    const headers = JSON.parse(e.target.value);
                    onUpdate(action.id, {
                      config: { ...action.config, headers }
                    });
                  } catch (error) {
                    // Invalid JSON, ignore for now
                  }
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 font-mono text-sm"
                rows={3}
                placeholder='{"Content-Type": "application/json"}'
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Body (JSON)</label>
              <textarea
                value={action.config.body ? JSON.stringify(action.config.body, null, 2) : '{}'}
                onChange={(e) => {
                  try {
                    const body = JSON.parse(e.target.value);
                    onUpdate(action.id, {
                      config: { ...action.config, body }
                    });
                  } catch (error) {
                    // Invalid JSON, ignore for now
                  }
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 font-mono text-sm"
                rows={4}
                placeholder='{"message": "Hello World"}'
              />
            </div>
          </div>
        )}

        {action.type === 'delay' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Delay (seconds)</label>
            <input
              type="number"
              value={action.config.delaySeconds || 5}
              onChange={(e) => onUpdate(action.id, {
                config: { ...action.config, delaySeconds: parseInt(e.target.value) }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              min="1"
            />
          </div>
        )}

        {action.type === 'condition' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Condition Type</label>
              <select
                value={action.config.conditionType || 'equals'}
                onChange={(e) => onUpdate(action.id, {
                  config: { ...action.config, conditionType: e.target.value }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="equals">Equals</option>
                <option value="contains">Contains</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="exists">Exists</option>
                <option value="not_exists">Does Not Exist</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Field Path</label>
              <input
                type="text"
                value={action.config.fieldPath || ''}
                onChange={(e) => onUpdate(action.id, {
                  config: { ...action.config, fieldPath: e.target.value }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                placeholder="data.status"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expected Value</label>
              <input
                type="text"
                value={action.config.expectedValue || ''}
                onChange={(e) => onUpdate(action.id, {
                  config: { ...action.config, expectedValue: e.target.value }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                placeholder="success"
              />
            </div>
          </div>
        )}

        {action.type === 'route' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Route Type</label>
              <select
                value={action.config.routeType || 'sequential'}
                onChange={(e) => onUpdate(action.id, {
                  config: { ...action.config, routeType: e.target.value }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="sequential">Sequential</option>
                <option value="parallel">Parallel</option>
                <option value="conditional">Conditional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Next Actions</label>
              <div className="space-y-2 mt-2">
                {actions
                  .filter(a => a.id !== action.id)
                  .map(targetAction => (
                    <label key={targetAction.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={action.nextActions?.includes(targetAction.id) || false}
                        onChange={(e) => {
                          const nextActions = action.nextActions || [];
                          const updatedNextActions = e.target.checked
                            ? [...nextActions, targetAction.id]
                            : nextActions.filter(id => id !== targetAction.id);
                          onUpdate(action.id, { nextActions: updatedNextActions });
                        }}
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {targetAction.name}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowActionConfig;
