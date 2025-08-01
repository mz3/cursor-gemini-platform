import { AppDataSource } from '../config/database.js';
import { BotInstance, BotInstanceStatus } from '../entities/BotInstance.js';
import { ChatMessage, MessageRole } from '../entities/ChatMessage.js';
import { Bot } from '../entities/Bot.js';
import { Prompt } from '../entities/Prompt.js';
import { PromptVersion } from '../entities/PromptVersion.js';
import { BotTool } from '../entities/BotTool.js';
import { GeminiService } from './geminiService.js';
import { ToolExecutionService } from './toolExecutionService.js';

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
    // Get the bot with prompts and tools
    const bot = await botRepository.findOne({
      where: { id: instance.botId },
      relations: ['prompts', 'prompts.versions', 'tools']
    });

    if (!bot) {
      throw new Error('Bot not found');
    }

    if (!bot.prompts.length) {
      throw new Error('Bot has no prompts configured');
    }

    // Build context from prompts
    const promptContext = this.buildPromptContext(bot);

    // Check if message contains tool calls
    const toolCalls = this.detectToolCalls(message, bot.tools);

    let toolResults = '';
    if (toolCalls.length > 0) {
      toolResults = await this.executeToolCalls(toolCalls, instance);
    }

    // Get conversation history
    const conversationHistory = await this.getConversationHistoryForContext(instance.id);

    // Generate response with tool results
    const enhancedContext = toolResults
      ? `${promptContext}\n\nTool Results:\n${toolResults}`
      : promptContext;

    try {
      const geminiResult = await this.geminiService.generateResponse(
        enhancedContext,
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
   * Build prompt context from bot prompts
   */
  private static buildPromptContext(bot: Bot): string {
    return bot.prompts
      .map(prompt => {
        const activeVersion = prompt.versions?.find(v => v.isActive);
        return activeVersion ? activeVersion.content : '';
      })
      .filter(content => content.length > 0)
      .join('\n\n');
  }

  /**
   * Detect tool calls in user message
   */
  private static detectToolCalls(message: string, tools: BotTool[]): Array<{tool: BotTool, params: Record<string, any>}> {
    const toolCalls = [];
    const lowerMessage = message.toLowerCase();

    for (const tool of tools) {
      if (!tool.isActive) continue;

      // More flexible pattern matching
      const toolNamePattern = new RegExp(`\\b${tool.name}\\b`, 'i');
      const toolTypePattern = new RegExp(`\\b${tool.type.replace('_', ' ')}\\b`, 'i');
      const toolDisplayPattern = new RegExp(`\\b${tool.displayName.toLowerCase()}\\b`, 'i');

      // Check for tool name, type, or display name
      if (toolNamePattern.test(message) ||
          toolTypePattern.test(message) ||
          toolDisplayPattern.test(lowerMessage) ||
          (tool.type === 'shell_command' && (lowerMessage.includes('shell') || lowerMessage.includes('command') || lowerMessage.includes('ping'))) ||
          (tool.type === 'http_request' && (lowerMessage.includes('http') || lowerMessage.includes('api') || lowerMessage.includes('request'))) ||
          (tool.type === 'file_operation' && (lowerMessage.includes('file') || lowerMessage.includes('read') || lowerMessage.includes('write'))) ||
          (tool.type === 'mcp_tool' && (lowerMessage.includes('mcp') || lowerMessage.includes('platform') || lowerMessage.includes('meta') || lowerMessage.includes('create') || lowerMessage.includes('bot')))) {

        console.log(`Tool detected: ${tool.name} (${tool.type})`);
        // Extract parameters from message
        const params = this.extractToolParams(message, tool);
        console.log(`Extracted params for ${tool.name}:`, JSON.stringify(params));
        toolCalls.push({ tool, params });
      }
    }

    return toolCalls;
  }

  /**
   * Execute tool calls and return results
   */
  private static async executeToolCalls(
    toolCalls: Array<{tool: BotTool, params: Record<string, any>}>,
    instance: BotInstance
  ): Promise<string> {
    const results = [];

    for (const { tool, params } of toolCalls) {
      try {
        const result = await ToolExecutionService.executeTool(tool, params);
        results.push(`${tool.displayName}: ${JSON.stringify(result)}`);
      } catch (error) {
        results.push(`${tool.displayName}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results.join('\n');
  }

  /**
   * Extract tool parameters from user message
   */
  private static extractToolParams(message: string, tool: BotTool): Record<string, any> {
    const params: Record<string, any> = {};

    // Extract common patterns like URLs, file paths, etc.
    const urlMatch = message.match(/https?:\/\/[^\s]+/);
    if (urlMatch) params.url = urlMatch[0];

    const fileMatch = message.match(/\/[\w\/.-]+/);
    if (fileMatch) params.path = fileMatch[0];

    // Extract quoted strings as parameters
    const quotedMatches = message.match(/"([^"]+)"/g);
    if (quotedMatches) {
      quotedMatches.forEach((match, index) => {
        params[`param${index + 1}`] = match.replace(/"/g, '');
      });
    }

    // For shell commands, extract the command from the message
    if (tool.type === 'shell_command') {
      // Look for common shell commands in the message
      const shellCommands = ['ping', 'ls', 'cat', 'echo', 'date', 'whoami', 'pwd'];
      for (const cmd of shellCommands) {
        if (message.toLowerCase().includes(cmd)) {
          // Extract the full command or domain/host
          const cmdMatch = message.match(new RegExp(`${cmd}\\s+([^\\s]+)`, 'i'));
          if (cmdMatch) {
            // For ping commands, extract host parameter
            if (cmd === 'ping') {
              params.host = cmdMatch[1];
            } else {
              params.command = `${cmd} ${cmdMatch[1]}`;
            }
          } else {
            if (cmd === 'ping') {
              // Default host for ping
              params.host = 'localhost';
            } else {
              params.command = cmd;
            }
          }
          break;
        }
      }
    }

        // For MCP tools, extract platform operations
    if (tool.type === 'mcp_tool') {
      const lowerMessage = message.toLowerCase();
      console.log(`Processing MCP tool for message: "${message}"`);

      // Detect common MCP operations
      if (lowerMessage.includes('create') && lowerMessage.includes('bot')) {
        console.log('Detected create_bot operation');
        params.operation = 'create_bot';
        // Extract bot name and description
        const nameMatch = message.match(/create\s+(?:a\s+)?bot\s+(?:called\s+)?["']?([^"'\s]+(?:-[^"'\s]+)*)["']?/i);
        console.log(`Regex test for name: "${message}" -> match:`, nameMatch);
        if (nameMatch) {
          params.name = nameMatch[1];
          console.log(`Extracted name: ${params.name}`);
        }

        const descMatch = message.match(/description[:\s]+["']?([^"']+)["']?/i);
        if (descMatch) {
          params.description = descMatch[1];
          console.log(`Extracted description: ${params.description}`);
        }

        // Set default displayName if not provided
        if (params.name && !params.displayName) {
          params.displayName = params.name.charAt(0).toUpperCase() + params.name.slice(1).replace(/-/g, ' ');
          console.log(`Set default displayName: ${params.displayName}`);
        }
      } else if (lowerMessage.includes('list') && lowerMessage.includes('bot')) {
        console.log('Detected list_bots operation');
        params.operation = 'list_bots';
      } else if (lowerMessage.includes('get') && lowerMessage.includes('bot')) {
        console.log('Detected get_bot operation');
        params.operation = 'get_bot';
        const idMatch = message.match(/bot\s+(?:id\s+)?["']?([^"'\s]+)["']?/i);
        if (idMatch) params.botId = idMatch[1];
      } else if (lowerMessage.includes('update') && lowerMessage.includes('bot')) {
        console.log('Detected update_bot operation');
        params.operation = 'update_bot';
        const idMatch = message.match(/bot\s+(?:id\s+)?["']?([^"'\s]+)["']?/i);
        if (idMatch) params.botId = idMatch[1];
      } else if (lowerMessage.includes('delete') && lowerMessage.includes('bot')) {
        console.log('Detected delete_bot operation');
        params.operation = 'delete_bot';
        const idMatch = message.match(/bot\s+(?:id\s+)?["']?([^"'\s]+)["']?/i);
        if (idMatch) params.botId = idMatch[1];
      } else if (lowerMessage.includes('execute') && lowerMessage.includes('bot')) {
        console.log('Detected execute_bot operation');
        params.operation = 'execute_bot';
        const idMatch = message.match(/bot\s+(?:id\s+)?["']?([^"'\s]+)["']?/i);
        if (idMatch) params.botId = idMatch[1];

        const msgMatch = message.match(/message[:\s]+["']?([^"']+)["']?/i);
        if (msgMatch) params.message = msgMatch[1];
      }
    }

    return params;
  }

  /**
   * Get conversation history for context
   */
  private static async getConversationHistoryForContext(instanceId: string): Promise<string> {
    const recentMessages = await chatMessageRepository.find({
      where: { botInstanceId: instanceId },
      order: { createdAt: 'DESC' },
      take: 10
    });

    return recentMessages
      .reverse()
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
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
