import { AppDataSource } from '../config/database';
import { consumeEvent, publishEvent } from '../config/redis';
import { BotInstance, BotInstanceStatus } from '../entities/BotInstance';
import { ChatMessage, MessageRole } from '../entities/ChatMessage';
import { Bot } from '../entities/Bot';
import { BotTool } from '../entities/BotTool';
import { GeminiService } from './geminiService';
import { ToolExecutionService } from './toolExecutionService';

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

    // Get bot with prompts and tools
    const bot = await botRepository.findOne({
      where: { id: botId },
      relations: ['prompts', 'prompts.versions', 'tools']
    });

    if (!bot) {
      throw new Error('Bot not found');
    }

    if (!bot.prompts.length) {
      throw new Error('Bot has no prompts configured');
    }

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
  // Build context from prompts
  const promptContext = buildPromptContext(bot);

  // Check if message contains tool calls
  const toolCalls = detectToolCalls(message, bot.tools, instance);

  let toolResults = '';
  if (toolCalls.length > 0) {
    toolResults = await executeToolCalls(toolCalls, instance);
  }

  // Get conversation history
  const conversationHistory = await getConversationHistoryForContext(instance.id);

  // Generate response with tool results
  const enhancedContext = toolResults
    ? `${promptContext}\n\nTool Results:\n${toolResults}`
    : promptContext;

  try {
    const geminiService = new GeminiService();
    const geminiResult = await geminiService.generateResponse(
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

const detectToolCalls = (
  message: string, 
  tools: BotTool[], 
  instance: BotInstance
): Array<{tool: BotTool, params: Record<string, any>}> => {
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
        (tool.type === 'mcp_tool' && (lowerMessage.includes('mcp') || lowerMessage.includes('platform') || lowerMessage.includes('meta') || lowerMessage.includes('create') || lowerMessage.includes('bot') || lowerMessage.includes('list') || lowerMessage.includes('get') || lowerMessage.includes('show') || lowerMessage.includes('find') || lowerMessage.includes('search')))) {

      console.log(`🔧 Tool detected: ${tool.name} (${tool.type})`);
      // Extract parameters from message
      const params = extractToolParams(message, tool, instance.userId);
      console.log(`📝 Extracted params for ${tool.name}:`, JSON.stringify(params));
      toolCalls.push({ tool, params });
    }
  }

  return toolCalls;
};

const executeToolCalls = async (
  toolCalls: Array<{tool: BotTool, params: Record<string, any>}>,
  instance: BotInstance
): Promise<string> => {
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
};

const extractToolParams = (message: string, tool: BotTool, userId?: string): Record<string, any> => {
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

  // For MCP tools, extract platform operations
  if (tool.type === 'mcp_tool') {
    const lowerMessage = message.toLowerCase();
    console.log(`🔍 Processing MCP tool for message: "${message}"`);

    // Detect common MCP operations
    if (lowerMessage.includes('list') && lowerMessage.includes('model')) {
      console.log('📋 Detected list_models operation');
      params.operation = 'list_models';
      params.userId = userId;
    } else if (lowerMessage.includes('list') && lowerMessage.includes('application')) {
      console.log('📋 Detected list_applications operation');
      params.operation = 'list_applications';
      params.userId = userId;
    } else if (lowerMessage.includes('list') && lowerMessage.includes('prompt')) {
      console.log('📋 Detected list_prompts operation');
      params.operation = 'list_prompts';
      params.userId = userId;
    } else if (lowerMessage.includes('list') && lowerMessage.includes('tool')) {
      console.log('📋 Detected list_tools operation');
      params.operation = 'list_tools';
      params.userId = userId;
    } else if (lowerMessage.includes('list') && lowerMessage.includes('feature')) {
      console.log('📋 Detected list_features operation');
      params.operation = 'list_features';
      params.userId = userId;
    } else if (lowerMessage.includes('list') && lowerMessage.includes('workflow')) {
      console.log('📋 Detected list_workflows operation');
      params.operation = 'list_workflows';
      params.userId = userId;
    } else if (lowerMessage.includes('get') && lowerMessage.includes('user')) {
      console.log('📋 Detected get_user_info operation');
      params.operation = 'get_user_info';
      params.userId = userId;
    } else if (lowerMessage.includes('list') && lowerMessage.includes('user') && lowerMessage.includes('data')) {
      console.log('📋 Detected list_user_data operation');
      params.operation = 'list_user_data';
      params.userId = userId;
    } else if (lowerMessage.includes('search')) {
      console.log('📋 Detected search_platform operation');
      params.operation = 'search_platform';
      params.userId = userId;
      // Extract search query
      const queryMatch = message.match(/search\s+(?:for\s+)?["']?([^"']+)["']?/i);
      if (queryMatch) params.query = queryMatch[1];
    }
  }

  return params;
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