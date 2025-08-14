import { ChatMessage, BotStatusUpdate, TypingIndicator } from './types.js';

export class MessageHandler {
  private static instance: MessageHandler;
  private wsServer: any; // Will be set by the main server

  private constructor() {}

  public static getInstance(): MessageHandler {
    if (!MessageHandler.instance) {
      MessageHandler.instance = new MessageHandler();
    }
    return MessageHandler.instance;
  }

  public setWebSocketServer(wsServer: any) {
    this.wsServer = wsServer;
  }

  // Handle new bot messages from the execution service
  public async handleBotMessage(botId: string, message: ChatMessage) {
    if (!this.wsServer) {
      console.warn('WebSocket server not initialized');
      return;
    }

    try {
      // Broadcast the new message to all users in the bot room
      this.wsServer.broadcastNewMessage(botId, message);

      console.log(`Broadcasted bot message to bot ${botId}:`, message.id);
    } catch (error) {
      console.error('Error broadcasting bot message:', error);
    }
  }

  // Handle bot status updates
  public async handleBotStatusUpdate(botId: string, status: BotStatusUpdate) {
    if (!this.wsServer) {
      console.warn('WebSocket server not initialized');
      return;
    }

    try {
      // Broadcast the status update to all users in the bot room
      this.wsServer.broadcastBotStatusUpdate(botId, status);

      console.log(`Broadcasted bot status update to bot ${botId}:`, status.status);
    } catch (error) {
      console.error('Error broadcasting bot status update:', error);
    }
  }

  // Handle typing indicators
  public async handleTypingIndicator(botId: string, indicator: TypingIndicator) {
    if (!this.wsServer) {
      console.warn('WebSocket server not initialized');
      return;
    }

    try {
      // Broadcast the typing indicator to all users in the bot room
      this.wsServer.broadcastTypingIndicator(botId, indicator);

      console.log(`Broadcasted typing indicator to bot ${botId}:`, indicator);
    } catch (error) {
      console.error('Error broadcasting typing indicator:', error);
    }
  }

  // Get connected users for a bot
  public getConnectedUsers(botId: string): string[] {
    if (!this.wsServer) {
      return [];
    }
    return this.wsServer.getConnectedUsers(botId);
  }

  // Get connected user count for a bot
  public getConnectedUserCount(botId: string): number {
    if (!this.wsServer) {
      return 0;
    }
    return this.wsServer.getConnectedUserCount(botId);
  }

  // Queue message when bot is not running
  public async queueMessage(botId: string, userId: string, message: string) {
    // This could be implemented with Redis or database for persistence
    console.log(`Message queued for bot ${botId} from user ${userId}:`, message);

    // For now, we'll just log it. In a production system, you'd want to:
    // 1. Store the message in a queue (Redis, RabbitMQ, etc.)
    // 2. Process it when the bot becomes available
    // 3. Notify the user when the message is processed
  }

  // Handle conversation cleared event
  public async handleConversationCleared(botId: string, userId: string) {
    if (!this.wsServer) {
      console.warn('WebSocket server not initialized');
      return;
    }

    try {
      // Broadcast the conversation cleared event to all users in the bot room
      this.wsServer.broadcastConversationCleared(botId, userId);

      console.log(`Broadcasted conversation cleared event to bot ${botId} for user ${userId}`);
    } catch (error) {
      console.error('Error broadcasting conversation cleared event:', error);
    }
  }

  // Process queued messages when bot becomes available
  public async processQueuedMessages(botId: string) {
    // This would process any queued messages for the bot
    console.log(`Processing queued messages for bot ${botId}`);

    // Implementation would depend on your queue system
  }
}

export default MessageHandler;
