import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Model } from '../entities/Model';
import { Application } from '../entities/Application';
import { Component } from '../entities/Component';
import { Template } from '../entities/Template';
import { Workflow } from '../entities/Workflow';
import { WorkflowAction } from '../entities/WorkflowAction';
import { CodeTemplate } from '../entities/CodeTemplate';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'platform_user',
  password: process.env.DB_PASSWORD || 'platform_password',
  database: process.env.DB_NAME || 'platform_db',
  synchronize: false,
  logging: false,
  entities: [User, Model, Application, Component, Template, Workflow, WorkflowAction, CodeTemplate],
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('Worker database connection established');
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};
