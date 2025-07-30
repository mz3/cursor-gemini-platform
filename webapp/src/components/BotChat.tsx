import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

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
}

interface BotInstance {
  id: string;
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping';
  lastStartedAt?: string;
  lastStoppedAt?: string;
  errorMessage?: string;
}

export const BotChat: React.FC<BotChatProps> = ({ botId, userId, botName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [botInstance, setBotInstance] = useState<BotInstance | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation history and bot status on mount
  useEffect(() => {
    loadConversationHistory();
    loadBotStatus();
  }, [botId, userId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversationHistory = async () => {
    try {
      const response = await api.get(`/bot-execution/${botId}/chat?userId=${userId}`);
      setMessages(response.data);
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
      await api.post(`/bot-execution/${botId}/start`, { userId });
      await loadBotStatus();
    } catch (error) {
      console.error('Failed to start bot:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const stopBot = async () => {
    setIsStopping(true);
    try {
      await api.post(`/bot-execution/${botId}/stop`, { userId });
      await loadBotStatus();
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
      const response = await api.post(`/bot-execution/${botId}/chat`, {
        userId,
        message: newMessage
      });

      // Add both user message and bot response to the conversation
      setMessages(prev => [...prev, response.data.userMessage, response.data.botResponse]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
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
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                {message.responseTime && (
                  <p className="text-xs opacity-75 mt-1">
                    Response time: {message.responseTime}ms
                  </p>
                )}
              </div>
            </div>
          ))
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