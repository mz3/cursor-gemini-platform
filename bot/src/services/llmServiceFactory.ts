import { AIModel, LLMProvider } from '../entities/AIModel.js';
import { GeminiService } from './geminiService.js';
import { OpenAIService } from './openaiService.js';
import { ClaudeService } from './claudeService.js';
import { DeepSeekService } from './deepseekService.js';
import { LocalLLMService } from './localLLMService.js';

export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface LLMService {
  generateResponse(
    aiModel: AIModel,
    prompt: string,
    systemPrompt?: string,
    temperature?: number,
    maxTokens?: number
  ): Promise<string>;

  testConnection(aiModel: AIModel): Promise<boolean | { connected: boolean; models?: string[]; error?: string }>;
}

export class LLMServiceFactory {
  private static services: Map<LLMProvider, LLMService> = new Map();

  static getService(provider: LLMProvider): LLMService {
    if (!this.services.has(provider)) {
      switch (provider) {
        case 'gemini':
          this.services.set(provider, new GeminiService());
          break;
        case 'openai':
          this.services.set(provider, new OpenAIService());
          break;
        case 'anthropic':
          this.services.set(provider, new ClaudeService());
          break;
        case 'deepseek':
          this.services.set(provider, new DeepSeekService());
          break;
        case 'local':
          this.services.set(provider, new LocalLLMService());
          break;
        default:
          throw new Error(`Unsupported LLM provider: ${provider}`);
      }
    }

    return this.services.get(provider)!;
  }

  static async generateResponse(
    aiModel: AIModel,
    prompt: string,
    systemPrompt?: string,
    temperature: number = 0.7,
    maxTokens: number = 1000
  ): Promise<LLMResponse> {
    const service = this.getService(aiModel.provider);
    const content = await service.generateResponse(aiModel, prompt, systemPrompt, temperature, maxTokens);

    return { content };
  }

  static async testConnection(aiModel: AIModel): Promise<boolean> {
    const service = this.getService(aiModel.provider);
    const result = await service.testConnection(aiModel);

    // Handle different return types
    if (typeof result === 'boolean') {
      return result;
    } else {
      return result.connected;
    }
  }
}
