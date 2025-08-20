import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.js';
import { AIModel, LLMProvider } from '../entities/AIModel.js';
import { User } from '../entities/User.js';
import { Secret } from '../entities/Secret.js';

export interface CreateAIModelDto {
  name: string;
  displayName: string;
  description?: string;
  provider: LLMProvider;
  modelId: string;
  apiVersion?: string;
  baseUrl?: string;
  capabilities?: string[];
  configuration?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    stopSequences?: string[];
    systemPrompt?: string;
  };
  isActive?: boolean;
  isDefault?: boolean;
  secretId?: string;
}

export interface UpdateAIModelDto {
  name?: string;
  displayName?: string;
  description?: string;
  provider?: LLMProvider;
  modelId?: string;
  apiVersion?: string;
  baseUrl?: string;
  capabilities?: string[];
  configuration?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    stopSequences?: string[];
    systemPrompt?: string;
  };
  isActive?: boolean;
  isDefault?: boolean;
  secretId?: string;
}

export class AIModelService {
  private aiModelRepository: Repository<AIModel>;
  private userRepository: Repository<User>;
  private secretRepository: Repository<Secret>;

  constructor() {
    this.aiModelRepository = AppDataSource.getRepository(AIModel);
    this.userRepository = AppDataSource.getRepository(User);
    this.secretRepository = AppDataSource.getRepository(Secret);
  }

  async create(userId: string, data: CreateAIModelDto): Promise<AIModel> {
    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Verify secret exists if provided
    if (data.secretId) {
      const secret = await this.secretRepository.findOne({
        where: { id: data.secretId, userId }
      });
      if (!secret) {
        throw new Error('Secret not found or not accessible');
      }
    }

    // If this is set as default, unset other defaults for this user
    if (data.isDefault) {
      await this.aiModelRepository.update(
        { userId, isDefault: true },
        { isDefault: false }
      );
    }

    const aiModel = this.aiModelRepository.create({
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      provider: data.provider,
      modelId: data.modelId,
      apiVersion: data.apiVersion,
      baseUrl: data.baseUrl,
      capabilities: data.capabilities as any,
      configuration: data.configuration,
      isActive: data.isActive ?? true,
      isDefault: data.isDefault ?? false,
      userId,
      secretId: data.secretId
    });

    return await this.aiModelRepository.save(aiModel);
  }

  async findAll(userId: string, includeInactive = false): Promise<AIModel[]> {
    const where: any = { userId };
    if (!includeInactive) {
      where.isActive = true;
    }

    return await this.aiModelRepository.find({
      where,
      relations: ['secret'],
      order: { isDefault: 'DESC', createdAt: 'DESC' }
    });
  }

  async findById(id: string, userId: string): Promise<AIModel | null> {
    return await this.aiModelRepository.findOne({
      where: { id, userId },
      relations: ['secret']
    });
  }

  async findByProvider(userId: string, provider: LLMProvider): Promise<AIModel[]> {
    return await this.aiModelRepository.find({
      where: { provider, userId, isActive: true },
      relations: ['secret'],
      order: { isDefault: 'DESC', createdAt: 'DESC' }
    });
  }

  async findDefault(userId: string): Promise<AIModel | null> {
    return await this.aiModelRepository.findOne({
      where: { userId, isDefault: true, isActive: true },
      relations: ['secret']
    });
  }

  async update(id: string, userId: string, data: UpdateAIModelDto): Promise<AIModel | null> {
    const aiModel = await this.findById(id, userId);
    if (!aiModel) {
      return null;
    }

    // Verify secret exists if provided
    if (data.secretId) {
      const secret = await this.secretRepository.findOne({
        where: { id: data.secretId, userId }
      });
      if (!secret) {
        throw new Error('Secret not found or not accessible');
      }
    }

    // If this is being set as default, unset other defaults for this user
    if (data.isDefault && !aiModel.isDefault) {
      await this.aiModelRepository.update(
        { userId, isDefault: true },
        { isDefault: false }
      );
    }

    Object.assign(aiModel, data);
    return await this.aiModelRepository.save(aiModel);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const aiModel = await this.findById(id, userId);
    if (!aiModel) {
      return false;
    }

    await this.aiModelRepository.remove(aiModel);
    return true;
  }

  async setDefault(id: string, userId: string): Promise<AIModel | null> {
    const aiModel = await this.findById(id, userId);
    if (!aiModel) {
      return null;
    }

    // Unset other defaults for this user
    await this.aiModelRepository.update(
      { userId, isDefault: true },
      { isDefault: false }
    );

    // Set this one as default
    aiModel.isDefault = true;
    return await this.aiModelRepository.save(aiModel);
  }

  async validateConfiguration(provider: LLMProvider, configuration: any): Promise<boolean> {
    // Basic validation for common configuration parameters
    if (configuration.maxTokens && (configuration.maxTokens < 1 || configuration.maxTokens > 100000)) {
      throw new Error('maxTokens must be between 1 and 100000');
    }

    if (configuration.temperature && (configuration.temperature < 0 || configuration.temperature > 2)) {
      throw new Error('temperature must be between 0 and 2');
    }

    if (configuration.topP && (configuration.topP < 0 || configuration.topP > 1)) {
      throw new Error('topP must be between 0 and 1');
    }

    if (configuration.topK && configuration.topK < 1) {
      throw new Error('topK must be greater than 0');
    }

    // Provider-specific validation
    switch (provider) {
      case 'gemini':
        // Gemini-specific validation
        break;
      case 'openai':
        // OpenAI-specific validation
        break;
      case 'anthropic':
        // Anthropic-specific validation
        break;
      case 'deepseek':
        // DeepSeek-specific validation
        break;
      case 'local':
        // Local LLM validation
        if (!configuration.baseUrl) {
          throw new Error('baseUrl is required for local LLMs');
        }
        break;
    }

    return true;
  }
}
