import { AppDataSource } from '../config/database';
import { consumeEvent } from '../config/redis';
import { Application } from '../entities/Application';
import { CodeTemplate } from '../entities/CodeTemplate';
import { buildApplication } from './buildService';

export const startWorker = async (): Promise<void> => {
  console.log('Starting worker service...');

  // Start listening to queues
  setInterval(async () => {
    await processAppBuilds();
  }, 1000);

  console.log('Worker service started, listening for jobs...');
};

const processAppBuilds = async (): Promise<void> => {
  try {
    const job = await consumeEvent('app_builds');

    if (job) {
      console.log('Processing app build job:', job);

      const { application_id, action } = job;

      if (action === 'build') {
        await buildApplication(application_id);
      }
    }
  } catch (error) {
    console.error('Error processing app build job:', error);
  }
};
