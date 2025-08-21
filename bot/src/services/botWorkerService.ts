import { AppDataSource } from '../config/database.js';
import { consumeEvent, publishEvent } from '../config/redis.js';
import { BotInstance, BotInstanceStatus } from '../entities/BotInstance.js';
import { ChatMessage, MessageRole } from '../entities/ChatMessage.js';
import { Bot } from '../entities/Bot.js';
import { BotTool } from '../entities/BotTool.js';
import { AIModel } from '../entities/AIModel.js';
import { LLMServiceFactory } from './llmServiceFactory.js';
import { ToolExecutionService } from './toolExecutionService.js';
import { IntentDetectionService } from './intentDetectionService.js';

const botInstanceRepository = AppDataSource.getRepository(BotInstance);
const chatMessageRepository = AppDataSource.getRepository(ChatMessage);
const botRepository = AppDataSource.getRepository(Bot);
const botToolRepository = AppDataSource.getRepository(BotTool);

export const startBotWorker = async (): Promise<void> => {
  console.log('🤖 Starting bot processing worker...');

  // Start listening to bot message queues
  setInterval(async () => {
    await processBotMessages();
  }, 1000);

  console.log('✅ Bot worker started, listening for bot messages...');
};

const processBotMessages = async (): Promise<void> => {
  try {
    const job = await consumeEvent('bot_messages');

    if (job) {
      console.log('📨 Processing bot message job:', job);

      const { botId, userId, message, instanceId } = job;

      if (botId && userId && message) {
        await processBotMessage(botId, userId, message, instanceId);
      }
    }
  } catch (error) {
    console.error('❌ Error processing bot message job:', error);
  }
};

const processBotMessage = async (
  botId: string,
  userId: string,
  message: string,
  instanceId?: string
): Promise<void> => {
  try {
    console.log(`🤖 Processing message for bot ${botId}: "${message}"`);

    // Get or create bot instance
    let instance: BotInstance | null = null;
    if (instanceId) {
      instance = await botInstanceRepository.findOne({
        where: { id: instanceId }
      });
    }

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

    // Get bot with prompts, tools, and AI model
    const bot = await botRepository.findOne({
      where: { id: botId },
      relations: ['prompts', 'prompts.versions', 'tools', 'aiModel']
    });

    if (!bot) {
      throw new Error('Bot not found');
    }

    if (!bot.prompts.length) {
      throw new Error('Bot has no prompts configured');
    }

    // Debug: Check if AI model is loaded
    console.log(`🔍 Bot AI model check:`, {
      botId: bot.id,
      botName: bot.name,
      aiModelId: bot.aiModelId,
      aiModel: bot.aiModel ? {
        id: bot.aiModel.id,
        name: bot.aiModel.name,
        provider: bot.aiModel.provider,
        baseUrl: bot.aiModel.baseUrl
      } : null
    });

    // Save user message
    const userMessage = chatMessageRepository.create({
      botInstanceId: instance.id,
      userId,
      role: MessageRole.USER,
      content: message
    });
    await chatMessageRepository.save(userMessage);

    // Process the message
    const botResponse = await processMessage(instance, message, bot);

    // Save bot response
    await chatMessageRepository.save(botResponse);

    // Publish response event for real-time updates
    await publishEvent('bot_responses', {
      instanceId: instance.id,
      botId,
      userId,
      userMessage: userMessage,
      botResponse: botResponse
    });

    console.log(`✅ Bot message processed successfully for bot ${botId}`);
  } catch (error) {
    console.error(`❌ Error processing bot message for bot ${botId}:`, error);

    // Publish error event
    await publishEvent('bot_errors', {
      botId,
      userId,
      instanceId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

const processMessage = async (
  instance: BotInstance,
  message: string,
  bot: Bot
): Promise<ChatMessage> => {
  console.log(`🤔 Processing message: "${message}"`);

  // Build context from prompts
  const promptContext = buildPromptContext(bot);

  // Check if message contains tool calls
  const toolCalls = await detectToolCalls(message, bot.tools, instance, bot);

  let toolResults = '';
  let thoughts = '';

  if (toolCalls.length > 0) {
    console.log(`🔧 Found ${toolCalls.length} tool calls to execute`);
    thoughts += `I detected ${toolCalls.length} tool(s) that I can use to help you:\n`;

    for (const { tool, params } of toolCalls) {
      thoughts += `- ${tool.displayName}: ${tool.description}\n`;
    }

    toolResults = await executeToolCalls(toolCalls, instance);
    thoughts += `\nTool execution results:\n${toolResults}\n`;
  } else {
    thoughts += "I'll respond based on my knowledge and the conversation context.\n";
  }

  // Get conversation history
  const conversationHistory = await getConversationHistoryForContext(instance.id);

  // Generate response with tool results
  const enhancedContext = toolResults
    ? `${promptContext}\n\nTool Results:\n${toolResults}`
    : promptContext;

  try {
    // Use the bot's AI model if available, otherwise fall back to default
    let aiModel = bot.aiModel;

    if (!aiModel) {
      // Get the default AI model for the user
      const aiModelRepository = AppDataSource.getRepository(AIModel);
      aiModel = await aiModelRepository.findOne({
        where: { userId: instance.userId, isDefault: true, isActive: true }
      });

      if (!aiModel) {
        throw new Error('No AI model configured for this bot');
      }
    }

    console.log(`🤖 Using AI model: ${aiModel.name} (${aiModel.provider}) - Base URL: ${aiModel.baseUrl}`);

    // Generate response using the LLMServiceFactory
    const llmResponse = await LLMServiceFactory.generateResponse(
      aiModel,
      message,
      enhancedContext,
      0.7, // temperature
      1000 // maxTokens
    );

    // Combine thoughts with the response
    const fullResponse = thoughts + '\n' + llmResponse.content;

    return chatMessageRepository.create({
      botInstanceId: instance.id,
      userId: instance.userId,
      role: MessageRole.BOT,
      content: fullResponse,
      tokensUsed: llmResponse.usage?.total_tokens || estimateTokenCount(fullResponse)
    });
  } catch (error) {
    console.error('Failed to generate bot response:', error);
    // Fallback response
    const fallbackResponse = thoughts + '\nI apologize, but I encountered an error processing your request. Please try again.';
    return chatMessageRepository.create({
      botInstanceId: instance.id,
      userId: instance.userId,
      role: MessageRole.BOT,
      content: fallbackResponse,
      tokensUsed: estimateTokenCount(fallbackResponse)
    });
  }
};

const buildPromptContext = (bot: Bot): string => {
  return bot.prompts
    .map(prompt => {
      const activeVersion = prompt.versions?.find(v => v.isActive);
      return activeVersion ? activeVersion.content : '';
    })
    .filter(content => content.length > 0)
    .join('\n\n');
};

const detectToolCalls = async (
  message: string,
  tools: BotTool[],
  instance: BotInstance,
  bot: Bot
): Promise<Array<{tool: BotTool, params: Record<string, any>}>> => {
  const intentDetectionService = new IntentDetectionService();

  try {
    console.log(`🔍 Using LLM to detect intent for message: "${message}"`);
    const toolCalls = await intentDetectionService.detectToolCalls(message, tools, instance.userId, bot.aiModel);

    console.log(`🔧 LLM detected ${toolCalls.length} tool call(s)`);
    for (const toolCall of toolCalls) {
      console.log(`📝 Tool: ${toolCall.tool.name}, Operation: ${toolCall.params.operation}, Params:`, JSON.stringify(toolCall.params));
    }

    return toolCalls;
  } catch (error) {
    console.error('❌ Error detecting tool calls with LLM:', error);
    return [];
  }
};

const executeToolCalls = async (
  toolCalls: Array<{tool: BotTool, params: Record<string, any>}>,
  instance: BotInstance
): Promise<string> => {
  const results = [];

  for (const { tool, params } of toolCalls) {
    try {
      console.log(`🔧 Executing tool: ${tool.displayName} with params:`, JSON.stringify(params));
      const result = await ToolExecutionService.executeTool(tool, params);

      if (result && typeof result === 'object' && result.success !== undefined) {
        if (result.success) {
          results.push(`✅ ${tool.displayName}: Successfully executed`);
          if (result.message) {
            results.push(`   Message: ${result.message}`);
          }
          const dataKey = Object.keys(result).find(key => key !== 'success' && key !== 'message');
          if (dataKey && result[dataKey]) {
            results.push(`   Data: ${JSON.stringify(result[dataKey])}`);
          }
        } else {
          results.push(`❌ ${tool.displayName}: Failed - ${result.message || 'Unknown error'}`);
        }
      } else {
        results.push(`✅ ${tool.displayName}: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      console.error(`❌ Error executing tool ${tool.displayName}:`, error);
      results.push(`❌ ${tool.displayName}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return results.join('\n');
};



const getConversationHistoryForContext = async (instanceId: string): Promise<string> => {
  const recentMessages = await chatMessageRepository.find({
    where: { botInstanceId: instanceId },
    order: { createdAt: 'DESC' },
    take: 10
  });

  return recentMessages
    .reverse()
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');
};

const estimateTokenCount = (text: string): number => {
  // Simple estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
};
