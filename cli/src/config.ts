import dotenv from 'dotenv';
import { NotionConfig } from './types';

dotenv.config();

export function getConfig(): NotionConfig {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!token) {
    throw new Error('NOTION_TOKEN environment variable is required. Please set it in your .env file.');
  }

  if (!databaseId) {
    throw new Error('NOTION_DATABASE_ID environment variable is required. Please set it in your .env file.');
  }

  return {
    token,
    databaseId,
    defaultStatus: process.env.DEFAULT_STATUS || 'Backlog',
    defaultPriority: process.env.DEFAULT_PRIORITY || 'Medium'
  };
}
