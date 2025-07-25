import 'reflect-metadata';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';
import { startBot } from './services/botService';

dotenv.config();

async function main() {
  try {
    console.log('Starting platform bot...');

    // Initialize database connection
    await initializeDatabase();
    console.log('Database connection established');

    // Initialize Redis connection
    await initializeRedis();
    console.log('Redis connection established');

    // Start the bot
    await startBot();
    console.log('Bot started successfully');
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

main();
