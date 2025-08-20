import { SecretService } from './secretService.js';
import { AIModel } from '../entities/AIModel.js';

export interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ClaudeService {
  private secretService = new SecretService();

  async generateResponse(
    aiModel: AIModel,
    prompt: string,
    systemPrompt?: string,
    temperature: number = 0.7,
    maxTokens: number = 1000
  ): Promise<string> {
    if (!aiModel.secretId) {
      throw new Error('Claude API key not configured for this model');
    }

    const secret = await this.secretService.findById(aiModel.secretId, aiModel.userId);
    if (!secret) {
      throw new Error('Claude API key not found');
    }

    const apiKey = await this.secretService.getSecretValueByKey(secret.key, aiModel.userId);
    if (!apiKey) {
      throw new Error('Failed to retrieve Claude API key');
    }

    const baseUrl = aiModel.baseUrl || 'https://api.anthropic.com';
    const url = `${baseUrl}/v1/messages`;

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const requestBody = {
      model: aiModel.modelId,
      messages,
      temperature,
      max_tokens: maxTokens
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as ClaudeResponse;
      return data.content[0]?.text || 'No response generated';
    } catch (error) {
      console.error('Claude API request failed:', error);
      throw new Error(`Claude API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(aiModel: AIModel): Promise<boolean> {
    try {
      await this.generateResponse(aiModel, 'Hello', undefined, 0.1, 10);
      return true;
    } catch (error) {
      console.error('Claude connection test failed:', error);
      return false;
    }
  }
}
