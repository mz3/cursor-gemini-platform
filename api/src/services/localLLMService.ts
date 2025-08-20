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

export interface LocalLLMModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export class LocalLLMService {
  private secretService = new SecretService();

  async generateResponse(
    aiModel: AIModel,
    prompt: string,
    systemPrompt?: string,
    temperature: number = 0.3,
    maxTokens: number = 200
  ): Promise<string> {
    // For local LLMs, we typically don't need API keys, but we might need other configuration
    const baseUrl = aiModel.baseUrl || 'http://localhost:1234';
    // Check if baseUrl already ends with /v1 to avoid double /v1/v1
    const url = baseUrl.endsWith('/v1')
      ? `${baseUrl}/chat/completions`
      : `${baseUrl}/v1/chat/completions`;

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    // Model-specific configurations
    const requestBody = this.buildRequestBody(aiModel, messages, temperature, maxTokens);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        // Add timeout for faster responses
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Local LLM API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as LocalLLMResponse;
      console.log('Local LLM response data:', JSON.stringify(data, null, 2));
      console.log('Choices array:', data.choices);
      console.log('First choice:', data.choices?.[0]);
      return data.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('Local LLM API request failed:', error);
      throw new Error(`Local LLM API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildRequestBody(
    aiModel: AIModel,
    messages: Array<{ role: string; content: string }>,
    temperature: number,
    maxTokens: number
  ) {
    const baseBody = {
      model: aiModel.modelId,
      messages,
      temperature,
      stream: false,
      // Add performance optimizations
      top_p: 0.9,
      top_k: 40,
      repeat_penalty: 1.1,
      // Reduce context window for faster processing
      max_tokens: Math.min(maxTokens, 200)
    };

    // Add model-specific configurations
    if (aiModel.configuration) {
      return {
        ...baseBody,
        ...aiModel.configuration
      };
    }

    return baseBody;
  }

  async testConnection(aiModel: AIModel): Promise<boolean> {
    try {
      const baseUrl = aiModel.baseUrl || 'http://localhost:1234';
      // Check if baseUrl already ends with /v1 to avoid double /v1/v1
      const url = baseUrl.endsWith('/v1')
        ? `${baseUrl}/models`
        : `${baseUrl}/v1/models`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        // Add timeout for local connections
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        console.error(`Local LLM connection failed: HTTP ${response.status}: ${response.statusText}`);
        return false;
      }

      const data = await response.json() as { data: LocalLLMModelInfo[] };

      if (!data.data || data.data.length === 0) {
        console.error('Local LLM connection failed: No models found in LM Studio');
        return false;
      }

      console.log(`Local LLM connected successfully. Available models: ${data.data.map(model => model.id).join(', ')}`);
      return true;
    } catch (error) {
      console.error('Local LLM connection test failed:', error);
      return false;
    }
  }

  async getAvailableModels(aiModel: AIModel): Promise<string[]> {
    try {
      const baseUrl = aiModel.baseUrl || 'http://localhost:1234';
      // Check if baseUrl already ends with /v1 to avoid double /v1/v1
      const url = baseUrl.endsWith('/v1')
        ? `${baseUrl}/models`
        : `${baseUrl}/v1/models`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as { data: LocalLLMModelInfo[] };
      return data.data?.map(model => model.id) || [];
    } catch (error) {
      console.error('Failed to get available models:', error);
      throw new Error(`Failed to get available models: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateModel(aiModel: AIModel): Promise<boolean> {
    try {
      const availableModels = await this.getAvailableModels(aiModel);
      return availableModels.includes(aiModel.modelId);
    } catch (error) {
      console.error('Model validation failed:', error);
      return false;
    }
  }
}
