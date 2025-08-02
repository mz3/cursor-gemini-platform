import { AppDataSource } from '../config/database.js';
import { BotInstance, BotInstanceStatus } from '../entities/BotInstance.js';
import { ChatMessage, MessageRole } from '../entities/ChatMessage.js';
import { Bot } from '../entities/Bot.js';
import { Prompt } from '../entities/Prompt.js';
import { PromptVersion } from '../entities/PromptVersion.js';
import { BotTool } from '../entities/BotTool.js';
import { publishEvent } from '../config/redis.js';

const botInstanceRepository = AppDataSource.getRepository(BotInstance);
const chatMessageRepository = AppDataSource.getRepository(ChatMessage);
const botRepository = AppDataSource.getRepository(Bot);
const promptRepository = AppDataSource.getRepository(Prompt);
const botToolRepository = AppDataSource.getRepository(BotTool);

// UUID validation helper
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export class BotExecutionService {
  private static runningInstances = new Map<string, NodeJS.Timeout>();

  /**
   * Start a bot instance
   */
  static async startBotInstance(botId: string, userId: string): Promise<BotInstance> {
    // Validate UUIDs
    if (!isValidUUID(botId)) {
      throw new Error('Invalid bot ID format');
    }
    if (!isValidUUID(userId)) {
      throw new Error('Invalid user ID format');
    }

    // Check if bot exists and is active
    const bot = await botRepository.findOne({
      where: { id: botId, isActive: true },
      relations: ['prompts']
    });

    if (!bot) {
      throw new Error('Bot not found or not active');
    }

    // Check if user owns the bot
    if (bot.userId !== userId) {
      throw new Error('Unauthorized to start this bot');
    }

    // Check if instance already exists and is running
    let instance = await botInstanceRepository.findOne({
      where: { botId, userId }
    });

    if (instance && instance.status === BotInstanceStatus.RUNNING) {
      throw new Error('Bot is already running');
    }

    if (!instance) {
      // Create new instance
      instance = botInstanceRepository.create({
        botId,
        userId,
        status: BotInstanceStatus.STARTING,
        lastStartedAt: new Date()
      });
    } else {
      // Update existing instance
      instance.status = BotInstanceStatus.STARTING;
      instance.lastStartedAt = new Date();
      instance.errorMessage = undefined;
    }

    await botInstanceRepository.save(instance);

    try {
      // Simulate bot startup process
      await this.simulateBotStartup(instance.id);

      instance.status = BotInstanceStatus.RUNNING;
      await botInstanceRepository.save(instance);

      // Set up periodic health check
      const healthCheckInterval = setInterval(async () => {
        await this.performHealthCheck(instance.id);
      }, 30000); // Check every 30 seconds

      this.runningInstances.set(instance.id, healthCheckInterval);

      return instance;
    } catch (error) {
      instance.status = BotInstanceStatus.ERROR;
      instance.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await botInstanceRepository.save(instance);
      throw error;
    }
  }

  /**
   * Stop a bot instance
   */
  static async stopBotInstance(botId: string, userId: string): Promise<BotInstance> {
    // Validate UUIDs
    if (!isValidUUID(botId)) {
      throw new Error('Invalid bot ID format');
    }
    if (!isValidUUID(userId)) {
      throw new Error('Invalid user ID format');
    }

    // Check if instance exists
    const instance = await botInstanceRepository.findOne({
      where: { botId, userId }
    });

    if (!instance) {
      throw new Error('Bot instance not found');
    }

    // Update instance status
    instance.status = BotInstanceStatus.STOPPED;
    instance.lastStoppedAt = new Date();

    await botInstanceRepository.save(instance);

    // Clear health check interval
    const healthCheckInterval = this.runningInstances.get(instance.id);
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      this.runningInstances.delete(instance.id);
    }

    return instance;
  }

  /**
   * Send a message to a bot (queues for async processing)
   */
  static async sendMessage(
    botId: string,
    userId: string,
    message: string
  ): Promise<{ userMessage: ChatMessage; botResponse: ChatMessage }> {
    // Validate UUIDs
    if (!isValidUUID(botId)) {
      throw new Error('Invalid bot ID format');
    }
    if (!isValidUUID(userId)) {
      throw new Error('Invalid user ID format');
    }

    // Check if bot exists and is active
    const bot = await botRepository.findOne({
      where: { id: botId, isActive: true },
      relations: ['prompts']
    });

    if (!bot) {
      throw new Error('Bot not found or not active');
    }

    // Check if user owns the bot
    if (bot.userId !== userId) {
      throw new Error('Unauthorized to use this bot');
    }

    // Get or create bot instance
    let instance = await botInstanceRepository.findOne({
      where: { botId, userId }
    });

    if (!instance) {
      // Create new instance
      instance = botInstanceRepository.create({
        botId,
        userId,
        status: BotInstanceStatus.RUNNING,
        lastStartedAt: new Date()
      });
      await botInstanceRepository.save(instance);
    }

    // Save user message immediately
    const userMessage = chatMessageRepository.create({
      botInstanceId: instance.id,
      userId,
      role: MessageRole.USER,
      content: message
    });
    await chatMessageRepository.save(userMessage);

    // Create a placeholder bot response (will be updated by worker)
    const botResponse = chatMessageRepository.create({
      botInstanceId: instance.id,
      userId,
      role: MessageRole.BOT,
      content: 'Processing your message...',
      tokensUsed: 0
    });
    await chatMessageRepository.save(botResponse);

    // Queue the message for async processing
    await publishEvent('bot_messages', {
      botId,
      userId,
      message,
      instanceId: instance.id,
      userMessageId: userMessage.id,
      botResponseId: botResponse.id
    });

    console.log(`📨 Queued bot message for async processing: ${botId}`);

    return { userMessage, botResponse };
  }

  /**
   * Get conversation history for a bot
   */
  static async getConversationHistory(botId: string, userId: string, limit = 50): Promise<ChatMessage[]> {
    // Validate UUIDs
    if (!isValidUUID(botId)) {
      throw new Error('Invalid bot ID format');
    }
    if (!isValidUUID(userId)) {
      throw new Error('Invalid user ID format');
    }

    // Get bot instance
    const instance = await botInstanceRepository.findOne({
      where: { botId, userId }
    });

    if (!instance) {
      return [];
    }

    // Get conversation history in chronological order (oldest first)
    const messages = await chatMessageRepository.find({
      where: { botInstanceId: instance.id },
      order: { createdAt: 'ASC' },
      take: limit
    });

    // Filter out intermediate status messages that are older than 30 seconds
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
    
    return messages.filter(message => {
      // Keep all user messages
      if (message.role === MessageRole.USER) {
        return true;
      }
      
      // Keep bot messages that are either:
      // 1. Recent (less than 30 seconds old)
      // 2. Not intermediate status messages (don't contain thinking/detecting/executing)
      const isRecent = new Date(message.createdAt) > thirtySecondsAgo;
      const isIntermediateStatus = message.content.includes('🤔 Thinking...') || 
                                  message.content.includes('🔍 Detecting tools...') || 
                                  message.content.includes('🔧 Executing tools...');
      
      return isRecent || !isIntermediateStatus;
    });
  }

  /**
   * Get bot instance status
   */
  static async getBotInstanceStatus(botId: string, userId: string): Promise<BotInstance | null> {
    // Validate UUIDs
    if (!isValidUUID(botId)) {
      throw new Error('Invalid bot ID format');
    }
    if (!isValidUUID(userId)) {
      throw new Error('Invalid user ID format');
    }

    return await botInstanceRepository.findOne({
      where: { botId, userId }
    });
  }

  /**
   * Simulate bot startup process
   */
  private static async simulateBotStartup(instanceId: string): Promise<void> {
    // Simulate startup delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Perform health check on running bot
   */
  private static async performHealthCheck(instanceId: string): Promise<void> {
    const instance = await botInstanceRepository.findOne({
      where: { id: instanceId }
    });

    if (!instance || instance.status !== BotInstanceStatus.RUNNING) {
      const healthCheckInterval = this.runningInstances.get(instanceId);
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
        this.runningInstances.delete(instanceId);
      }
    }
  }
}
