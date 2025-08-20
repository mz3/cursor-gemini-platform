import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/environment.js';
import { GeminiResponse } from '../types/gemini.js';
import { SecretService } from './secretService.js';
import { AIModel } from '../entities/AIModel.js';

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
    const systemApiKey = await this.secretService.getSecretValueByKey('GEMINI_API_KEY', 'system') ||
                        await this.secretService.getSecretValueByKey('GOOGLE_API_KEY', 'system');

    if (!systemApiKey) {
      throw new Error('No Gemini API key found');
    }

    return systemApiKey;
  }

  async generateResponse(
    aiModel: AIModel,
    prompt: string,
    systemPrompt?: string,
    temperature: number = 0.7,
    maxTokens: number = 1000
  ): Promise<string> {
    if (!aiModel.secretId) {
      throw new Error('Gemini API key not configured for this model');
    }

    const secret = await this.secretService.findById(aiModel.secretId, aiModel.userId);
    if (!secret) {
      throw new Error('Gemini API key not found');
    }

    const apiKey = await this.secretService.getSecretValueByKey(secret.key, aiModel.userId);
    if (!apiKey) {
      throw new Error('Failed to retrieve Gemini API key');
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: aiModel.modelId });

      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;

      return response.text();
    } catch (error) {
      console.error('Gemini API request failed:', error);
      throw new Error(`Gemini API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(aiModel: AIModel): Promise<boolean> {
    try {
      await this.generateResponse(aiModel, 'Hello', undefined, 0.1, 10);
      return true;
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }
}
