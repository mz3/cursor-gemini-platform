export interface EnvironmentConfig {
  // Database
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
  
  // Redis
  REDIS_HOST: string;
  REDIS_PORT: number;
  
  // API
  API_PORT: number;
  NODE_ENV: string;
  
  // Gemini AI
  GEMINI_API_KEY: string;
}

export const config: EnvironmentConfig = {
  // Database
  DB_HOST: process.env.DB_HOST || 'postgres',
  DB_PORT: parseInt(process.env.DB_PORT || '5432'),
  DB_USERNAME: process.env.DB_USERNAME || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DB_DATABASE: process.env.DB_DATABASE || 'platform',
  
  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'redis',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379'),
  
  // API
  API_PORT: parseInt(process.env.API_PORT || '4000'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Gemini AI
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};

export default config; 