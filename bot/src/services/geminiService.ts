import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/environment.js';
import { SecretService } from './secretService.js';

export interface GeminiResponse {
  response: string;
  tokensUsed: number;
}

export class GeminiService {
  private secretService: SecretService;

  constructor() {
    this.secretService = new SecretService();
  }

  private async getApiKey(userId?: string): Promise<string> {
    // Try to get user-specific API key first if userId is provided
    if (userId) {
      const userApiKey = await this.secretService.getSecretValueByKey('GEMINI_API_KEY', userId) ||
                         await this.secretService.getSecretValueByKey('GOOGLE_API_KEY', userId);
      if (userApiKey) {
        return userApiKey;
      }
    }

    // Fall back to system-wide API key
    const systemApiKey = config.GEMINI_KEY || process.env.GEMINI_KEY;
    if (!systemApiKey) {
      throw new Error('Gemini API key not configured. Please add GEMINI_KEY environment variable or create a GEMINI_API_KEY secret.');
    }

    return systemApiKey;
  }

  private async getModelInstance(userId?: string, modelName: string = 'gemini-2.5-flash') {
    const apiKey = await this.getApiKey(userId);
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: modelName });
  }

  async generateResponse(
    promptContext: string,
    conversationHistory: string,
    userMessage: string,
    userId?: string
  ): Promise<GeminiResponse> {
    const systemPrompt = `You are a helpful AI assistant. Use the following context to guide your responses:

${promptContext}

Previous conversation:
${conversationHistory}

User: ${userMessage}
Assistant:`;

    try {
      const model = await this.getModelInstance(userId);
      const result = await model.generateContent(systemPrompt);
      const response = result.response.text();

      if (!response) {
        throw new Error('Empty response from Gemini API');
      }

      // Estimate tokens (Gemini doesn't provide exact count in response)
      const tokensUsed = this.estimateTokenCount(systemPrompt + response);

      return { response, tokensUsed };
    } catch (error) {
      console.error('Gemini API error:', error);

      if (error instanceof Error) {
        // Check for more specific patterns first
        if (error.message.toLowerCase().includes('quota')) {
          throw new Error('Gemini API quota exceeded');
        }
        if (error.message.toLowerCase().includes('rate limit')) {
          throw new Error('Gemini API rate limit exceeded');
        }
        if (error.message.toLowerCase().includes('safety')) {
          throw new Error('Content blocked by safety filters');
        }
        if (error.message.toLowerCase().includes('api key') || error.message.includes('API_KEY')) {
          throw new Error('Invalid Gemini API key');
        }
      }

      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private estimateTokenCount(text: string): number {
    // Simple estimation: ~4 characters per token
    // This is a rough approximation for English text
    return Math.ceil(text.length / 4);
  }
}
