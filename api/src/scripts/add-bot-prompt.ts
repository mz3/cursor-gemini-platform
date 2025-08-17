#!/usr/bin/env node

import 'reflect-metadata';
import dotenv from 'dotenv';
import { initializeDatabase } from '../config/database.js';
import { AppDataSource } from '../config/database.js';

// Load environment variables
dotenv.config();

async function addBotPrompt() {
  try {
    console.log('🔌 Initializing database connection...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    const botId = 'db9f524e-b6cc-40b1-8edc-8811ec4fd8ac'; // CI/CD bot
    const promptId = '0f2fb889-37ed-48d0-95d7-81cd8f55f9d0'; // platform-support prompt

    // Check if the bot prompt already exists
    const existingPrompt = await AppDataSource.query(
      'SELECT * FROM bot_prompts WHERE "botId" = $1 AND "promptId" = $2',
      [botId, promptId]
    );

    if (existingPrompt.length > 0) {
      console.log('✅ Bot prompt already exists');
      return;
    }

    // Add the bot prompt
    await AppDataSource.query(
      'INSERT INTO bot_prompts ("botId", "promptId") VALUES ($1, $2)',
      [botId, promptId]
    );

    console.log('✅ Added platform-support prompt to CI/CD bot');
    console.log(`Bot ID: ${botId}`);
    console.log(`Prompt ID: ${promptId}`);

    process.exit(0);
  } catch (error) {
    console.error('💥 Failed to add bot prompt:', error);
    process.exit(1);
  }
}

addBotPrompt();
