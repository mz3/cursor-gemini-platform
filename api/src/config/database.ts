import { DataSource } from 'typeorm';
import { fileURLToPath } from 'url';
import path from 'path';
import { User } from '../entities/User.js';
import { Schema } from '../entities/Schema.js';
import { Application } from '../entities/Application.js';
import { Component } from '../entities/Component.js';
import { Template } from '../entities/Template.js';
import { Workflow } from '../entities/Workflow.js';
import { WorkflowAction } from '../entities/WorkflowAction.js';
import { CodeTemplate } from '../entities/CodeTemplate.js';
import { Relationship } from '../entities/Relationship.js';
import { Prompt } from '../entities/Prompt.js';
import { PromptVersion } from '../entities/PromptVersion.js';
import { UserSettings } from '../entities/UserSettings.js';
import { Bot } from '../entities/Bot.js';
import { BotInstance } from '../entities/BotInstance.js';
import { BotTool } from '../entities/BotTool.js';
import { ChatMessage } from '../entities/ChatMessage.js';
import { Feature } from '../entities/Feature.js';
import { Entity } from '../entities/Entity.js';

// Helper to determine if running from dist (production build), ESM compatible
// Use a different approach for test environment to avoid import.meta issues
const isDist = process.env.NODE_ENV === 'production' ||
               (typeof __filename !== 'undefined' && __filename.includes('/dist/')) ||
               (typeof __filename !== 'undefined' && __filename.includes('\\dist\\'));

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'platform_user',
  password: process.env.DB_PASSWORD || 'platform_password',
  database: process.env.DB_NAME || 'platform_db',
  synchronize: false, // Disabled for production - use migrations instead
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    UserSettings,
    Schema,
    Application,
    Workflow,
    WorkflowAction,
    Component,
    Template,
    CodeTemplate,
    Relationship,
    Prompt,
    PromptVersion,
    Bot,
    BotInstance,
    BotTool,
    ChatMessage,
    Feature,
    Entity
  ],
  migrations: [
    isDist ? 'dist/migrations/*.js' : 'src/migrations/*.ts'
  ],
  subscribers: [
    isDist ? 'dist/subscribers/*.js' : 'src/subscribers/*.ts'
  ],
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('🔌 Attempting to connect to database...');
    console.log('📊 Database config:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      database: process.env.DB_NAME || 'platform_db',
      username: process.env.DB_USER || 'platform_user',
      synchronize: false,
      logging: process.env.NODE_ENV === 'development'
    });

    await AppDataSource.initialize();
    console.log('✅ Database connection established successfully');
    console.log('📊 Database is ready for queries');
  } catch (error) {
    console.error('❌ Error connecting to database:', error);
    console.error('🔍 Database connection failed. Check your database configuration and ensure the database is running.');
    throw error;
  }
};
