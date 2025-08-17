import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.js';
import { Secret } from '../entities/Secret.js';
import { User } from '../entities/User.js';

export interface CreateSecretDto {
  name: string;
  description?: string;
  key: string;
  value: string;
  type: 'api_key' | 'oauth_token' | 'bearer_token' | 'basic_auth' | 'custom';
  provider?: string;
}

export interface UpdateSecretDto {
  name?: string;
  description?: string;
  key?: string;
  value?: string;
  type?: 'api_key' | 'oauth_token' | 'bearer_token' | 'basic_auth' | 'custom';
  provider?: string;
  isActive?: boolean;
}

export interface SecretSummary {
  id: string;
  name: string;
  description?: string;
  key: string;
  type: string;
  provider?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  hasValue: boolean;
}

export class SecretService {
  private secretRepository: Repository<Secret>;
  private userRepository: Repository<User>;

  constructor() {
    this.secretRepository = AppDataSource.getRepository(Secret);
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Get all secrets for a user (without decrypted values for security)
   */
  async findAll(userId: string): Promise<SecretSummary[]> {
    const secrets = await this.secretRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });

    return secrets.map(secret => ({
      id: secret.id,
      name: secret.name,
      description: secret.description,
      key: secret.key,
      type: secret.type,
      provider: secret.provider,
      isActive: secret.isActive,
      createdAt: secret.createdAt,
      updatedAt: secret.updatedAt,
      hasValue: !!secret.encryptedValue
    }));
  }

  /**
   * Get a specific secret by ID (without decrypted value for security)
   */
  async findById(id: string, userId: string): Promise<SecretSummary | null> {
    const secret = await this.secretRepository.findOne({
      where: { id, userId }
    });

    if (!secret) {
      return null;
    }

    return {
      id: secret.id,
      name: secret.name,
      description: secret.description,
      key: secret.key,
      type: secret.type,
      provider: secret.provider,
      isActive: secret.isActive,
      createdAt: secret.createdAt,
      updatedAt: secret.updatedAt,
      hasValue: !!secret.encryptedValue
    };
  }

  /**
   * Get a secret by name for internal use (with decrypted value)
   * This method should only be used by internal services that need the actual secret value
   */
  async getSecretValueByName(name: string, userId: string): Promise<string | null> {
    const secret = await this.secretRepository.findOne({
      where: { name, userId, isActive: true }
    });

    if (!secret) {
      return null;
    }

    try {
      return secret.getDecryptedValue();
    } catch (error) {
      console.error(`Failed to decrypt secret ${name} for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get a secret by key for internal use (with decrypted value)
   * This method should only be used by internal services that need the actual secret value
   */
  async getSecretValueByKey(key: string, userId: string): Promise<string | null> {
    const secret = await this.secretRepository.findOne({
      where: { key, userId, isActive: true }
    });

    if (!secret) {
      return null;
    }

    try {
      return secret.getDecryptedValue();
    } catch (error) {
      console.error(`Failed to decrypt secret with key ${key} for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Create a new secret
   */
  async create(dto: CreateSecretDto, userId: string): Promise<SecretSummary> {
    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Check if secret with same name already exists for this user
    const existingSecret = await this.secretRepository.findOne({
      where: { name: dto.name, userId }
    });

    if (existingSecret) {
      throw new Error('A secret with this name already exists');
    }

    // Create the secret
    const secret = new Secret();
    secret.name = dto.name;
    secret.description = dto.description;
    secret.key = dto.key;
    secret.type = dto.type;
    secret.provider = dto.provider;
    secret.userId = userId;
    secret.setEncryptedValue(dto.value);

    const savedSecret = await this.secretRepository.save(secret);

    return {
      id: savedSecret.id,
      name: savedSecret.name,
      description: savedSecret.description,
      key: savedSecret.key,
      type: savedSecret.type,
      provider: savedSecret.provider,
      isActive: savedSecret.isActive,
      createdAt: savedSecret.createdAt,
      updatedAt: savedSecret.updatedAt,
      hasValue: true
    };
  }

  /**
   * Update a secret
   */
  async update(id: string, dto: UpdateSecretDto, userId: string): Promise<SecretSummary> {
    const secret = await this.secretRepository.findOne({
      where: { id, userId }
    });

    if (!secret) {
      throw new Error('Secret not found');
    }

    // Check if name is being changed and if it conflicts with existing secret
    if (dto.name && dto.name !== secret.name) {
      const existingSecret = await this.secretRepository.findOne({
        where: { name: dto.name, userId }
      });

      if (existingSecret) {
        throw new Error('A secret with this name already exists');
      }
    }

    // Update fields
    if (dto.name !== undefined) secret.name = dto.name;
    if (dto.description !== undefined) secret.description = dto.description;
    if (dto.key !== undefined) secret.key = dto.key;
    if (dto.type !== undefined) secret.type = dto.type;
    if (dto.provider !== undefined) secret.provider = dto.provider;
    if (dto.isActive !== undefined) secret.isActive = dto.isActive;
    if (dto.value !== undefined) secret.setEncryptedValue(dto.value);

    const updatedSecret = await this.secretRepository.save(secret);

    return {
      id: updatedSecret.id,
      name: updatedSecret.name,
      description: updatedSecret.description,
      key: updatedSecret.key,
      type: updatedSecret.type,
      provider: updatedSecret.provider,
      isActive: updatedSecret.isActive,
      createdAt: updatedSecret.createdAt,
      updatedAt: updatedSecret.updatedAt,
      hasValue: !!updatedSecret.encryptedValue
    };
  }

  /**
   * Delete a secret
   */
  async delete(id: string, userId: string): Promise<void> {
    const secret = await this.secretRepository.findOne({
      where: { id, userId }
    });

    if (!secret) {
      throw new Error('Secret not found');
    }

    await this.secretRepository.remove(secret);
  }

  /**
   * Test if a secret can be decrypted (for health checks)
   */
  async testDecryption(id: string, userId: string): Promise<boolean> {
    const secret = await this.secretRepository.findOne({
      where: { id, userId }
    });

    if (!secret) {
      return false;
    }

    try {
      secret.getDecryptedValue();
      return true;
    } catch (error) {
      return false;
    }
  }
}
