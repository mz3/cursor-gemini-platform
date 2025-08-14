import { subscribeToEvent } from '../config/redis.js';
import { BotExecutionService } from './botExecutionService.js';
import MessageHandler from '../websocket/messageHandler.js';

export class BotResponseService {
  private static instance: BotResponseService;
  private messageHandler: MessageHandler;

  private constructor() {
    this.messageHandler = MessageHandler.getInstance();
  }

  public static getInstance(): BotResponseService {
    if (!BotResponseService.instance) {
      BotResponseService.instance = new BotResponseService();
    }
    return BotResponseService.instance;
  }

  public async startListening(): Promise<void> {
    try {
      console.log('🤖 Starting bot response listener...');
      
      await subscribeToEvent('bot_responses', async (payload) => {
        try {
          console.log('📨 Received bot response:', payload);
          
          const { botId, botResponse } = payload;
          
          // Update the bot response in the database
          await BotExecutionService.updateBotMessage(
            botResponse.id,
            botResponse.content,
            botResponse.tokensUsed
          );
          
          // Broadcast the updated message via WebSocket
          await this.messageHandler.handleBotMessage(botId, botResponse);
          
          console.log('✅ Bot response processed and broadcasted successfully');
        } catch (error) {
          console.error('❌ Error processing bot response:', error);
        }
      });
      
      console.log('✅ Bot response listener started successfully');
    } catch (error) {
      console.error('❌ Failed to start bot response listener:', error);
      throw error;
    }
  }
}

export default BotResponseService; 