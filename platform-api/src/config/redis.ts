import { createClient } from 'redis';

export const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

export const initializeRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    console.log('Redis connection established');
  } catch (error) {
    console.error('Error connecting to Redis:', error);
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
