import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Relation } from 'typeorm';
import { Bot } from './Bot.js';
import { User } from './User.js';
import { ChatMessage } from './ChatMessage.js';

export enum BotInstanceStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
  ERROR = 'error',
  STARTING = 'starting',
  STOPPING = 'stopping'
}

@Entity('bot_instances')
export class BotInstance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Bot, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'botId' })
  bot!: Relation<Bot>;

  @Column()
  botId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: Relation<User>;

  @Column()
  userId!: string;

  @Column({
    type: 'enum',
    enum: BotInstanceStatus,
    default: BotInstanceStatus.STOPPED
  })
  status!: BotInstanceStatus;

  @Column({ nullable: true })
  lastStartedAt?: Date;

  @Column({ nullable: true })
  lastStoppedAt?: Date;

  @Column({ nullable: true })
  errorMessage?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @OneToMany(() => ChatMessage, (message: ChatMessage) => message.botInstance)
  messages!: Relation<ChatMessage>[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 