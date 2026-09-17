import { SecretService } from './secretService.js';
import { AIModel } from '../entities/AIModel.js';

export interface LocalLLMResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  message?: {
    role: string;
    content: string;
  };
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  system_fingerprint?: string;
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
      const startTime = Date.now();
      console.log('🚀 Making request to LM Studio at:', url);
      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        // Add timeout for local LLM responses
        signal: AbortSignal.timeout(300000) // 300 second timeout
      });

      const responseTime = Date.now() - startTime;
      console.log('📥 Response received after', responseTime, 'ms');
      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ LM Studio returned error status:', response.status, response.statusText);
        console.error('❌ Error response body:', errorText);
        throw new Error(`Local LLM API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

            const data = await response.json() as LocalLLMResponse;
              console.log('Local LLM response data:', JSON.stringify(data, null, 2));
        console.log('Response type:', typeof data);
        console.log('Has choices:', !!data.choices);
        console.log('Choices length:', data.choices?.length);
        console.log('Has message:', !!data.message);

        // Log the first choice in detail
        if (data.choices && data.choices.length > 0) {
          console.log('First choice:', JSON.stringify(data.choices[0], null, 2));
          console.log('First choice message:', JSON.stringify(data.choices[0]?.message, null, 2));
          console.log('First choice content:', data.choices[0]?.message?.content);
          console.log('Content type:', typeof data.choices[0]?.message?.content);
          console.log('Content length:', data.choices[0]?.message?.content?.length);
        }

      // Handle both OpenAI-compatible format (choices array) and LM Studio format (direct message)
      if (data.choices && data.choices.length > 0) {
        console.log('Using OpenAI-compatible format');
        const content = data.choices[0]?.message?.content;
        console.log('Extracted content:', content);
        return content || 'No response generated';
      } else if (data.message) {
        console.log('Using LM Studio format');
        const content = data.message.content;
        console.log('Extracted content:', content);
        return content || 'No response generated';
      } else {
        console.error('Unexpected response format:', data);
        console.error('Response keys:', Object.keys(data));
        throw new Error('Unexpected response format from LM Studio');
      }
    } catch (error) {
      console.error('❌ Local LLM API request failed:', error);

      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          console.error('⏰ Request timed out after 300 seconds');
          console.error('🔍 This could be due to:');
          console.error('   - LM Studio not responding quickly enough');
          console.error('   - Network connectivity issues');
          console.error('   - LM Studio being overloaded');
          throw new Error(`Local LLM request timed out after 300 seconds. Please check if LM Studio is running and responsive.`);
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
          console.error('🌐 Network connectivity issue detected');
          throw new Error(`Network error: Cannot reach LM Studio at ${url}. Please check if LM Studio is running and accessible.`);
        } else {
          throw new Error(`Local LLM API request failed: ${error.message}`);
        }
      } else {
        throw new Error(`Local LLM API request failed: ${String(error)}`);
      }
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
      // Allow longer responses for better conversation quality
      max_tokens: Math.min(maxTokens, 2048)
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
