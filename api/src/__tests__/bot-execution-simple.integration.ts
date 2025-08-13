import request from 'supertest';
import { AppDataSource } from '../config/database.js';
import { Bot } from '../entities/Bot.js';
import { BotInstance } from '../entities/BotInstance.js';

const API_BASE_URL = process.env.API_URL || 'http://localhost:4001';

describe('Simple Bot Execution Test', () => {
  let testUserId: string;
  let authToken: string;
  let codeBuilderBotId: string;

  beforeAll(async () => {
    // Login to get auth token
    const loginRes = await request(API_BASE_URL)
      .post('/api/users/login')
      .send({ email: 'admin@platform.com', password: 'admin123' });
    authToken = loginRes.body.token;
    testUserId = loginRes.body.user.id;

    // Find the code-builder bot
    const botsRes = await request(API_BASE_URL)
      .get('/api/bots')
      .set('Authorization', `Bearer ${authToken}`);

    if (botsRes.status === 200) {
      const codeBuilderBot = botsRes.body.find((bot: any) => bot.name === 'code-builder');
      if (codeBuilderBot) {
        codeBuilderBotId = codeBuilderBot.id;
        console.log('Found code-builder bot:', codeBuilderBotId);
      }
    }
  });

  it('should start and stop a bot instance', async () => {
    if (!codeBuilderBotId) {
      console.log('Skipping test - code-builder bot not found');
      return;
    }

    // First, try to stop any existing bot instance
    try {
      await request(API_BASE_URL)
        .post(`/api/bot-execution/${codeBuilderBotId}/stop`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: testUserId });
      console.log('Stopped existing bot instance');
    } catch (error) {
      console.log('No existing bot instance to stop');
    }

    // Small delay to ensure stop operation completes
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Start the bot
    const startBotRes = await request(API_BASE_URL)
      .post(`/api/bot-execution/${codeBuilderBotId}/start`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ userId: testUserId })
      .expect(200);

    expect(startBotRes.body.status).toBe('running');
    console.log('Started bot:', startBotRes.body);

    // Stop the bot
    const stopBotRes = await request(API_BASE_URL)
      .post(`/api/bot-execution/${codeBuilderBotId}/stop`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ userId: testUserId })
      .expect(200);

    expect(stopBotRes.body.status).toBe('stopped');
    console.log('Stopped bot:', stopBotRes.body);
  }, 10000);
});
