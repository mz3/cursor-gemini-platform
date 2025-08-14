import { AppDataSource } from '../config/database.js';
import { Entity } from '../entities/Entity.js';
import { Schema } from '../entities/Schema.js';
import { User } from '../entities/User.js';

const entityRepository = AppDataSource.getRepository(Entity);
const schemaRepository = AppDataSource.getRepository(Schema);
const userRepository = AppDataSource.getRepository(User);

export interface CreateEntityRequest {
  name: string;
  displayName: string;
  data: Record<string, any>;
  schemaId: string;
  userId: string;
}

export interface EntityValidationResult {
  isValid: boolean;
  errors: string[];
  validatedData: Record<string, any>;
}

export class EntityService {
  /**
   * Create a new entity instance
   */
  static async createEntity(request: CreateEntityRequest): Promise<Entity> {
    // Validate the schema exists
    const schema = await schemaRepository.findOne({
      where: { id: request.schemaId }
    });

    if (!schema) {
      throw new Error('Schema not found');
    }

    // Validate the user exists
    const user = await userRepository.findOne({
      where: { id: request.userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Validate the entity data against the schema
    const validation = this.validateEntityData(request.data, schema.schema);
    if (!validation.isValid) {
      throw new Error(`Entity validation failed: ${validation.errors.join(', ')}`);
    }

    // Create the entity
    const entity = entityRepository.create({
      name: request.name,
      displayName: request.displayName,
      data: validation.validatedData,
      schemaId: request.schemaId,
      userId: request.userId,
      isSystem: false
    });

    return await entityRepository.save(entity);
  }

  /**
   * Get all entities for a user
   */
  static async getEntitiesByUser(userId: string): Promise<Entity[]> {
    return await entityRepository.find({
      where: { userId },
      relations: ['schema'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Get all entities for a specific schema
   */
  static async getEntitiesBySchema(schemaId: string, userId: string): Promise<Entity[]> {
    return await entityRepository.find({
      where: { schemaId, userId },
      relations: ['schema'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Get a specific entity by ID
   */
  static async getEntityById(entityId: string, userId: string): Promise<Entity | null> {
    return await entityRepository.findOne({
      where: { id: entityId, userId },
      relations: ['schema']
    });
  }

  /**
   * Update an entity
   */
  static async updateEntity(entityId: string, userId: string, data: Record<string, any>): Promise<Entity> {
    const entity = await this.getEntityById(entityId, userId);
    if (!entity) {
      throw new Error('Entity not found');
    }

    // Validate the new data against the schema
    const validation = this.validateEntityData(data, entity.schema.schema);
    if (!validation.isValid) {
      throw new Error(`Entity validation failed: ${validation.errors.join(', ')}`);
    }

    entity.data = validation.validatedData;
    entity.updatedAt = new Date();

    return await entityRepository.save(entity);
  }

  /**
   * Delete an entity
   */
  static async deleteEntity(entityId: string, userId: string): Promise<void> {
    const entity = await this.getEntityById(entityId, userId);
    if (!entity) {
      throw new Error('Entity not found');
    }

    await entityRepository.remove(entity);
  }

  /**
   * Validate entity data against schema
   */
  static validateEntityData(data: Record<string, any>, schema: any): EntityValidationResult {
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
}
