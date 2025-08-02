import { createClient } from 'redis';

export const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

export const initializeRedis = async (): Promise<void> => {
  try {
    console.log('🔴 Attempting to connect to Redis...');
    console.log('📊 Redis config:', {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || '6379',
      url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
    });

    await redisClient.connect();
    console.log('✅ Redis connection established successfully');
    console.log('🔴 Redis is ready for operations');
  } catch (error) {
    console.error('❌ Error connecting to Redis:', error);
    console.error('🔍 Redis connection failed. Check your Redis configuration and ensure Redis is running.');
    throw error;
  }
};

export const publishEvent = async (queue: string, payload: any): Promise<void> => {
  try {
    await redisClient.lPush(queue, JSON.stringify(payload));
    console.log(`Event published to queue: ${queue}`);
  } catch (error) {
    console.error('Error publishing event:', error);
    throw error;
  }
};

export const subscribeToEvent = async (queue: string, callback: (payload: any) => Promise<void>): Promise<void> => {
  try {
    console.log(`🔴 Subscribing to Redis queue: ${queue}`);
    
    // Start listening for messages
    const pollMessages = async () => {
      try {
        const message = await redisClient.rPop(queue);
        if (message) {
          const payload = JSON.parse(message);
          await callback(payload);
        }
      } catch (error) {
        console.error(`Error processing message from queue ${queue}:`, error);
      }
      
      // Continue polling
      setTimeout(pollMessages, 100);
    };
    
    pollMessages();
    console.log(`✅ Successfully subscribed to Redis queue: ${queue}`);
  } catch (error) {
    console.error(`❌ Error subscribing to Redis queue ${queue}:`, error);
    throw error;
  }
};
