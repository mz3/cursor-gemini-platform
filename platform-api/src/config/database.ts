import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Model } from '../entities/Model';
import { Application } from '../entities/Application';
import { Component } from '../entities/Component';
import { Template } from '../entities/Template';
import { Workflow } from '../entities/Workflow';
import { WorkflowAction } from '../entities/WorkflowAction';
import { CodeTemplate } from '../entities/CodeTemplate';
import { Relationship } from '../entities/Relationship';
import { Prompt } from '../entities/Prompt';
import { PromptVersion } from '../entities/PromptVersion';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'platform_user',
  password: process.env.DB_PASSWORD || 'platform_password',
  database: process.env.DB_NAME || 'platform_db',
  synchronize: true, // Enable for initial deployment to create tables - will be disabled after first run
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    Model,
    Application,
    Workflow,
    WorkflowAction,
    Component,
    Template,
    CodeTemplate,
    Relationship,
    Prompt,
    PromptVersion
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('🔌 Attempting to connect to database...');
    console.log('📊 Database config:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      database: process.env.DB_NAME || 'platform_db',
      username: process.env.DB_USER || 'platform_user',
      synchronize: process.env.NODE_ENV !== 'production',
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
