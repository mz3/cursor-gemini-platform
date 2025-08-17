import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Relation } from 'typeorm';
import { User } from './User.js';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

@Entity('secrets')
export class Secret {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  key!: string;

  @Column({ type: 'text' })
  encryptedValue!: string;

  @Column({ default: 'api_key' })
  type!: 'api_key' | 'oauth_token' | 'bearer_token' | 'basic_auth' | 'custom';

  @Column({ nullable: true })
  provider?: string; // e.g., 'openai', 'anthropic', 'github', etc.

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: Relation<User>;

  @Column()
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Static method to encrypt a value
  static encrypt(value: string): string {
    const algorithm = 'aes-256-cbc';
    const password = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32-chars';

    // Generate a random IV for each encryption
    const iv = randomBytes(16);

    // Derive key from password
    const key = scryptSync(password, 'salt', 32);

    const cipher = createCipheriv(algorithm, key, iv);
    let encrypted: string = cipher.update(value, 'utf8', 'hex') as string;
    encrypted += cipher.final('hex') as string;

    // Prepend IV to encrypted data
    return iv.toString('hex') + ':' + encrypted;
  }

  // Static method to decrypt a value
  static decrypt(encryptedValue: string): string {
    const algorithm = 'aes-256-cbc';
    const password = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32-chars';

    // Split IV and encrypted data
    const parts = encryptedValue.split(':');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error('Invalid encrypted value format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    // Derive key from password
    const key = scryptSync(password, 'salt', 32);

    const decipher = createDecipheriv(algorithm, key, iv);
    let decrypted: string = decipher.update(encrypted, 'hex', 'utf8') as string;
    decrypted += decipher.final('utf8') as string;
    return decrypted;
  }

  // Instance method to get decrypted value
  getDecryptedValue(): string {
    return Secret.decrypt(this.encryptedValue);
  }

  // Instance method to set encrypted value
  setEncryptedValue(value: string): void {
    this.encryptedValue = Secret.encrypt(value);
  }
}
