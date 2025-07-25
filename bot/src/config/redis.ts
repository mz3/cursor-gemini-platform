import { createClient } from 'redis';

export const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

export const initializeRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    console.log('Bot Redis connection established');
  } catch (error) {
    console.error('Error connecting to Redis:', error);
    throw error;
  }
};

export const consumeEvent = async (queue: string): Promise<any | null> => {
  try {
    const result = await redisClient.rPop(queue);
    return result ? JSON.parse(result) : null;
  } catch (error) {
    console.error('Error consuming event:', error);
    return null;
  }
};
