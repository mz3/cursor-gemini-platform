export interface ChatMessage {
  id: string;
  role: 'user' | 'bot' | 'system';
  content: string;
  createdAt: Date | string;
  responseTime?: number;
  tokensUsed?: number;
  status?: 'processing' | 'thinking' | 'executing' | 'completed' | 'error';
}

export interface BotStatusUpdate {
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping';
  lastStartedAt?: Date | string;
  lastStoppedAt?: Date | string;
  errorMessage?: string;
}

export interface TypingIndicator {
  isTyping: boolean;
  userId: string;
  botId: string;
}

export interface WebSocketEvent {
  type: 'message' | 'status' | 'typing' | 'error';
  data: any;
  timestamp: string;
}

export interface ConnectionInfo {
  userId: string;
  botId: string;
  socketId: string;
  connectedAt: string;
} 