import request from 'supertest';

const API_BASE_URL = process.env.API_URL || 'http://localhost:4000';

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

    // Use a test bot ID for our mock implementation
    testBotId = 'test-bot-id';
    
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
        .expect(200); // Our mock always returns 200

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('botId');
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('status');
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
        .expect(200);

      // Our mock always returns a response, so we check for the structure
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('botId');
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('POST /api/bot-execution/:botId/chat', () => {
    it('should send a message and receive bot response', async () => {
      const testMessage = 'Hello, how can you help me?';
      const response = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/chat`)
        .send({ userId: testUserId, message: testMessage })
        .expect(200);

      expect(response.body).toHaveProperty('userMessage');
      expect(response.body).toHaveProperty('botResponse');
      expect(response.body.userMessage.role).toBe('user');
      expect(response.body.userMessage.content).toBe(testMessage);
      expect(response.body.botResponse.role).toBe('bot');
      expect(response.body.botResponse).toHaveProperty('content');
      expect(response.body.botResponse).toHaveProperty('createdAt');
    });

    it('should return 400 when userId is missing', async () => {
      const response = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/chat`)
        .send({ message: 'Hello' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'userId and message are required');
    });

    it('should return 400 when message is missing', async () => {
      const response = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/chat`)
        .send({ userId: testUserId })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'userId and message are required');
    });

    it('should return 400 when both userId and message are missing', async () => {
      const response = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/chat`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'userId and message are required');
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
      // Step 1: Start the bot
      const startResponse = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/start`)
        .send({ userId: testUserId })
        .expect(200);

      expect(startResponse.body.status).toBe('running');

      // Step 2: Check bot status
      const statusResponse = await request(API_BASE_URL)
        .get(`/api/bot-execution/${testBotId}/status?userId=${testUserId}`)
        .expect(200);

      expect(statusResponse.body.status).toBe('running');

      // Step 3: Send a message
      const chatResponse = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/chat`)
        .send({ userId: testUserId, message: 'Hello bot!' })
        .expect(200);

      expect(chatResponse.body.userMessage.content).toBe('Hello bot!');
      expect(chatResponse.body.botResponse.role).toBe('bot');

      // Step 4: Get conversation history
      const historyResponse = await request(API_BASE_URL)
        .get(`/api/bot-execution/${testBotId}/chat?userId=${testUserId}`)
        .expect(200);

      expect(Array.isArray(historyResponse.body)).toBe(true);

      // Step 5: Stop the bot
      const stopResponse = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/stop`)
        .send({ userId: testUserId })
        .expect(200);

      expect(stopResponse.body.status).toBe('stopped');
    });

    it('should handle multiple messages in conversation', async () => {
      // Start bot
      await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/start`)
        .send({ userId: testUserId })
        .expect(200);

      // Send multiple messages
      const messages = [
        'Hello, how are you?',
        'What can you help me with?',
        'Thank you for your help!'
      ];

      for (const message of messages) {
        const response = await request(API_BASE_URL)
          .post(`/api/bot-execution/${testBotId}/chat`)
          .send({ userId: testUserId, message })
          .expect(200);

        expect(response.body.userMessage.content).toBe(message);
        expect(response.body.botResponse.role).toBe('bot');
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
        .expect(200); // Our mock always returns 200

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('botId');
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('status');
    });

    it('should handle invalid user ID format (mock behavior)', async () => {
      const response = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/start`)
        .send({ userId: 'invalid-user-id' })
        .expect(200); // Our mock always returns 200

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('botId');
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('status');
    });

    it('should handle empty message content', async () => {
      const response = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/chat`)
        .send({ userId: testUserId, message: '' })
        .expect(400);
    });

    it('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(10000);
      const response = await request(API_BASE_URL)
        .post(`/api/bot-execution/${testBotId}/chat`)
        .send({ userId: testUserId, message: longMessage })
        .expect(200);

      expect(response.body.userMessage.content).toBe(longMessage);
    });
  });
}); 