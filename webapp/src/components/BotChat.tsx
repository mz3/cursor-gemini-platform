import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import api from '../utils/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../contexts/AuthContext';

interface BotChatProps {
  botId: string;
  userId: string;
  botName: string;
}

interface ChatMessage {
  id: string;
    role: 'user' | 'bot' | 'system';
  content: string;
  createdAt: string;
  responseTime?: number;
  tokensUsed?: number;
  status?: 'processing' | 'thinking' | 'executing' | 'completed' | 'error';
}

interface BotInstance {
  id: string;
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping';
  lastStartedAt?: string;
  lastStoppedAt?: string;
  errorMessage?: string;
}

export const BotChat: React.FC<BotChatProps> = ({ botId, userId, botName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [botInstance, setBotInstance] = useState<BotInstance | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // UI separation: capture agent thoughts and tool execution events per-message
  type ToolEventStatus = 'success' | 'failure' | 'info';
  interface ToolEventItem {
    id: string;
    toolName: string;
    status: ToolEventStatus;
    details?: string;
  }
  interface AgentInsights { thoughts: string[]; toolEvents: ToolEventItem[] }
  const [insightsByMessageId, setInsightsByMessageId] = useState<Record<string, AgentInsights>>({});
  const [expandedToolEventIds, setExpandedToolEventIds] = useState<Set<string>>(new Set());
  const [expandedThoughtMessageIds, setExpandedThoughtMessageIds] = useState<Set<string>>(new Set());

  const toggleToolEvent = useCallback((id: string) => {
    setExpandedToolEventIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // WebSocket connection
  const {
    isConnected,
    isConnecting,
    connectionError,
    connect,
    disconnect,
    sendMessage: wsSendMessage,
    startTyping,
    stopTyping,
    startBot: wsStartBot,
    stopBot: wsStopBot,
    joinBot,
  } = useWebSocket({
    botId,
    userId,
    token: localStorage.getItem('token') || undefined,
    autoConnect: true,
    onMessage: (message) => {
      // For bot messages, extract agent thoughts and tool events and strip them from chat content
      let processedMessage = { ...message };
      if (message.role === 'bot' && message.content) {
        const parsed = extractAgentInsights(message.content, message.id);
        if (parsed.thoughts.length || parsed.toolEvents.length) {
          setInsightsByMessageId(prev => ({ ...prev, [message.id]: { thoughts: parsed.thoughts, toolEvents: parsed.toolEvents } }));
        }
        processedMessage.content = parsed.remainingContent;
      }

      setMessages(prev => {
        const exists = prev.find(m => m.id === processedMessage.id);
        if (exists) {
          return prev.map(m => m.id === processedMessage.id ? processedMessage : m);
        } else {
          return [...prev, processedMessage];
        }
      });
    },
    onStatusUpdate: (status) => {
      setBotInstance(status);
    },
    onTypingIndicator: (indicator) => {
      if (indicator.isTyping) {
        setTypingUsers(prev => new Set(prev).add(indicator.userId));
      } else {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(indicator.userId);
          return newSet;
        });
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
  });

  // Load conversation history and bot status on mount
  useEffect(() => {
    loadConversationHistory();
    loadBotStatus();
  }, [botId, userId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Join bot room when connected
  useEffect(() => {
    if (isConnected && botId) {
      joinBot(botId);
    }
  }, [isConnected, botId, joinBot]);

  const loadConversationHistory = async () => {
    try {
      const response = await api.get(`/bot-execution/${botId}/chat?userId=${userId}&limit=50`);
      const newMessages = response.data;

      if (newMessages.length > 0) {
        setMessages(newMessages);
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  const loadBotStatus = async () => {
    try {
      const response = await api.get(`/bot-execution/${botId}/status?userId=${userId}`);
      setBotInstance(response.data);
    } catch (error) {
      console.error('Failed to load bot status:', error);
    }
  };

  const startBot = async () => {
    setIsStarting(true);
    try {
      if (isConnected) {
        wsStartBot(botId);
      } else {
        // Fallback to REST API if WebSocket not connected
        await api.post(`/bot-execution/${botId}/start`, { userId });
        await loadBotStatus();
      }
    } catch (error) {
      console.error('Failed to start bot:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const stopBot = async () => {
    setIsStopping(true);
    try {
      if (isConnected) {
        wsStopBot(botId);
      } else {
        // Fallback to REST API if WebSocket not connected
        await api.post(`/bot-execution/${botId}/stop`, { userId });
        await loadBotStatus();
      }
    } catch (error) {
      console.error('Failed to stop bot:', error);
    } finally {
      setIsStopping(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentValue = inputRef.current?.value ?? '';
    if (!currentValue.trim() || isLoading) return;

    setIsLoading(true);
    // New user turn → collapse previous insights (kept per-message)
    setExpandedToolEventIds(new Set());
    setExpandedThoughtMessageIds(new Set());
    try {
      if (isConnected) {
        // Use WebSocket for real-time messaging
        wsSendMessage(currentValue);
        if (inputRef.current) inputRef.current.value = '';
      } else {
        // Fallback to REST API
        const response = await api.post(`/bot-execution/${botId}/chat`, {
          userId,
          message: currentValue
        });

        // Add user message immediately
        setMessages(prev => [...prev, response.data.userMessage]);
        if (inputRef.current) inputRef.current.value = '';

        // Force immediate load of conversation to get the processing message
        await loadConversationHistory();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageStatusIcon = (message: ChatMessage) => {
    if (message.role !== 'bot') return null;

    const content = message.content.toLowerCase();

    if (content.includes('processing your message')) {
      return (
        <div className="flex items-center space-x-2 text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-xs">Processing...</span>
        </div>
      );
    }

    if (content.includes('thinking') || content.includes('detecting')) {
      return (
        <div className="flex items-center space-x-2 text-yellow-600">
          <div className="animate-pulse">🤔</div>
          <span className="text-xs">Thinking...</span>
        </div>
      );
    }

    return null;
  };

  const MarkdownMessage: React.FC<{ content: string }> = React.memo(({ content }) => {
    const components = useMemo(() => ({
      a: ({ node, ...props }: any) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline" />,
      code: ({ inline, className, children, ...props }: any) => (
        <code className={`${inline ? '' : 'block'} bg-gray-100 rounded px-1 py-0.5 text-[12px]`} {...props}>{children}</code>
      ),
      pre: ({ node, ...props }: any) => (
        <pre className="bg-gray-100 rounded p-2 overflow-auto" {...props} />
      ),
      ul: ({ node, ...props }: any) => <ul className="list-disc pl-5" {...props} />,
      ol: ({ node, ...props }: any) => <ol className="list-decimal pl-5" {...props} />,
      h1: ({ node, ...props }: any) => <h1 className="text-lg font-semibold" {...props} />,
      h2: ({ node, ...props }: any) => <h2 className="text-base font-semibold" {...props} />,
      h3: ({ node, ...props }: any) => <h3 className="text-sm font-semibold" {...props} />,
      p: ({ node, ...props }: any) => <p className="mb-2" {...props} />,
      table: ({ node, ...props }: any) => <div className="overflow-auto"><table className="min-w-full text-left" {...props} /></div>,
      th: ({ node, ...props }: any) => <th className="border px-2 py-1" {...props} />,
      td: ({ node, ...props }: any) => <td className="border px-2 py-1 align-top" {...props} />,
    }), []);

    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={components}>
        {content}
      </ReactMarkdown>
    );
  });

  // Extract agent thoughts and tool events from a single bot message
  const extractAgentInsights = (content: string, messageId: string): {
    thoughts: string[];
    toolEvents: ToolEventItem[];
    remainingContent: string;
  } => {
    let remaining = content;
    const thoughts: string[] = [];
    const events: ToolEventItem[] = [];

    // Parse tool execution results first using a clear marker and end boundary (blank line or end)
    const marker = 'Tool execution results:';
    const markerIdx = remaining.indexOf(marker);
    if (markerIdx !== -1) {
      const head = remaining.slice(0, markerIdx);
      const tail = remaining.slice(markerIdx + marker.length);
      const endIdxInTail = tail.indexOf('\n\n');
      const section = tail.slice(0, endIdxInTail === -1 ? undefined : endIdxInTail);
      const after = tail.slice(endIdxInTail === -1 ? section.length : endIdxInTail);

      let current: ToolEventItem | null = null;
      for (const raw of section.split('\n')) {
        const line = raw.trim();
        if (!line) continue;
        if (line.startsWith('✅ ') || line.startsWith('❌ ')) {
          if (current) events.push(current);
          const ok = line.startsWith('✅ ');
          const afterIcon = line.slice(2).trim();
          const [toolName, ...rest] = afterIcon.split(':');
          current = {
            id: `${messageId}-${events.length}`,
            toolName: (toolName || 'Tool').trim(),
            status: ok ? 'success' : 'failure',
            details: rest.join(':').trim(),
          };
        } else if (current && (line.startsWith('Message:') || line.startsWith('Data:'))) {
          const extra = line.replace(/^\w+:/, '').trim();
          current.details = `${current.details ? current.details + '\n' : ''}${extra}`;
        }
      }
      if (current) events.push(current);

      remaining = (head + after).trim();
    }

    // Extract thoughts section starting from "I detected" until a blank line
    const thoughtsIdx = remaining.indexOf('I detected');
    if (thoughtsIdx !== -1) {
      const tail = remaining.slice(thoughtsIdx);
      const endIdx = tail.indexOf('\n\n') !== -1 ? thoughtsIdx + tail.indexOf('\n\n') : remaining.length;
      const section = remaining.slice(thoughtsIdx, endIdx);
      section.split('\n').map(l => l.trim()).filter(Boolean).forEach(l => thoughts.push(l));
      remaining = (remaining.slice(0, thoughtsIdx) + remaining.slice(endIdx)).trim();
    }

    return { thoughts, toolEvents: events, remainingContent: remaining.trim() };
  };

  const isBotRunning = botInstance?.status === 'running';
  const isBotStarting = botInstance?.status === 'starting';
  const isBotStopping = botInstance?.status === 'stopping';
  const isBotError = botInstance?.status === 'error';

  // Memoized message list to avoid re-rendering while typing
  interface MessageListProps {
    items: ChatMessage[];
    insights: Record<string, AgentInsights>;
    expandedIds: Set<string>;
    onToggle: (id: string) => void;
    typingUsers: Set<string>;
    endRef: React.RefObject<HTMLDivElement>;
  }

  const MessageList: React.FC<MessageListProps> = React.memo(({ items, insights, expandedIds, onToggle, typingUsers, endRef }) => {
    const statusIcon = (message: ChatMessage) => {
      if (message.role !== 'bot') return null;
      const content = message.content.toLowerCase();
      if (content.includes('processing your message')) {
        return (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-xs">Processing...</span>
          </div>
        );
      }
      if (content.includes('thinking') || content.includes('detecting')) {
        return (
          <div className="flex items-center space-x-2 text-yellow-600">
            <div className="animate-pulse">🤔</div>
            <span className="text-xs">Thinking...</span>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.length === 0 ? (
          <div className="text-center text-gray-500 py-8">Start the bot to begin chatting</div>
        ) : (
          items.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.content.toLowerCase().includes('processing your message')
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : message.content.toLowerCase().includes('thinking') || message.content.toLowerCase().includes('detecting')
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    : message.content.toLowerCase().includes('executing') || message.content.toLowerCase().includes('tool')
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <div className="text-sm prose prose-sm max-w-none prose-p:my-2 prose-pre:my-2 prose-code:before:content-[''] prose-code:after:content-['']">
                  <MarkdownMessage content={message.content} />
                </div>
                {statusIcon(message)}
                <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                  <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                  {message.responseTime && <span>{message.responseTime}ms</span>}
                  {message.tokensUsed && <span>{message.tokensUsed} tokens</span>}
                </div>
              </div>

              {message.role === 'bot' && insights[message.id] && (
                <div className="w-full mt-2">
                  {insights[message.id].thoughts.length > 0 && (
                    <div className="text-xs text-gray-700 bg-white border border-gray-200 rounded-md p-3 space-y-1 mb-2">
                      {insights[message.id].thoughts.map((t, i) => (
                        <div key={`${message.id}-thought-${i}`}>{t}</div>
                      ))}
                    </div>
                  )}
                  {insights[message.id].toolEvents.length > 0 && (
                    <div className="space-y-2">
                      {insights[message.id].toolEvents.map(ev => {
                        const isExpanded = expandedIds.has(ev.id);
                        const limit = 220;
                        const details = ev.details || '';
                        const truncated = details.length > limit ? details.slice(0, limit) + '…' : details;
                        return (
                          <div key={ev.id} className={`text-xs rounded-md border ${ev.status === 'success' ? 'border-green-200 bg-green-50 text-green-800' : ev.status === 'failure' ? 'border-red-200 bg-red-50 text-red-800' : 'border-gray-200 bg-gray-50 text-gray-800'}`}>
                            <div className="flex items-center justify-between p-2">
                              <div className="flex items-center min-w-0">
                                <span className="mr-2 flex-shrink-0">{ev.status === 'success' ? '✅' : ev.status === 'failure' ? '❌' : 'ℹ️'}</span>
                                <div className="font-medium truncate">{ev.toolName}</div>
                              </div>
                              {details && (
                                <button type="button" onClick={() => onToggle(ev.id)} className={`ml-3 px-2 py-1 rounded border text-[11px] ${ev.status === 'success' ? 'border-green-300 hover:bg-green-100' : ev.status === 'failure' ? 'border-red-300 hover:bg-red-100' : 'border-gray-300 hover:bg-gray-100'}`}>
                                  {isExpanded ? 'Hide details' : 'Show details'}
                                </button>
                              )}
                            </div>
                            {details && (
                              <div className="px-2 pb-2">
                                {!isExpanded ? (
                                  <pre className="whitespace-pre-wrap text-[11px] leading-snug">{truncated}</pre>
                                ) : (
                                  <pre className="whitespace-pre-wrap text-[11px] leading-snug max-h-64 overflow-auto">{details}</pre>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {typingUsers.size > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs">{Array.from(typingUsers).length} user{Array.from(typingUsers).length > 1 ? 's' : ''} typing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>
    );
  });

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{botName}</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isBotRunning ? 'bg-green-500' :
              isBotStarting ? 'bg-yellow-500' :
              isBotStopping ? 'bg-orange-500' :
              isBotError ? 'bg-red-500' : 'bg-gray-400'
            }`} />
            <span className="text-sm text-gray-600 capitalize">
              {botInstance?.status || 'unknown'}
            </span>
            {botInstance?.errorMessage && (
              <span className="text-sm text-red-600">({botInstance.errorMessage})</span>
            )}
            {isConnected && (
              <span className="text-xs text-green-600">● Live</span>
            )}
            {connectionError && (
              <span className="text-xs text-red-600">● Connection Error</span>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          {!isBotRunning && !isBotStarting && (
            <button
              onClick={startBot}
              disabled={isStarting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStarting ? 'Starting...' : 'Start Bot'}
            </button>
          )}

          {isBotRunning && (
            <button
              onClick={stopBot}
              disabled={isStopping}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStopping ? 'Stopping...' : 'Stop Bot'}
            </button>
          )}
        </div>
      </div>

      {/* Inline insights now render with each message; removed pinned panel */}

      {/* Messages */}
      <MessageList
        items={messages}
        insights={insightsByMessageId}
        expandedIds={expandedToolEventIds}
        onToggle={toggleToolEvent}
        typingUsers={typingUsers}
        endRef={messagesEndRef}
      />

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            placeholder={isBotRunning ? "Type your message..." : "Start the bot to chat"}
            disabled={!isBotRunning || isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!isBotRunning || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};
