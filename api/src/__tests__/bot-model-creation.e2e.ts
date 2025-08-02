import request from 'supertest';
import axios from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://localhost:4000';
const WEBAPP_BASE_URL = process.env.WEBAPP_URL || 'http://localhost:3000';

describe('Bot Model Creation End-to-End Test', () => {
  let authToken: string;
  let testUserId: string;
  let metaPlatformBotId: string;
  let createdModelId: string;

  beforeAll(async () => {
    // Step 1: Login to get auth token
    const loginRes = await request(API_BASE_URL)
      .post('/api/users/login')
      .send({ email: 'admin@platform.com', password: 'admin123' });
    
    authToken = loginRes.body.token;
    testUserId = loginRes.body.user.id;

    // Step 2: Find the meta-platform-support bot
    const botsRes = await request(API_BASE_URL)
      .get('/api/bots')
      .set('Authorization', `Bearer ${authToken}`);

    const metaPlatformBot = botsRes.body.find((bot: any) => bot.name === 'meta-platform-support');
    if (!metaPlatformBot) {
      throw new Error('Meta Platform Support bot not found');
    }
    metaPlatformBotId = metaPlatformBot.id;
  });

  test('should create a model through bot chat and verify it exists', async () => {
    // Step 3: Start the bot instance (or get existing one)
    try {
      const startBotRes = await request(API_BASE_URL)
        .post(`/api/bot-execution/${metaPlatformBotId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: testUserId });
      
      console.log('✅ Bot instance started or already running');
    } catch (error) {
      // Bot might already be running, that's okay
      console.log('ℹ️ Bot instance already running, continuing...');
    }

    // Step 4: Send a message to create a model
    const modelName = `TestModel_${Date.now()}`;
    const createModelMessage = `create a new model called ${modelName} with name (string) and age (number)`;

    const chatRes = await request(API_BASE_URL)
      .post(`/api/bot-execution/${metaPlatformBotId}/chat`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ 
        userId: testUserId, 
        message: createModelMessage 
      })
      .expect(200);

    console.log('✅ Chat message sent');
    console.log('Initial bot response:', chatRes.body.botResponse.content);

    // Step 5: Poll for the final bot response
    let finalBotResponse = chatRes.body.botResponse;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts && finalBotResponse.content === 'Processing your message...') {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      attempts++;
      
      // Get the updated conversation
      const conversationRes = await request(API_BASE_URL)
        .get(`/api/bot-execution/${metaPlatformBotId}/chat?userId=${testUserId}&limit=10`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Find the latest bot response
      const botMessages = conversationRes.body.filter((msg: any) => msg.role === 'bot');
      if (botMessages.length > 0) {
        finalBotResponse = botMessages[botMessages.length - 1];
      }
      
      console.log(`Poll attempt ${attempts}: ${finalBotResponse.content.substring(0, 50)}...`);
    }
    
    console.log('Final bot response:', finalBotResponse.content);

    // Step 6: Verify the model was actually created in the database
    const modelsRes = await request(API_BASE_URL)
      .get('/api/models')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const createdModel = modelsRes.body.find((model: any) => model.name === modelName);
    
    if (createdModel) {
      createdModelId = createdModel.id;
      console.log('✅ Model found in database:', createdModel);
    } else {
      console.log('❌ Model not found in database');
      console.log('Available models:', modelsRes.body.map((m: any) => m.name));
    }

    // Step 7: Check if the model exists in the webapp (simulate navigation)
    try {
      const webappModelsRes = await axios.get(`${WEBAPP_BASE_URL}/api/models`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const webappModel = webappModelsRes.data.find((model: any) => model.name === modelName);
      
      if (webappModel) {
        console.log('✅ Model found in webapp:', webappModel);
      } else {
        console.log('❌ Model not found in webapp');
      }
    } catch (error) {
      console.log('⚠️ Could not check webapp (might not be running):', error instanceof Error ? error.message : 'Unknown error');
    }

    // Assertions
    expect(chatRes.body.userMessage).toBeDefined();
    expect(finalBotResponse).toBeDefined();
    expect(finalBotResponse.content).toContain('successfully created');
    
    // The model should actually exist in the database
    expect(createdModel).toBeDefined();
    expect(createdModel.name).toBe(modelName);
    expect(createdModel.schema).toBeDefined();
    expect(createdModel.schema.fields).toBeDefined();
    expect(createdModel.schema.fields.length).toBeGreaterThan(0);
  }, 30000);

  afterAll(async () => {
    // Cleanup: Delete the test model if it was created
    if (createdModelId) {
      try {
        await request(API_BASE_URL)
          .delete(`/api/models/${createdModelId}`)
          .set('Authorization', `Bearer ${authToken}`);
        console.log('✅ Test model cleaned up');
      } catch (error) {
        console.log('⚠️ Could not cleanup test model:', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  });
}); 