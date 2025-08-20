import { SecretService } from './secretService.js';
import { AIModel } from '../entities/AIModel.js';

export interface LocalLLMResponse {
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

export class LocalLLMService {
  private secretService = new SecretService();

  async generateResponse(
    aiModel: AIModel,
    prompt: string,
    systemPrompt?: string,
    temperature: number = 0.7,
    maxTokens: number = 1000
  ): Promise<string> {
    // For local LLMs, we typically don't need API keys, but we might need other configuration
    const baseUrl = aiModel.baseUrl || 'http://localhost:1234';
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Local LLM API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as LocalLLMResponse;
      return data.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('Local LLM API request failed:', error);
      throw new Error(`Local LLM API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(aiModel: AIModel): Promise<boolean> {
    try {
      const baseUrl = aiModel.baseUrl || 'http://localhost:1234';
      const url = `${baseUrl}/v1/models`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json() as { data: Array<{ id: string }> };
      return data.data && data.data.length > 0;
    } catch (error) {
      console.error('Local LLM connection test failed:', error);
      return false;
    }
  }
}
