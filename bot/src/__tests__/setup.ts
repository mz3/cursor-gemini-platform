import 'reflect-metadata';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5433';
process.env.DB_USER = 'platform_user';
process.env.DB_PASSWORD = 'platform_password';
process.env.DB_NAME = 'platform_db';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
