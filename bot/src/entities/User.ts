import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Relation } from 'typeorm';
import { Application } from './Application.js';
import { Prompt } from './Prompt.js';
import { Bot } from './Bot.js';
import { Model } from './Model.js';
import { Feature } from './Feature.js';
import { Entity as PlatformEntity } from './Entity.js';
import { BotInstance } from './BotInstance.js';
import { ChatMessage } from './ChatMessage.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ default: 'user' })
  role!: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Application, (application: Application) => application.user)
  applications!: Relation<Application>[];

  @OneToMany(() => Prompt, (prompt: Prompt) => prompt.user)
  prompts!: Relation<Prompt>[];

  @OneToMany(() => Bot, (bot: Bot) => bot.user)
  bots!: Relation<Bot>[];

  @OneToMany(() => Model, (model: Model) => model.user)
  models!: Relation<Model>[];

  @OneToMany(() => Feature, (feature: Feature) => feature.user)
  features!: Relation<Feature>[];

  @OneToMany(() => PlatformEntity, (entity: PlatformEntity) => entity.user)
  entities!: Relation<PlatformEntity>[];

  @OneToMany(() => BotInstance, (instance: BotInstance) => instance.user)
  botInstances!: Relation<BotInstance>[];

  @OneToMany(() => ChatMessage, (message: ChatMessage) => message.user)
  chatMessages!: Relation<ChatMessage>[];
}
