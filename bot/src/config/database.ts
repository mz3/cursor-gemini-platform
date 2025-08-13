import { DataSource } from 'typeorm';
import { User } from '../entities/User.js';
import { Model } from '../entities/Model.js';
import { Application } from '../entities/Application.js';
import { Component } from '../entities/Component.js';
import { Bot } from '../entities/Bot.js';
import { BotInstance } from '../entities/BotInstance.js';
import { ChatMessage } from '../entities/ChatMessage.js';
import { BotTool } from '../entities/BotTool.js';
import { Feature } from '../entities/Feature.js';
import { Prompt } from '../entities/Prompt.js';
import { PromptVersion } from '../entities/PromptVersion.js';
import { Entity } from '../entities/Entity.js';
import { Workflow } from '../entities/Workflow.js';
import { WorkflowAction } from '../entities/WorkflowAction.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'platform_user',
  password: process.env.DB_PASSWORD || 'platform_password',
  database: process.env.DB_NAME || 'platform_db',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    Model,
    Application,
    Component,
    Bot,
    BotInstance,
    ChatMessage,
    BotTool,
    Feature,
    Prompt,
    PromptVersion,
    Entity,
    Workflow,
    WorkflowAction
  ],
  migrations: [],
  subscribers: [],
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('Bot database connection established');
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};
