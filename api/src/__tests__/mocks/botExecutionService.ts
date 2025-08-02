// Mock BotExecutionService for integration tests
export class BotExecutionService {
  static async startBotInstance(botId: string, userId: string) {
    return {
      id: 'mock-instance-id',
      botId,
      userId,
      status: 'running',
      lastStartedAt: new Date(),
      lastStoppedAt: null,
      errorMessage: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static async stopBotInstance(botId: string, userId: string) {
    return {
      id: 'mock-instance-id',
      botId,
      userId,
      status: 'stopped',
      lastStartedAt: new Date(),
      lastStoppedAt: new Date(),
      errorMessage: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static async sendMessage(botId: string, userId: string, message: string) {
    return {
      userMessage: {
        id: 'mock-user-message-id',
        botInstanceId: 'mock-instance-id',
        userId,
        role: 'user',
        content: message,
        tokensUsed: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      botResponse: {
        id: 'mock-bot-response-id',
        botInstanceId: 'mock-instance-id',
        userId,
        role: 'bot',
        content: 'This is a mock response from the integration test. I am a helpful AI assistant and I understand your message.',
        tokensUsed: 25,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
  }

  static async getConversationHistory(botId: string, userId: string, limit = 50) {
    return [];
  }

  static async getBotInstanceStatus(botId: string, userId: string) {
    return {
      id: 'mock-instance-id',
      botId,
      userId,
      status: 'running',
      lastStartedAt: new Date(),
      lastStoppedAt: null,
      errorMessage: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
} 