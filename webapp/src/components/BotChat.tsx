import React, { useState, useEffect, useRef } from 'react';
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
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [botInstance, setBotInstance] = useState<BotInstance | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      setMessages(prev => {
        // Check if message already exists
        const exists = prev.find(m => m.id === message.id);
        if (exists) {
          // Update existing message
          return prev.map(m => m.id === message.id ? message : m);
        } else {
          // Add new message
          return [...prev, message];
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
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    try {
      if (isConnected) {
        // Use WebSocket for real-time messaging
        wsSendMessage(newMessage);
        setNewMessage('');
      } else {
        // Fallback to REST API
        const response = await api.post(`/bot-execution/${botId}/chat`, {
          userId,
          message: newMessage
        });

        // Add user message immediately
        setMessages(prev => [...prev, response.data.userMessage]);
        setNewMessage('');
        
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
    
    if (content.includes('executing') || content.includes('tool')) {
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <div className="animate-pulse">🔧</div>
          <span className="text-xs">Executing tool...</span>
        </div>
      );
    }
    
    return null;
  };

  const formatMessageContent = (content: string) => {
    // Split content into paragraphs for better readability
    return content.split('\n').map((line, index) => (
      <p key={index} className={index > 0 ? 'mt-2' : ''}>
        {line}
      </p>
    ));
  };

  const isBotRunning = botInstance?.status === 'running';
  const isBotStarting = botInstance?.status === 'starting';
  const isBotStopping = botInstance?.status === 'stopping';
  const isBotError = botInstance?.status === 'error';

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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {isBotRunning ? 'Start a conversation with your bot!' : 'Start the bot to begin chatting'}
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
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
                <div className="text-sm">
                  {formatMessageContent(message.content)}
                </div>
                
                {/* Status indicator */}
                {getMessageStatusIcon(message)}
                
                {/* Message metadata */}
                <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                  <span>
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                  {message.responseTime && (
                    <span>
                      {message.responseTime}ms
                    </span>
                  )}
                  {message.tokensUsed && (
                    <span>
                      {message.tokensUsed} tokens
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Typing indicators */}
        {typingUsers.size > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs">
                  {Array.from(typingUsers).length} user{Array.from(typingUsers).length > 1 ? 's' : ''} typing...
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isBotRunning ? "Type your message..." : "Start the bot to chat"}
            disabled={!isBotRunning || isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!isBotRunning || isLoading || !newMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}; 