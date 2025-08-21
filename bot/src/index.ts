import 'reflect-metadata';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database.js';
import { initializeRedis } from './config/redis.js';
import { startBotWorker, stopBotWorker } from './services/botWorkerService.js';

dotenv.config();

let isShuttingDown = false;

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
    if (!isShuttingDown) {
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  isShuttingDown = true;
  await stopBotWorker();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  isShuttingDown = true;
  await stopBotWorker();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  if (!isShuttingDown) {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  if (!isShuttingDown) {
    process.exit(1);
  }
});

main();
