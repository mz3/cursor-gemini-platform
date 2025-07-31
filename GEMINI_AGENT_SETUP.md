# 🤖 Gemini LLM Integration - Agent Setup Guide

## 🎯 **Task Overview**
Replace mock bot responses with real Google Gemini 2.5 Flash API integration.

## ✅ **Prerequisites (Already Done)**
- ✅ Gemini API key configured as `GEMINI_API_KEY` environment variable
- ✅ Usage-based billing enabled
- ✅ Environment configuration created (`api/src/config/environment.ts`)
- ✅ Docker Compose updated to pass `GEMINI_API_KEY` to API and bot services
- ✅ Mock bot execution system already implemented and tested

## 📋 **Implementation Checklist**

### **1. Install Gemini SDK**
```bash
cd api
npm install @google/generative-ai
```

### **2. Create Gemini Service**
**File**: `api/src/services/geminiService.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/environment.js';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async generateResponse(
    promptContext: string,
    conversationHistory: string,
    userMessage: string
  ): Promise<{ response: string; tokensUsed: number }> {
    const systemPrompt = `You are a helpful AI assistant. Use the following context to guide your responses:

${promptContext}

Previous conversation:
${conversationHistory}

User: ${userMessage}
Assistant:`;

    try {
      const result = await this.model.generateContent(systemPrompt);
      const response = result.response.text();
      
      // Estimate tokens (Gemini doesn't provide exact count in response)
      const tokensUsed = this.estimateTokenCount(systemPrompt + response);
      
      return { response, tokensUsed };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private estimateTokenCount(text: string): number {
    // Simple estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}
```

### **3. Update Bot Entity**
**File**: `api/src/entities/Bot.ts`

Add model field to Bot entity:
```typescript
@Column({ default: 'gemini-2.5-flash' })
model!: string;
```

### **4. Create Database Migration**
**File**: `api/src/migrations/[timestamp]-AddBotModelField.ts`

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBotModelField1753436000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bots" 
      ADD COLUMN "model" VARCHAR(50) NOT NULL DEFAULT 'gemini-2.5-flash'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bots" 
      DROP COLUMN "model"
    `);
  }
}
```

### **5. Update BotExecutionService**
**File**: `api/src/services/botExecutionService.ts`

Replace the mock `generateBotResponse` method:

```typescript
import { GeminiService } from './geminiService.js';

// Add to class
private static geminiService = new GeminiService();

// Replace generateBotResponse method
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
```

### **6. Update processMessage Method**
**File**: `api/src/services/botExecutionService.ts`

Update the `processMessage` method to use real token count:

```typescript
// In processMessage method, replace the tokensUsed line:
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
```

### **7. Create Gemini Types**
**File**: `api/src/types/gemini.ts`

```typescript
export interface GeminiResponse {
  response: string;
  tokensUsed: number;
}

export interface GeminiError {
  message: string;
  code?: string;
}
```

### **8. Add Error Handling**
**File**: `api/src/services/geminiService.ts`

Add comprehensive error handling:

```typescript
async generateResponse(
  promptContext: string,
  conversationHistory: string,
  userMessage: string
): Promise<{ response: string; tokensUsed: number }> {
  if (!config.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const systemPrompt = `You are a helpful AI assistant. Use the following context to guide your responses:

${promptContext}

Previous conversation:
${conversationHistory}

User: ${userMessage}
Assistant:`;

  try {
    const result = await this.model.generateContent(systemPrompt);
    const response = result.response.text();
    
    if (!response) {
      throw new Error('Empty response from Gemini API');
    }
    
    const tokensUsed = this.estimateTokenCount(systemPrompt + response);
    
    return { response, tokensUsed };
  } catch (error) {
    console.error('Gemini API error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        throw new Error('Invalid Gemini API key');
      }
      if (error.message.includes('QUOTA')) {
        throw new Error('Gemini API quota exceeded');
      }
      if (error.message.includes('SAFETY')) {
        throw new Error('Content blocked by safety filters');
      }
    }
    
    throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

### **9. Create Unit Tests**
**File**: `api/src/__tests__/geminiService.test.ts`

```typescript
import { GeminiService } from '../services/geminiService.js';

describe('GeminiService', () => {
  let geminiService: GeminiService;

  beforeEach(() => {
    geminiService = new GeminiService();
  });

  describe('generateResponse', () => {
    it('should generate a response with valid input', async () => {
      const result = await geminiService.generateResponse(
        'You are a helpful assistant.',
        'User: Hello\nAssistant: Hi there!',
        'How are you?'
      );

      expect(result.response).toBeDefined();
      expect(result.response.length).toBeGreaterThan(0);
      expect(result.tokensUsed).toBeGreaterThan(0);
    });

    it('should handle API errors gracefully', async () => {
      // Test with invalid API key scenario
      const originalKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = 'invalid-key';

      try {
        await geminiService.generateResponse('', '', 'test');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      } finally {
        process.env.GEMINI_API_KEY = originalKey;
      }
    });
  });
});
```

### **10. Update Integration Tests**
**File**: `api/src/__tests__/bot-execution.integration.ts`

Update test expectations to handle real Gemini responses:

```typescript
// Update the chat test to expect real responses
it('should send a message and get a bot response', async () => {
  const response = await request(app)
    .post('/api/bot-execution/chat')
    .send({
      botId: testBotId,
      userId: testUserId,
      message: 'Hello, how are you?'
    });

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('userMessage');
  expect(response.body).toHaveProperty('botResponse');
  expect(response.body.botResponse.content).toBeDefined();
  expect(response.body.botResponse.content.length).toBeGreaterThan(0);
});
```

## 🚀 **Implementation Steps**

### **Step 1: Install Dependencies**
```bash
cd api
npm install @google/generative-ai
```

### **Step 2: Create Files**
1. Create `api/src/services/geminiService.ts`
2. Create `api/src/types/gemini.ts`
3. Create migration file for Bot model field
4. Create `api/src/__tests__/geminiService.test.ts`

### **Step 3: Update Existing Files**
1. Update `api/src/entities/Bot.ts` (add model field)
2. Update `api/src/services/botExecutionService.ts` (replace mock with real Gemini)
3. Update `api/src/__tests__/bot-execution.integration.ts` (update expectations)

### **Step 4: Run Migration**
```bash
docker exec -it api npm run migration:run
```

### **Step 5: Test Implementation**
```bash
# Run unit tests
docker exec -it api npm run test:unit

# Run integration tests
docker exec -it api npm run test:integration
```

### **Step 6: Manual Testing**
```bash
# Start the environment
docker compose up -d

# Test bot chat via API
curl -X POST http://localhost:4000/api/bot-execution/chat \
  -H "Content-Type: application/json" \
  -d '{"botId":"test-bot-id","userId":"test-user-id","message":"Hello!"}'
```

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **"Invalid API Key"**
   - Verify `GEMINI_API_KEY` is set in environment
   - Check Docker Compose environment variables
   - Restart containers after adding env vars

2. **"Module not found"**
   - Ensure `@google/generative-ai` is installed
   - Check import paths use `.js` extension

3. **"Migration failed"**
   - Check migration timestamp is unique
   - Verify database connection
   - Run `docker exec -it api npm run migration:show`

4. **"Tests failing"**
   - Update test expectations for real responses
   - Mock Gemini API for unit tests
   - Check API key is available in test environment

## 📝 **PR Checklist**

Before submitting PR, ensure:

- [ ] All files created and updated
- [ ] Migration runs successfully
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing works
- [ ] Error handling implemented
- [ ] Token usage tracking works
- [ ] No hardcoded API keys
- [ ] Environment variables properly configured
- [ ] Documentation updated

## 🎯 **Success Criteria**

- [ ] Bot responses come from real Gemini 2.5 Flash API
- [ ] Proper error handling for API failures
- [ ] Token usage is tracked and stored
- [ ] All existing tests pass
- [ ] New unit tests for GeminiService pass
- [ ] Manual testing shows real AI responses
- [ ] No breaking changes to existing API

## 📚 **Resources**

- [Google Generative AI SDK](https://ai.google.dev/tutorials/node_quickstart)
- [Gemini API Reference](https://ai.google.dev/api/gemini-api)
- [Gemini 2.5 Flash Model](https://ai.google.dev/models/gemini) 