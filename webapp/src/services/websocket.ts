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
  private eventHandlers: WebSocketEventHandlers = {};

  constructor() {
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (this.socket) {
      this.socket.on('connect', () => {
        console.log('🔌 WebSocket connected');
        this.reconnectAttempts = 0;
        this.eventHandlers.onConnect?.();
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log('🔌 WebSocket disconnected:', reason);
        this.eventHandlers.onDisconnect?.();
        
        if (reason === 'io server disconnect') {
          // Server disconnected us, try to reconnect
          this.reconnect();
        }
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('🔌 WebSocket connection error:', error);
        this.eventHandlers.onError?.(error);
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnect();
        }
      });

      this.socket.on('new-message', (message: ChatMessage) => {
        console.log('📨 Received new message:', message.id);
        this.eventHandlers.onMessage?.(message);
      });

      this.socket.on('bot-status-update', (status: BotStatusUpdate) => {
        console.log('📊 Received bot status update:', status.status);
        this.eventHandlers.onStatusUpdate?.(status);
      });

      this.socket.on('conversation-history', (messages: ChatMessage[]) => {
        console.log('📚 Received conversation history:', messages.length, 'messages');
        // Handle conversation history - could be added to event handlers if needed
      });

      this.socket.on('typing-indicator', (indicator: TypingIndicator) => {
        console.log('⌨️ Received typing indicator:', indicator);
        this.eventHandlers.onTypingIndicator?.(indicator);
      });

      this.socket.on('error', (error: Error) => {
        console.error('🔌 WebSocket error:', error);
        this.eventHandlers.onError?.(error);
      });
    }
  }

  public connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        this.socket = io(apiUrl, {
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
          resolve();
        });

        this.socket.on('connect_error', (error: Error) => {
          this.isConnecting = false;
          reject(error);
        });

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
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