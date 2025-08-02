import 'reflect-metadata';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';
import { startBotWorker } from './services/botWorkerService';

dotenv.config();

async function main() {
  try {
    console.log('🚀 Starting Bot Processing Worker...');

    // Initialize database connection
    await initializeDatabase();
    console.log('✅ Database connection established');

    // Initialize Redis connection
    await initializeRedis();
    console.log('✅ Redis connection established');

    // Start the bot processing worker
    await startBotWorker();
    console.log('✅ Bot processing worker started successfully');
  } catch (error) {
    console.error('❌ Failed to start bot worker:', error);
    process.exit(1);
  }
}

main();
