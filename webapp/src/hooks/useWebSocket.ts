import { useEffect, useRef, useState, useCallback } from 'react';
import wsService, { 
  ChatMessage, 
  BotStatusUpdate, 
  TypingIndicator, 
  WebSocketEventHandlers 
} from '../services/websocket';

interface UseWebSocketOptions {
  botId?: string;
  userId?: string;
  token?: string;
  autoConnect?: boolean;
  onMessage?: (message: ChatMessage) => void;
  onStatusUpdate?: (status: BotStatusUpdate) => void;
  onTypingIndicator?: (indicator: TypingIndicator) => void;
  onError?: (error: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnect?: () => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    botId,
    userId,
    token,
    autoConnect = false,
    onMessage,
    onStatusUpdate,
    onTypingIndicator,
    onError,
    onConnect,
    onDisconnect,
    onReconnect,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set up event handlers
  const eventHandlers: WebSocketEventHandlers = {
    onMessage,
    onStatusUpdate,
    onTypingIndicator,
    onError: (error) => {
      setConnectionError(error.message || 'WebSocket error');
      onError?.(error);
    },
    onConnect: () => {
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      setReconnectAttempts(0);
      onConnect?.();
    },
    onDisconnect: () => {
      setIsConnected(false);
      onDisconnect?.();
    },
    onReconnect: () => {
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      setReconnectAttempts(wsService.getConnectionStatus().reconnectAttempts);
      onReconnect?.();
    },
  };

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (!token) {
      setConnectionError('No authentication token provided');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      await wsService.connect(token);
      wsService.setEventHandlers(eventHandlers);
      
      if (botId) {
        wsService.joinBot(botId);
      }
    } catch (error) {
      setIsConnecting(false);
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      console.error('WebSocket connection error:', error);
    }
  }, [token, botId, eventHandlers]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    wsService.disconnect();
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionError(null);
  }, []);

  // Send message
  const sendMessage = useCallback((message: string) => {
    if (!isConnected) {
      throw new Error('WebSocket not connected');
    }
    wsService.sendMessage(message);
  }, [isConnected]);

  // Start typing indicator
  const startTyping = useCallback((botId: string) => {
    if (!isConnected || !botId) return;
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    wsService.startTyping(botId);
  }, [isConnected]);

  // Stop typing indicator
  const stopTyping = useCallback((botId: string) => {
    if (!isConnected || !botId) return;
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    wsService.stopTyping(botId);
  }, [isConnected]);

  // Start typing with auto-stop after delay
  const startTypingWithTimeout = useCallback((botId: string, timeoutMs: number = 3000) => {
    if (!isConnected || !botId) return;
    
    startTyping(botId);
    
    // Auto-stop typing after timeout
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(botId);
    }, timeoutMs);
  }, [isConnected, startTyping, stopTyping]);

  // Bot control methods
  const startBot = useCallback((botId: string) => {
    if (!isConnected) {
      throw new Error('WebSocket not connected');
    }
    wsService.startBot(botId);
  }, [isConnected]);

  const stopBot = useCallback((botId: string) => {
    if (!isConnected) {
      throw new Error('WebSocket not connected');
    }
    wsService.stopBot(botId);
  }, [isConnected]);

  // Join bot room
  const joinBot = useCallback((botId: string) => {
    if (!isConnected) {
      throw new Error('WebSocket not connected');
    }
    wsService.joinBot(botId);
  }, [isConnected]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && token && !isConnected && !isConnecting) {
      connect();
    }
  }, [autoConnect, token, isConnected, isConnecting, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Update connection status
  useEffect(() => {
    const updateStatus = () => {
      const status = wsService.getConnectionStatus();
      setIsConnected(status.connected);
      setIsConnecting(status.connecting);
      setReconnectAttempts(status.reconnectAttempts);
    };

    // Update immediately
    updateStatus();

    // Set up interval to check status
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    // State
    isConnected,
    isConnecting,
    connectionError,
    reconnectAttempts,
    
    // Methods
    connect,
    disconnect,
    sendMessage,
    startTyping,
    stopTyping,
    startTypingWithTimeout,
    startBot,
    stopBot,
    joinBot,
    
    // Connection status
    getConnectionStatus: wsService.getConnectionStatus.bind(wsService),
  };
}; 