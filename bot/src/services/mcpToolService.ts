import { BotTool } from '../entities/BotTool.js';
import { Bot } from '../entities/Bot.js';
import { User } from '../entities/User.js';
import { Model } from '../entities/Model.js';
import { Application } from '../entities/Application.js';
import { Prompt } from '../entities/Prompt.js';
import { Feature } from '../entities/Feature.js';
import { Workflow } from '../entities/Workflow.js';
import { BotInstance, BotInstanceStatus } from '../entities/BotInstance.js';
import { AppDataSource } from '../config/database.js';
import axios from 'axios';
import { Entity } from '../entities/Entity.js';

const botRepository = AppDataSource.getRepository(Bot);
const userRepository = AppDataSource.getRepository(User);
const modelRepository = AppDataSource.getRepository(Model);
const applicationRepository = AppDataSource.getRepository(Application);
const promptRepository = AppDataSource.getRepository(Prompt);
const featureRepository = AppDataSource.getRepository(Feature);
const workflowRepository = AppDataSource.getRepository(Workflow);
const botInstanceRepository = AppDataSource.getRepository(BotInstance);
const entityRepository = AppDataSource.getRepository(Entity);

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
        return await this.createEntity(params, params.userId || config.userId);
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
   * Create a new entity (model or entity instance)
   */
  static async createEntity(params: any, userId: string): Promise<any> {
    console.log('🔧 MCP Tool Service: Creating entity with params:', params);
    
    const { operation, name, displayName, fields, modelId, data } = params;
    
    if (operation === 'create_model') {
      return await this.createModel(params, userId);
    } else if (operation === 'create_entity') {
      return await this.createEntityInstance(params, userId);
    } else {
      throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Create a new model
   */
  private static async createModel(params: any, userId: string): Promise<any> {
    const { name, displayName, fields } = params;
    
    if (!name || !displayName) {
      throw new Error('Model name and displayName are required');
    }

    // Check if model already exists
    const existingModel = await modelRepository.findOne({
      where: { name, userId }
    });

    if (existingModel) {
      throw new Error(`Model with name '${name}' already exists`);
    }

    // Create the model
    const model = modelRepository.create({
      name,
      displayName,
      schema: {
        fields: fields || []
      },
      userId,
      isSystem: false
    });

    const savedModel = await modelRepository.save(model);
    console.log('✅ Model created successfully:', savedModel.id);

    // Create a sample entity for the model if fields are provided
    if (fields && fields.length > 0) {
      try {
        const sampleData: Record<string, any> = {};
        for (const field of fields) {
          // Generate sample data based on field type
          switch (field.type.toLowerCase()) {
            case 'string':
              sampleData[field.name] = `Sample ${field.name}`;
              break;
            case 'number':
              sampleData[field.name] = 42;
              break;
            case 'boolean':
              sampleData[field.name] = true;
              break;
            default:
              sampleData[field.name] = `Sample ${field.name}`;
          }
        }

        const entity = entityRepository.create({
          name: `${name}_sample`,
          displayName: `Sample ${displayName}`,
          data: sampleData,
          modelId: savedModel.id,
          userId,
          isSystem: false
        });

        const savedEntity = await entityRepository.save(entity);
        console.log('✅ Sample entity created successfully:', savedEntity.id);
      } catch (error) {
        console.warn('⚠️ Failed to create sample entity:', error);
        // Don't fail the model creation if sample entity fails
      }
    }

    return {
      ...savedModel,
      message: `Model '${displayName}' created successfully with ${fields?.length || 0} fields`
    };
  }

  /**
   * Create a new entity instance
   */
  private static async createEntityInstance(params: any, userId: string): Promise<any> {
    const { name, displayName, data, modelId } = params;
    
    if (!name || !displayName || !data || !modelId) {
      throw new Error('Entity name, displayName, data, and modelId are required');
    }

    // Verify the model exists
    const model = await modelRepository.findOne({
      where: { id: modelId, userId }
    });

    if (!model) {
      throw new Error(`Model with ID '${modelId}' not found`);
    }

    // Validate data against model schema
    const validation = this.validateEntityData(data, model.schema);
    if (!validation.isValid) {
      throw new Error(`Entity validation failed: ${validation.errors.join(', ')}`);
    }

    // Create the entity
    const entity = entityRepository.create({
      name,
      displayName,
      data: validation.validatedData,
      modelId,
      userId,
      isSystem: false
    });

    const savedEntity = await entityRepository.save(entity);
    console.log('✅ Entity created successfully:', savedEntity.id);

    return {
      ...savedEntity,
      message: `Entity '${displayName}' created successfully`
    };
  }

  /**
   * Validate entity data against model schema
   */
  private static validateEntityData(data: Record<string, any>, schema: any): { isValid: boolean; errors: string[]; validatedData: Record<string, any> } {
    const errors: string[] = [];
    const validatedData: Record<string, any> = {};

    if (!schema || !schema.fields) {
      errors.push('Invalid schema: missing fields');
      return { isValid: false, errors, validatedData };
    }

    // Validate each field in the schema
    for (const field of schema.fields) {
      const fieldName = field.name;
      const fieldType = field.type;
      const isRequired = field.required !== false; // Default to required if not specified
      const value = data[fieldName];

      // Check if required field is missing
      if (isRequired && (value === undefined || value === null || value === '')) {
        errors.push(`Required field '${fieldName}' is missing`);
        continue;
      }

      // Skip validation for optional fields that are not provided
      if (!isRequired && (value === undefined || value === null)) {
        continue;
      }

      // Type validation
      if (value !== undefined && value !== null) {
        const typeError = this.validateFieldType(fieldName, value, fieldType);
        if (typeError) {
          errors.push(typeError);
          continue;
        }
      }

      // Add validated value to result
      validatedData[fieldName] = value;
    }

    return {
      isValid: errors.length === 0,
      errors,
      validatedData
    };
  }

  /**
   * Validate a single field's type
   */
  private static validateFieldType(fieldName: string, value: any, expectedType: string): string | null {
    switch (expectedType.toLowerCase()) {
      case 'string':
        if (typeof value !== 'string') {
          return `Field '${fieldName}' must be a string, got ${typeof value}`;
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `Field '${fieldName}' must be a number, got ${typeof value}`;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return `Field '${fieldName}' must be a boolean, got ${typeof value}`;
        }
        break;
      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return `Field '${fieldName}' must be a valid date`;
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          return `Field '${fieldName}' must be an array, got ${typeof value}`;
        }
        break;
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return `Field '${fieldName}' must be an object, got ${typeof value}`;
        }
        break;
      default:
        return `Unknown field type '${expectedType}' for field '${fieldName}'`;
    }

    return null;
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