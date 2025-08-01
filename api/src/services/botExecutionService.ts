import { AppDataSource } from '../config/database.js';
import { BotInstance, BotInstanceStatus } from '../entities/BotInstance.js';
import { ChatMessage, MessageRole } from '../entities/ChatMessage.js';
import { Bot } from '../entities/Bot.js';
import { Prompt } from '../entities/Prompt.js';
import { PromptVersion } from '../entities/PromptVersion.js';
import { GeminiService } from './geminiService.js';

const botInstanceRepository = AppDataSource.getRepository(BotInstance);
const chatMessageRepository = AppDataSource.getRepository(ChatMessage);
const botRepository = AppDataSource.getRepository(Bot);
const promptRepository = AppDataSource.getRepository(Prompt);

// UUID validation helper
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export class BotExecutionService {
  private static runningInstances = new Map<string, NodeJS.Timeout>();
  private static geminiService = new GeminiService();

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

    const instance = await botInstanceRepository.findOne({
      where: { botId, userId }
    });

    if (!instance) {
      throw new Error('Bot instance not found');
    }

    if (instance.status === BotInstanceStatus.STOPPED) {
      throw new Error('Bot is already stopped');
    }

    instance.status = BotInstanceStatus.STOPPING;
    await botInstanceRepository.save(instance);

    try {
      // Clean up running instance
      const healthCheckInterval = this.runningInstances.get(instance.id);
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
        this.runningInstances.delete(instance.id);
      }

      instance.status = BotInstanceStatus.STOPPED;
      instance.lastStoppedAt = new Date();
      await botInstanceRepository.save(instance);

      return instance;
    } catch (error) {
      instance.status = BotInstanceStatus.ERROR;
      instance.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await botInstanceRepository.save(instance);
      throw error;
    }
  }

  /**
   * Send a message to a bot and get response
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

    const instance = await botInstanceRepository.findOne({
      where: { botId, userId },
      relations: ['bot', 'bot.prompts']
    });

    if (!instance) {
      throw new Error('Bot instance not found');
    }

    if (instance.status !== BotInstanceStatus.RUNNING) {
      throw new Error('Bot is not running');
    }

    // Save user message
    const userMessage = chatMessageRepository.create({
      botInstanceId: instance.id,
      userId,
      role: MessageRole.USER,
      content: message
    });

    await chatMessageRepository.save(userMessage);

    // Process message and generate response
    const startTime = Date.now();
    const botResponse = await this.processMessage(instance, message);
    const responseTime = Date.now() - startTime;

    botResponse.responseTime = responseTime;
    await chatMessageRepository.save(botResponse);

    return { userMessage, botResponse };
  }

  /**
   * Get conversation history for a bot instance
   */
  static async getConversationHistory(botId: string, userId: string, limit = 50): Promise<ChatMessage[]> {
    // Validate UUIDs
    if (!isValidUUID(botId)) {
      throw new Error('Invalid bot ID format');
    }
    if (!isValidUUID(userId)) {
      throw new Error('Invalid user ID format');
    }

    const instance = await botInstanceRepository.findOne({
      where: { botId, userId }
    });

    if (!instance) {
      throw new Error('Bot instance not found');
    }

    return chatMessageRepository.find({
      where: { botInstanceId: instance.id },
      order: { createdAt: 'ASC' },
      take: limit
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

    return botInstanceRepository.findOne({
      where: { botId, userId }
    });
  }

  /**
   * Process a message and generate bot response
   */
  private static async processMessage(instance: BotInstance, message: string): Promise<ChatMessage> {
    // Get the bot's prompts
    const bot = await botRepository.findOne({
      where: { id: instance.botId },
      relations: ['prompts', 'prompts.versions']
    });

    if (!bot || !bot.prompts.length) {
      throw new Error('Bot has no prompts configured');
    }

    // Build context from prompts
    const promptContext = bot.prompts
      .map(prompt => {
        const activeVersion = prompt.versions?.find(v => v.isActive);
        return activeVersion ? activeVersion.content : '';
      })
      .filter(content => content.length > 0)
      .join('\n\n');

    // Get recent conversation history for context
    const recentMessages = await chatMessageRepository.find({
      where: { botInstanceId: instance.id },
      order: { createdAt: 'DESC' },
      take: 10
    });

    const conversationHistory = recentMessages
      .reverse()
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    // Generate response using prompt context and conversation history
    try {
      const geminiResult = await this.geminiService.generateResponse(
        promptContext,
        conversationHistory,
        message
      );

      return chatMessageRepository.create({
        botInstanceId: instance.id,
        userId: instance.userId,
        role: MessageRole.BOT,
        content: geminiResult.response,
        tokensUsed: geminiResult.tokensUsed
      });
    } catch (error) {
      console.error('Failed to generate bot response:', error);
      // Fallback response
      const fallbackResponse = 'I apologize, but I encountered an error processing your request. Please try again.';
      return chatMessageRepository.create({
        botInstanceId: instance.id,
        userId: instance.userId,
        role: MessageRole.BOT,
        content: fallbackResponse,
        tokensUsed: this.estimateTokenCount(fallbackResponse)
      });
    }
  }

  /**
   * Generate bot response using prompt context
   */
  private static async generateBotResponse(
    promptContext: string,
    conversationHistory: string,
    userMessage: string
  ): Promise<string> {
    try {
      const result = await this.geminiService.generateResponse(
        promptContext,
        conversationHistory,
        userMessage
      );
      return result.response;
    } catch (error) {
      console.error('Failed to generate bot response:', error);
      return 'I apologize, but I encountered an error processing your request. Please try again.';
    }
  }

  /**
   * Estimate token count for response
   */
  private static estimateTokenCount(text: string): number {
    // Simple estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
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
