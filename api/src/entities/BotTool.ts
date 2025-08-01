import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Relation } from 'typeorm';
import { Bot } from './Bot.js';

export enum ToolType {
  HTTP_REQUEST = 'http_request',
  DATABASE_QUERY = 'database_query',
  FILE_OPERATION = 'file_operation',
  SHELL_COMMAND = 'shell_command',
  CUSTOM_SCRIPT = 'custom_script',
  WORKFLOW_ACTION = 'workflow_action'
}

@Entity('bot_tools')
export class BotTool {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  displayName!: string;

  @Column('text')
  description!: string;

  @Column({
    type: 'enum',
    enum: ToolType
  })
  type!: ToolType;

  @Column('jsonb')
  config!: Record<string, any>; // Tool-specific configuration

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  requiresAuth!: boolean; // Whether tool needs user authentication

  @ManyToOne(() => Bot, { onDelete: 'CASCADE' })
  bot!: Relation<Bot>;

  @Column()
  botId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
