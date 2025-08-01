import { BotTool } from '../entities/BotTool';
import { Bot } from '../entities/Bot';
import { User } from '../entities/User';
import { Model } from '../entities/Model';
import { Application } from '../entities/Application';
import { Prompt } from '../entities/Prompt';
import { Feature } from '../entities/Feature';
import { Workflow } from '../entities/Workflow';
import { BotInstance, BotInstanceStatus } from '../entities/BotInstance';
import { AppDataSource } from '../config/database';
import axios from 'axios';

const botRepository = AppDataSource.getRepository(Bot);
const userRepository = AppDataSource.getRepository(User);
const modelRepository = AppDataSource.getRepository(Model);
const applicationRepository = AppDataSource.getRepository(Application);
const promptRepository = AppDataSource.getRepository(Prompt);
const featureRepository = AppDataSource.getRepository(Feature);
const workflowRepository = AppDataSource.getRepository(Workflow);
const botInstanceRepository = AppDataSource.getRepository(BotInstance);

export interface MCPToolConfig {
  platformEndpoint: string;
  apiKey?: string;
  userId?: string;
  permissions: string[];
  operations: string[];
}

export interface MCPOperation {
  operation: string;
  params: Record<string, any>;
  description: string;
}

export class MCPToolService {
  /**
   * Execute MCP tool operations
   */
  static async executeMCPTool(tool: BotTool, params: Record<string, any>): Promise<any> {
    const config = tool.config as MCPToolConfig;

    // Validate the operation
    const operation = params.operation || params.action;
    if (!operation) {
      throw new Error('Operation is required for MCP tool');
    }

    if (!config.operations.includes(operation)) {
      throw new Error(`Operation '${operation}' not allowed for this MCP tool`);
    }

    // Execute the operation based on the entity type
    const [action, entity] = operation.split('_');
    
    switch (action) {
      case 'list':
        return await this.listEntities(entity, config, params);
      case 'get':
        return await this.getEntity(entity, config, params);
      case 'create':
        return await this.createEntity(entity, config, params);
      case 'update':
        return await this.updateEntity(entity, config, params);
      case 'delete':
        return await this.deleteEntity(entity, config, params);
      case 'execute':
        return await this.executeBot(config, params);
      case 'start':
        return await this.startBotInstance(config, params);
      case 'stop':
        return await this.stopBotInstance(config, params);
      case 'get_user_info':
        return await this.getUserInfo(config, params);
      case 'list_user_data':
        return await this.listUserData(config, params);
      case 'search_platform':
        return await this.searchPlatform(config, params);
      default:
        throw new Error(`Unknown MCP operation: ${operation}`);
    }
  }

  /**
   * Generic method to list entities
   */
  private static async listEntities(entityType: string, config: MCPToolConfig, params: Record<string, any>): Promise<any> {
    const { limit = 50, offset = 0 } = params;
    const userId = params.userId || config.userId;

    let repository: any;
    switch (entityType) {
      case 'models':
        repository = modelRepository;
        break;
      case 'applications':
        repository = applicationRepository;
        break;
      case 'bots':
        repository = botRepository;
        break;
      case 'prompts':
        repository = promptRepository;
        break;
      case 'features':
        repository = featureRepository;
        break;
      case 'workflows':
        repository = workflowRepository;
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }

    const entities = await repository.find({
      where: entityType === 'workflows' ? {} : { userId },
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' }
    });

    return {
      success: true,
      [entityType]: entities,
      total: entities.length
    };
  }

  /**
   * Generic method to get a specific entity
   */
  private static async getEntity(entityType: string, config: MCPToolConfig, params: Record<string, any>): Promise<any> {
    const { id } = params;
    const userId = params.userId || config.userId;

    if (!id) {
      throw new Error('Entity ID is required');
    }

    let repository: any;
    switch (entityType) {
      case 'model':
        repository = modelRepository;
        break;
      case 'application':
        repository = applicationRepository;
        break;
      case 'bot':
        repository = botRepository;
        break;
      case 'prompt':
        repository = promptRepository;
        break;
      case 'feature':
        repository = featureRepository;
        break;
      case 'workflow':
        repository = workflowRepository;
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }

    const entity = await repository.findOne({
      where: { id, userId }
    });

    if (!entity) {
      throw new Error('Entity not found or unauthorized');
    }

    return {
      success: true,
      [entityType]: entity
    };
  }

  /**
   * Generic method to create entities
   */
  private static async createEntity(entityType: string, config: MCPToolConfig, params: Record<string, any>): Promise<any> {
    const userId = params.userId || config.userId;

    let repository: any;
    let entity: any;
    
    switch (entityType) {
      case 'model':
        repository = modelRepository;
        entity = new Model();
        break;
      case 'application':
        repository = applicationRepository;
        entity = new Application();
        break;
      case 'bot':
        repository = botRepository;
        entity = new Bot();
        break;
      case 'prompt':
        repository = promptRepository;
        entity = new Prompt();
        break;
      case 'feature':
        repository = featureRepository;
        entity = new Feature();
        break;
      case 'workflow':
        repository = workflowRepository;
        entity = new Workflow();
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }

    // Set common fields
    Object.assign(entity, params);
    entity.userId = userId;

    const savedEntity = await repository.save(entity);

    return {
      success: true,
      [entityType]: savedEntity
    };
  }

  /**
   * Generic method to update entities
   */
  private static async updateEntity(entityType: string, config: MCPToolConfig, params: Record<string, any>): Promise<any> {
    const { id, ...updateData } = params;
    const userId = params.userId || config.userId;

    if (!id) {
      throw new Error('Entity ID is required');
    }

    let repository: any;
    switch (entityType) {
      case 'model':
        repository = modelRepository;
        break;
      case 'application':
        repository = applicationRepository;
        break;
      case 'bot':
        repository = botRepository;
        break;
      case 'prompt':
        repository = promptRepository;
        break;
      case 'feature':
        repository = featureRepository;
        break;
      case 'workflow':
        repository = workflowRepository;
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }

    const entity = await repository.findOne({
      where: { id, userId }
    });

    if (!entity) {
      throw new Error('Entity not found or unauthorized');
    }

    Object.assign(entity, updateData);
    const updatedEntity = await repository.save(entity);

    return {
      success: true,
      [entityType]: updatedEntity
    };
  }

  /**
   * Generic method to delete entities
   */
  private static async deleteEntity(entityType: string, config: MCPToolConfig, params: Record<string, any>): Promise<any> {
    const { id } = params;
    const userId = params.userId || config.userId;

    if (!id) {
      throw new Error('Entity ID is required');
    }

    let repository: any;
    switch (entityType) {
      case 'model':
        repository = modelRepository;
        break;
      case 'application':
        repository = applicationRepository;
        break;
      case 'bot':
        repository = botRepository;
        break;
      case 'prompt':
        repository = promptRepository;
        break;
      case 'feature':
        repository = featureRepository;
        break;
      case 'workflow':
        repository = workflowRepository;
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }

    const entity = await repository.findOne({
      where: { id, userId }
    });

    if (!entity) {
      throw new Error('Entity not found or unauthorized');
    }

    await repository.remove(entity);

    return {
      success: true,
      message: `${entityType} deleted successfully`
    };
  }

  /**
   * Execute a bot (send a message and get response)
   */
  private static async executeBot(config: MCPToolConfig, params: Record<string, any>): Promise<any> {
    const { botId, message } = params;

    if (!botId || !message) {
      throw new Error('Bot ID and message are required');
    }

    // This would integrate with the bot execution service
    // For now, return a placeholder
    return {
      success: true,
      message: 'Bot execution not yet implemented',
      response: `Bot ${botId} would respond to: "${message}"`
    };
  }

  /**
   * Start a bot instance
   */
  private static async startBotInstance(config: MCPToolConfig, params: Record<string, any>): Promise<any> {
    const { botId, userId } = params;

    if (!botId || !userId) {
      throw new Error('Bot ID and user ID are required');
    }

    // Check if instance already exists
    let instance = await botInstanceRepository.findOne({
      where: { botId, userId }
    });

    if (!instance) {
      instance = new BotInstance();
      instance.botId = botId;
      instance.userId = userId;
      instance.status = BotInstanceStatus.RUNNING;
      instance.lastStartedAt = new Date();
    } else {
      instance.status = BotInstanceStatus.RUNNING;
      instance.lastStartedAt = new Date();
      instance.lastStoppedAt = undefined;
    }

    const savedInstance = await botInstanceRepository.save(instance);

    return {
      success: true,
      instance: savedInstance
    };
  }

  /**
   * Stop a bot instance
   */
  private static async stopBotInstance(config: MCPToolConfig, params: Record<string, any>): Promise<any> {
    const { botId, userId } = params;

    if (!botId || !userId) {
      throw new Error('Bot ID and user ID are required');
    }

    const instance = await botInstanceRepository.findOne({
      where: { botId, userId }
    });

    if (!instance) {
      throw new Error('Bot instance not found');
    }

    instance.status = BotInstanceStatus.STOPPED;
    instance.lastStoppedAt = new Date();

    const savedInstance = await botInstanceRepository.save(instance);

    return {
      success: true,
      instance: savedInstance
    };
  }

  /**
   * Get user information
   */
  private static async getUserInfo(config: MCPToolConfig, params: Record<string, any>): Promise<any> {
    const userId = params.userId || config.userId;

    if (!userId) {
      throw new Error('User ID is required');
    }

    const user = await userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    };
  }

  /**
   * List all user data
   */
  private static async listUserData(config: MCPToolConfig, params: Record<string, any>): Promise<any> {
    const userId = params.userId || config.userId;

    if (!userId) {
      throw new Error('User ID is required');
    }

    const [models, applications, bots, prompts, features, workflows] = await Promise.all([
      modelRepository.find({ where: { userId } }),
      applicationRepository.find({ where: { userId } }),
      botRepository.find({ where: { userId } }),
      promptRepository.find({ where: { userId } }),
      featureRepository.find({ where: { userId } }),
      workflowRepository.find({ where: {} })
    ]);

    return {
      success: true,
      userData: {
        models: models.length,
        applications: applications.length,
        bots: bots.length,
        prompts: prompts.length,
        features: features.length,
        workflows: workflows.length
      },
      details: {
        models,
        applications,
        bots,
        prompts,
        features,
        workflows
      }
    };
  }

  /**
   * Search platform data
   */
  private static async searchPlatform(config: MCPToolConfig, params: Record<string, any>): Promise<any> {
    const { query, entityType, userId } = params;

    if (!query) {
      throw new Error('Search query is required');
    }

    const searchUserId = userId || config.userId;
    let results: any[] = [];

    if (!entityType || entityType === 'all') {
      // Search across all entity types
      const [models, applications, bots, prompts, features, workflows] = await Promise.all([
        modelRepository.find({ where: { userId: searchUserId } }),
        applicationRepository.find({ where: { userId: searchUserId } }),
        botRepository.find({ where: { userId: searchUserId } }),
        promptRepository.find({ where: { userId: searchUserId } }),
        featureRepository.find({ where: { userId: searchUserId } }),
        workflowRepository.find({ where: {} })
      ]);

      results = [
        ...models.filter(m => m.name.toLowerCase().includes(query.toLowerCase()) || m.displayName?.toLowerCase().includes(query.toLowerCase())),
        ...applications.filter(a => a.name.toLowerCase().includes(query.toLowerCase()) || a.displayName?.toLowerCase().includes(query.toLowerCase())),
        ...bots.filter(b => b.name.toLowerCase().includes(query.toLowerCase()) || b.displayName?.toLowerCase().includes(query.toLowerCase())),
        ...prompts.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.description?.toLowerCase().includes(query.toLowerCase())),
        ...features.filter(f => f.name.toLowerCase().includes(query.toLowerCase()) || f.displayName?.toLowerCase().includes(query.toLowerCase())),
        ...workflows.filter(w => w.name.toLowerCase().includes(query.toLowerCase()) || w.displayName?.toLowerCase().includes(query.toLowerCase()))
      ];
    } else {
      // Search specific entity type
      let repository: any;
      switch (entityType) {
        case 'models':
          repository = modelRepository;
          break;
        case 'applications':
          repository = applicationRepository;
          break;
        case 'bots':
          repository = botRepository;
          break;
        case 'prompts':
          repository = promptRepository;
          break;
        case 'features':
          repository = featureRepository;
          break;
        case 'workflows':
          repository = workflowRepository;
          break;
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }

      results = await repository.find({
        where: { userId: searchUserId }
      });
    }

    return {
      success: true,
      query,
      results: results.slice(0, 20), // Limit results
      total: results.length
    };
  }
} 