import 'reflect-metadata';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';
import { startWorker } from './services/workerService';

dotenv.config();

async function main() {
  try {
    console.log('Starting platform worker...');

    // Initialize database connection
    await initializeDatabase();
    console.log('Database connection established');

    // Initialize Redis connection
    await initializeRedis();
    console.log('Redis connection established');

    // Start the worker
    await startWorker();
    console.log('Worker started successfully');
  } catch (error) {
    console.error('Failed to start worker:', error);
    process.exit(1);
  }
}

main();
