import { SecretService } from './secretService.js';
import { AIModel } from '../entities/AIModel.js';

export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepSeekService {
  private secretService = new SecretService();

  async generateResponse(
    aiModel: AIModel,
    prompt: string,
    systemPrompt?: string,
    temperature: number = 0.7,
    maxTokens: number = 1000
  ): Promise<string> {
    if (!aiModel.secretId) {
      throw new Error('DeepSeek API key not configured for this model');
    }

    const secret = await this.secretService.findById(aiModel.secretId, aiModel.userId);
    if (!secret) {
      throw new Error('DeepSeek API key not found');
    }

    const apiKey = await this.secretService.getSecretValueByKey(secret.key, aiModel.userId);
    if (!apiKey) {
      throw new Error('Failed to retrieve DeepSeek API key');
    }

    const baseUrl = aiModel.baseUrl || 'https://api.deepseek.com';
    const url = `${baseUrl}/v1/chat/completions`;

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const requestBody = {
      model: aiModel.modelId,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as DeepSeekResponse;
      return data.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('DeepSeek API request failed:', error);
      throw new Error(`DeepSeek API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(aiModel: AIModel): Promise<boolean> {
    try {
      await this.generateResponse(aiModel, 'Hello', undefined, 0.1, 10);
      return true;
    } catch (error) {
      console.error('DeepSeek connection test failed:', error);
      return false;
    }
  }
}
