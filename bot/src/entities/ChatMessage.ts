import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Relation } from 'typeorm';
import { BotInstance } from './BotInstance.js';
import { User } from './User.js';

export enum MessageRole {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system'
}

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => BotInstance, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'botInstanceId' })
  botInstance!: Relation<BotInstance>;

  @Column()
  botInstanceId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: Relation<User>;

  @Column()
  userId!: string;

  @Column({
    type: 'enum',
    enum: MessageRole,
    default: MessageRole.USER
  })
  role!: MessageRole;

  @Column('text')
  content!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  responseTime?: number; // in milliseconds

  @Column({ nullable: true })
  tokensUsed?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 