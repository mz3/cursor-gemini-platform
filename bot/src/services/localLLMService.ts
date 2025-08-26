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
    temperature: number = 0.7,
    maxTokens: number = 1000
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
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Local LLM API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as LocalLLMResponse;

      // Debug: Log the response structure
      console.log('🔍 Local LLM Response:', JSON.stringify(data, null, 2));

      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        console.error('❌ Invalid response structure - no choices array:', data);
        throw new Error('Invalid response structure from local LLM');
      }

      const content = data.choices[0]?.message?.content;
      if (!content) {
        console.error('❌ No content in response:', data.choices[0]);
        throw new Error('No content in LLM response');
      }

      return content;
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
      max_tokens: maxTokens,
      stream: false
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

  async testConnection(aiModel: AIModel): Promise<{ connected: boolean; models?: string[]; error?: string }> {
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
        return {
          connected: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json() as { data: LocalLLMModelInfo[] };

      if (!data.data || data.data.length === 0) {
        return {
          connected: false,
          error: 'No models found in LM Studio'
        };
      }

      const models = data.data.map(model => model.id);

      return {
        connected: true,
        models
      };
    } catch (error) {
      console.error('Local LLM connection test failed:', error);
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
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
