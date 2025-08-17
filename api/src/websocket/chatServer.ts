import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { BotExecutionService } from '../services/botExecutionService.js';
import { ChatMessage, BotStatusUpdate, TypingIndicator } from './types.js';

interface SocketUserData {
  userId: string;
  botId?: string;
}

class ChatWebSocketServer {
  private io: SocketIOServer;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private botRooms: Map<string, Set<string>> = new Map(); // botId -> Set of userIds
  private typingUsers: Map<string, Set<string>> = new Map(); // botId -> Set of typing userIds
  private socketUserData: Map<string, SocketUserData> = new Map(); // socketId -> user data

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: Socket, next: (err?: Error) => void) => {
      try {
        const token = (socket as any).handshake.auth.token || (socket as any).handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        this.socketUserData.set(socket.id, { userId: decoded.userId });
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      const userData = this.socketUserData.get(socket.id);
      if (!userData) {
        console.error('No user data found for socket:', socket.id);
        return;
      }

      console.log(`User ${userData.userId} connected: ${socket.id}`);

      // Join bot room
      socket.on('join-bot', async (data: { botId: string }) => {
        try {
          const { botId } = data;
          userData.botId = botId;
          this.socketUserData.set(socket.id, userData);

          // Join the bot room
          socket.join(`bot:${botId}`);

          // Track connected users
          if (!this.connectedUsers.has(userData.userId)) {
            this.connectedUsers.set(userData.userId, new Set());
          }
          this.connectedUsers.get(userData.userId)!.add(socket.id);

          // Track bot rooms
          if (!this.botRooms.has(botId)) {
            this.botRooms.set(botId, new Set());
          }
          this.botRooms.get(botId)!.add(userData.userId);

          // Send current bot status
          const botStatus = await BotExecutionService.getBotInstanceStatus(botId, userData.userId);
          if (botStatus) {
            socket.emit('bot-status-update', botStatus);
          }

          // Send recent conversation history
          const messages = await BotExecutionService.getConversationHistory(botId, userData.userId, 20);
          socket.emit('conversation-history', messages);

          console.log(`User ${userData.userId} joined bot ${botId}`);
        } catch (error) {
          console.error('Error joining bot room:', error);
          socket.emit('error', { message: 'Failed to join bot room' });
        }
      });

      // Handle new message
      socket.on('send-message', async (data: { message: string }) => {
        try {
          const { message } = data;
          const { botId, userId } = userData;

          if (!botId || !userId) {
            socket.emit('error', { message: 'Bot ID or User ID not found' });
            return;
          }

          // Send message to bot execution service
          const result = await BotExecutionService.sendMessage(botId, userId, message);

          // Broadcast user message to all users in the bot room
          this.io.to(`bot:${botId}`).emit('new-message', result.userMessage);

          // If bot is not running, queue the message
          const botStatus = await BotExecutionService.getBotInstanceStatus(botId, userId);
          if (botStatus && botStatus.status !== 'running') {
            socket.emit('bot-status-update', botStatus);
          }

        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing-start', (data: { botId: string }) => {
        const { botId } = data;
        const { userId } = userData;

        if (!this.typingUsers.has(botId)) {
          this.typingUsers.set(botId, new Set());
        }
        this.typingUsers.get(botId)!.add(userId);

        socket.to(`bot:${botId}`).emit('typing-indicator', {
          isTyping: true,
          userId: userId,
          botId: botId
        });
      });

      socket.on('typing-stop', (data: { botId: string }) => {
        const { botId } = data;
        const { userId } = userData;

        this.typingUsers.get(botId)?.delete(userId);

        socket.to(`bot:${botId}`).emit('typing-indicator', {
          isTyping: false,
          userId: userId,
          botId: botId
        });
      });

      // Handle bot control
      socket.on('start-bot', async (data: { botId: string }) => {
        try {
          const { botId } = data;
          const { userId } = userData;

          const instance = await BotExecutionService.startBotInstance(botId, userId);

          // Broadcast bot status update to all users in the room
          this.io.to(`bot:${botId}`).emit('bot-status-update', instance);

        } catch (error) {
          console.error('Error starting bot:', error);
          socket.emit('error', { message: 'Failed to start bot' });
        }
      });

      socket.on('stop-bot', async (data: { botId: string }) => {
        try {
          const { botId } = data;
          const { userId } = userData;

          const instance = await BotExecutionService.stopBotInstance(botId, userId);

          // Broadcast bot status update to all users in the room
          this.io.to(`bot:${botId}`).emit('bot-status-update', instance);

        } catch (error) {
          console.error('Error stopping bot:', error);
          socket.emit('error', { message: 'Failed to stop bot' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${userData.userId} disconnected: ${socket.id}`);

        // Remove from connected users
        const userSockets = this.connectedUsers.get(userData.userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this.connectedUsers.delete(userData.userId);
          }
        }

        // Remove from bot rooms
        if (userData.botId) {
          const botUsers = this.botRooms.get(userData.botId);
          if (botUsers) {
            botUsers.delete(userData.userId);
            if (botUsers.size === 0) {
              this.botRooms.delete(userData.botId);
            }
          }

          // Remove from typing users
          this.typingUsers.get(userData.botId)?.delete(userData.userId);
        }

        // Clean up socket user data
        this.socketUserData.delete(socket.id);
      });
    });
  }

  // Public methods for broadcasting updates from other services
  public broadcastBotStatusUpdate(botId: string, status: BotStatusUpdate) {
    this.io.to(`bot:${botId}`).emit('bot-status-update', status);
  }

  public broadcastNewMessage(botId: string, message: ChatMessage) {
    this.io.to(`bot:${botId}`).emit('new-message', message);
  }

  public broadcastTypingIndicator(botId: string, indicator: TypingIndicator) {
    this.io.to(`bot:${botId}`).emit('typing-indicator', indicator);
  }

  public broadcastConversationCleared(botId: string, userId: string) {
    this.io.to(`bot:${botId}`).emit('conversation-cleared', { botId, userId });
  }

  public getConnectedUsers(botId: string): string[] {
    return Array.from(this.botRooms.get(botId) || []);
  }

  public getConnectedUserCount(botId: string): number {
    return this.botRooms.get(botId)?.size || 0;
  }
}

export default ChatWebSocketServer;
