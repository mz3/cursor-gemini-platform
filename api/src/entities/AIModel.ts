import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Relation } from 'typeorm';
import { User } from './User.js';
import { Secret } from './Secret.js';

export type LLMProvider = 'gemini' | 'openai' | 'anthropic' | 'deepseek' | 'local';
export type LLMCapability = 'text' | 'vision' | 'code' | 'function_calling' | 'json_mode';

@Entity('ai_models')
export class AIModel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  displayName!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ['gemini', 'openai', 'anthropic', 'deepseek', 'local'],
    default: 'gemini'
  })
  provider!: LLMProvider;

  @Column()
  modelId!: string; // e.g., 'gemini-2.5-flash', 'gpt-4o', 'claude-3-5-sonnet', etc.

  @Column({ nullable: true })
  apiVersion?: string; // API version for the provider

  @Column({ nullable: true })
  baseUrl?: string; // For local LLMs or custom endpoints

  @Column('simple-array', { nullable: true })
  capabilities?: LLMCapability[];

  @Column('json', { nullable: true })
  configuration?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    stopSequences?: string[];
    systemPrompt?: string;
  };

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isDefault!: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: Relation<User>;

  @Column()
  userId!: string;

  @ManyToOne(() => Secret, { nullable: true, onDelete: 'SET NULL' })
  secret?: Relation<Secret>;

  @Column({ nullable: true })
  secretId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
