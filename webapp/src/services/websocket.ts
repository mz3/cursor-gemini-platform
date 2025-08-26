import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot' | 'system';
  content: string;
  createdAt: string;
  responseTime?: number;
  tokensUsed?: number;
  status?: 'processing' | 'thinking' | 'executing' | 'completed' | 'error';
}

export interface BotStatusUpdate {
  id: string;
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping';
  lastStartedAt?: string;
  lastStoppedAt?: string;
  errorMessage?: string;
}

export interface TypingIndicator {
  isTyping: boolean;
  userId: string;
  botId: string;
}

export interface WebSocketEventHandlers {
  onMessage?: (message: ChatMessage) => void;
  onStatusUpdate?: (status: BotStatusUpdate) => void;
  onTypingIndicator?: (indicator: TypingIndicator) => void;
  onConversationHistory?: (messages: ChatMessage[]) => void;
  onConversationCleared?: (data: { botId: string; userId: string }) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnect?: () => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private eventHandlers: WebSocketEventHandlers = {};

  constructor() {
    // Event handlers will be set up when socket is created
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('new-message', (message: ChatMessage) => {
      console.log('🔌 WebSocket received message:', message);
      this.eventHandlers.onMessage?.(message);
    });

    this.socket.on('bot-status-update', (status: BotStatusUpdate) => {
      console.log('🔌 WebSocket received bot status update:', status);
      this.eventHandlers.onStatusUpdate?.(status);
    });

    this.socket.on('typing-indicator', (indicator: TypingIndicator) => {
      console.log('🔌 WebSocket received typing indicator:', indicator);
      this.eventHandlers.onTypingIndicator?.(indicator);
    });

    this.socket.on('conversation-cleared', (data: { botId: string; userId: string }) => {
      console.log('🔌 WebSocket received conversation cleared:', data);
      this.eventHandlers.onConversationCleared?.(data);
    });

    this.socket.on('conversation-history', (messages: ChatMessage[]) => {
      console.log('🔌 WebSocket received conversation history:', messages);
      this.eventHandlers.onConversationHistory?.(messages);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      this.eventHandlers.onDisconnect?.();
    });

    this.socket.on('reconnect', () => {
      console.log('🔌 WebSocket reconnected');
      this.eventHandlers.onReconnect?.();
    });

    this.socket.on('error', (error: Error) => {
      console.error('🔌 WebSocket error:', error);
      this.eventHandlers.onError?.(error);
    });

    this.socket.on('connect', () => {
      console.log('🔌 WebSocket connected successfully');
    });
  }

  public connect(token: string): Promise<void> {
    // If already connected, return existing promise
    if (this.socket?.connected) {
      return Promise.resolve();
    }

    // If already connecting, return the existing connection promise
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    // If there's an existing socket but not connected, disconnect it first
    if (this.socket && !this.socket.connected) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnecting = true;

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // When running in Docker, use relative URLs to leverage Vite proxy
        // When running locally, use the full URL
        const isDocker = import.meta.env.VITE_DOCKER === 'true';
        const wsUrl = isDocker ? '/' : (import.meta.env.VITE_API_URL || 'http://localhost:4001');

        console.log('🔌 Connecting to WebSocket:', wsUrl, 'Docker:', isDocker);

        this.socket = io(wsUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
        });

        this.setupEventHandlers();

        this.socket.on('connect', () => {
          this.isConnecting = false;
          this.connectionPromise = null;
          resolve();
        });

        this.socket.on('connect_error', (error: Error) => {
          this.isConnecting = false;
          this.connectionPromise = null;
          reject(error);
        });

      } catch (error) {
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.connectionPromise = null;
  }

  public joinBot(botId: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('join-bot', { botId });
  }

  public sendMessage(message: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('send-message', { message });
  }

  public startTyping(botId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('typing-start', { botId });
  }

  public stopTyping(botId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('typing-stop', { botId });
  }

  public startBot(botId: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('start-bot', { botId });
  }

  public stopBot(botId: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('stop-bot', { botId });
  }

  public setEventHandlers(handlers: WebSocketEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('🔌 Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`🔌 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.socket) {
        this.socket.connect();
        this.eventHandlers.onReconnect?.();
      }
    }, delay);
  }

  public getConnectionStatus(): {
    connected: boolean;
    connecting: boolean;
    reconnectAttempts: number;
  } {
    return {
      connected: this.isConnected(),
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
export default wsService;
