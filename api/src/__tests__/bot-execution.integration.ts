import request from 'supertest';
import { AppDataSource } from '../config/database.js';
import { Bot } from '../entities/Bot.js';
import { BotInstance } from '../entities/BotInstance.js';
import { ChatMessage } from '../entities/ChatMessage.js';

// Mock the bot worker processing to prevent actual Gemini API calls
jest.mock('../config/redis.ts', () => ({
  publishEvent: jest.fn().mockResolvedValue(undefined),
  consumeEvent: jest.fn().mockResolvedValue(null),
  getRedisClient: jest.fn().mockReturnValue({
    publish: jest.fn().mockResolvedValue(1),
    subscribe: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    off: jest.fn()
  })
}));

const API_BASE_URL = process.env.API_URL || 'http://localhost:4001';

describe('Bot Execution API Integration Tests', () => {
  let testUserId: string;
  let testBotId: string;
  let authToken: string;

  beforeAll(async () => {
    // Login to get auth token
    const loginRes = await request(API_BASE_URL)
      .post('/api/users/login')
      .send({ email: 'admin@platform.com', password: 'admin123' });
    authToken = loginRes.body.token;
    testUserId = loginRes.body.user.id;

    // Create a test bot for the user
    const botData = {
      name: 'test-bot',
      displayName: 'Test Bot',
      description: 'A test bot for integration testing',
      isActive: true,
      userId: testUserId
    };

    const botRes = await request(API_BASE_URL)
      .post('/api/bots')
      .set('Authorization', `Bearer ${authToken}`)
      .send(botData);

    if (botRes.status === 201) {
      testBotId = botRes.body.id;

      // Create a prompt for the test bot
      const promptData = {
        name: 'Test Prompt',
        content: 'You are a helpful AI assistant. Please respond to user messages in a friendly and helpful manner.',
        type: 'llm',
        description: 'A test prompt for the test bot'
      };

      const promptRes = await request(API_BASE_URL)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(promptData);

      if (promptRes.status === 201) {
        // Associate the prompt with the bot
        const associateRes = await request(API_BASE_URL)
          .post(`/api/bots/${testBotId}/prompts`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ promptIds: [promptRes.body.id] });

        if (associateRes.status === 200) {
          console.log('Successfully associated prompt with test bot');
        } else {
          console.log('Failed to associate prompt with bot:', associateRes.body);
        }
      }
    } else {
      // If bot creation fails, use a fallback UUID
      testBotId = '00000000-0000-0000-0000-000000000001';
    }

    // Log the test setup for debugging
    console.log('Test setup:', { testBotId, testUserId });
  });

  describe('POST /api/bot-execution/:botId/start', () => {
    it('should start a bot instance successfully', async () => {
      const response = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/start`)
        .send({ userId: testUserId })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('botId');
      expect(response.body).toHaveProperty('userId');
      expect(response.body.status).toBe('running');
      expect(response.body).toHaveProperty('lastStartedAt');
    });

    it('should return 400 when userId is missing', async () => {
      const response = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/start`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'userId is required');
    });

    it('should handle non-existent bot (mock behavior)', async () => {
      const fakeBotId = '00000000-0000-0000-0000-000000000000';
      const response = await request(API_BASE_URL)
        .post(`/api/bot-execution/${fakeBotId}/start`)
        .send({ userId: testUserId })
        .expect(500); // Expect 500 for non-existent bot

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/bot-execution/:botId/stop', () => {
    it('should stop a bot instance successfully', async () => {
      const response = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/stop`)
        .send({ userId: testUserId })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('botId');
      expect(response.body).toHaveProperty('userId');
      expect(response.body.status).toBe('stopped');
      expect(response.body).toHaveProperty('lastStoppedAt');
    });

    it('should return 400 when userId is missing', async () => {
      const response = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/stop`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'userId is required');
    });
  });

  describe('GET /api/bot-execution/:botId/status', () => {
    it('should return bot instance status', async () => {
      const response = await request(API_BASE_URL)
        .get(`/api/bot-execution/${testBotId}/status?userId=${testUserId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('botId');
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('status');
    });

    it('should return 400 when userId is missing', async () => {
      const response = await request(API_BASE_URL)
        .get(`/api/bot-execution/${testBotId}/status`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'userId is required');
    });

    it('should return status for non-existent instance (mock behavior)', async () => {
      const fakeBotId = '00000000-0000-0000-0000-000000000000';
      const response = await request(API_BASE_URL)
        .get(`/api/bot-execution/${fakeBotId}/status?userId=${testUserId}`)
        .expect(500); // Expect 500 for non-existent bot

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/bot-execution/:botId/chat', () => {
    it('should send a message and receive bot response', async () => {
      // First start the bot
      await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/start`)
        .send({ userId: testUserId })
        .expect(200);

      const testMessage = 'Hello, bot!';
      const response = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/chat`)
        .send({ userId: testUserId, message: testMessage })
        .expect(200);

      expect(response.body).toHaveProperty('userMessage');
      expect(response.body).toHaveProperty('botResponse');
      expect(response.body.userMessage).toHaveProperty('content', testMessage);
      expect(response.body.botResponse).toHaveProperty('content');
      expect(response.body.botResponse).toHaveProperty('tokensUsed');
      expect(typeof response.body.botResponse.tokensUsed).toBe('number');
      // Note: tokensUsed is mocked to prevent actual Gemini API calls
      expect(response.body.botResponse.tokensUsed).toBeGreaterThanOrEqual(0);
      expect(response.body.botResponse.content).toBe('Processing your message...');
    });

    it('should return 400 when userId is missing', async () => {
      const response = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/chat`)
        .send({ message: 'Hello' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'userId is required');
    });

    it('should return 400 when message is missing', async () => {
      const response = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/chat`)
        .send({ userId: testUserId })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'message is required');
    });
  });

  describe('GET /api/bot-execution/:botId/chat', () => {
    it('should return conversation history', async () => {
      const response = await request(API_BASE_URL)
        .get(`/api/bot-execution/${testBotId}/chat?userId=${testUserId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 400 when userId is missing', async () => {
      const response = await request(API_BASE_URL)
        .get(`/api/bot-execution/${testBotId}/chat`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'userId is required');
    });

    it('should accept limit parameter', async () => {
      const response = await request(API_BASE_URL)
        .get(`/api/bot-execution/${testBotId}/chat?userId=${testUserId}&limit=10`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Complete Bot Workflow', () => {
    it('should handle complete bot lifecycle: start -> chat -> stop', async () => {
      // First stop the bot if it's running
      try {
        await request(API_BASE_URL)
          .post(`/api/bot-execution/${testBotId}/stop`)
          .send({ userId: testUserId });
      } catch (error) {
        // Bot might not be running, which is fine
      }

      // Step 1: Start bot
      const startResponse = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/start`)
        .send({ userId: testUserId })
        .expect(200);

      expect(startResponse.body.status).toBe('running');

      // Step 2: Send a message
      const chatResponse = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/chat`)
        .send({ userId: testUserId, message: 'Hello, how are you?' })
        .expect(200);

      expect(chatResponse.body.userMessage.content).toBe('Hello, how are you?');
      expect(chatResponse.body.botResponse.content).toBeDefined();
      expect(chatResponse.body.botResponse.content.length).toBeGreaterThan(0);
      // Note: tokensUsed is mocked to prevent actual Gemini API calls
      expect(chatResponse.body.botResponse.tokensUsed).toBeGreaterThanOrEqual(0);
      expect(chatResponse.body.botResponse.content).toBe('Processing your message...');

      // Step 3: Get conversation history
      const historyResponse = await request(API_BASE_URL)
        .get(`/api/bot-execution/${testBotId}/chat?userId=${testUserId}`)
        .expect(200);

      expect(Array.isArray(historyResponse.body)).toBe(true);
      expect(historyResponse.body.length).toBeGreaterThan(0);

      // Step 4: Stop bot
      const stopResponse = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/stop`)
        .send({ userId: testUserId })
        .expect(200);

      expect(stopResponse.body.status).toBe('stopped');
    });

    it('should handle multiple messages in conversation', async () => {
      // First stop the bot if it's running
      try {
        await request(API_BASE_URL)
          .post(`/api/bot-execution/${testBotId}/stop`)
          .send({ userId: testUserId });
      } catch (error) {
        // Bot might not be running, which is fine
      }

      // Start bot
      await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/start`)
        .send({ userId: testUserId })
        .expect(200);

      // Send multiple messages
      const messages = [
        'What is the weather like?',
        'Can you help me with coding?',
        'Tell me a joke'
      ];

      for (const message of messages) {
        const response = await request(API_BASE_URL)
          .post(`/api/bot-execution/${testBotId}/chat`)
          .send({ userId: testUserId, message })
          .expect(200);

        expect(response.body.userMessage.content).toBe(message);
        expect(response.body.botResponse.content).toBeDefined();
        expect(response.body.botResponse.content.length).toBeGreaterThan(0);
        // Note: tokensUsed is mocked to prevent actual Gemini API calls
        expect(response.body.botResponse.tokensUsed).toBeGreaterThanOrEqual(0);
        expect(response.body.botResponse.content).toBe('Processing your message...');
      }

      // Stop bot
      await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/stop`)
        .send({ userId: testUserId })
        .expect(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid bot ID format (mock behavior)', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/bot-execution/invalid-id/start')
        .send({ userId: testUserId })
        .expect(500); // Expect 500 for invalid UUID format

      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid user ID format (mock behavior)', async () => {
      const response = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/start`)
        .send({ userId: 'invalid-user-id' })
        .expect(500); // Expect 500 for invalid UUID format

      expect(response.body).toHaveProperty('error');
    });

    it('should handle very long messages', async () => {
      // First stop the bot if it's running
      try {
        await request(API_BASE_URL)
          .post(`/api/bot-execution/${testBotId}/stop`)
          .send({ userId: testUserId });
      } catch (error) {
        // Bot might not be running, which is fine
      }

      // Start bot first
      await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/start`)
        .send({ userId: testUserId })
        .expect(200);

      const longMessage = 'A'.repeat(10000);
      const response = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/chat`)
        .send({ userId: testUserId, message: longMessage })
        .expect(200);

      expect(response.body.userMessage.content).toBe(longMessage);
    });
  });
});
