// IMPORTANT: Import Sentry instrument first
import './instrument.js';

import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initializeDatabase } from './config/database.js';
import { initializeRedis } from './config/redis.js';
import * as Sentry from '@sentry/node';
import { schemaRoutes } from './routes/schemaRoutes.js';
import { relationshipRoutes } from './routes/relationshipRoutes.js';
import { applicationRoutes } from './routes/applicationRoutes.js';
import { userRoutes } from './routes/userRoutes.js';
import { workflowRoutes } from './routes/workflowRoutes.js';
import promptRoutes from './routes/promptRoutes.js';
import { botRoutes } from './routes/botRoutes.js';
import botExecutionRoutes from './routes/botExecutionRoutes.js';
import botToolRoutes from './routes/botToolRoutes.js';
import { featureRoutes } from './routes/featureRoutes.js';
import entityRoutes from './routes/entityRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { secretRoutes } from './routes/secretRoutes.js';
import { serviceRoutes } from './routes/serviceRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

import ChatWebSocketServer from './websocket/chatServer.js';
import MessageHandler from './websocket/messageHandler.js';
import BotResponseService from './services/botResponseService.js';

console.log('🚀 Starting Platform API...');
console.log('📅 Current time:', new Date().toISOString());
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

dotenv.config();

console.log('📋 Environment variables loaded');
console.log('🔧 API_PORT:', process.env.API_PORT || '4000 (default)');
console.log('🔧 API_PORT type:', typeof process.env.API_PORT);
console.log('🔧 API_PORT value:', JSON.stringify(process.env.API_PORT));
console.log('🗄️ DB_HOST:', process.env.DB_HOST || 'localhost (default)');
console.log('🗄️ DB_PORT:', process.env.DB_PORT || '5432 (default)');
console.log('🗄️ DB_NAME:', process.env.DB_NAME || 'platform_db (default)');
console.log('🗄️ DB_USER:', process.env.DB_USER || 'platform_user (default)');
console.log('🔴 REDIS_HOST:', process.env.REDIS_HOST || 'localhost (default)');
console.log('🔴 REDIS_PORT:', process.env.REDIS_PORT || '6379 (default)');

const app = express();
const server = createServer(app);
const PORT = parseInt(process.env.API_PORT || '4000', 10);
console.log('🔧 Final PORT value:', PORT);
console.log('🔧 Final PORT type:', typeof PORT);

console.log('🔧 Setting up Express middleware...');

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

console.log('✅ Express middleware configured');

// Health check
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

console.log('🏥 Health check endpoint configured');

// API Routes
console.log('🛣️ Setting up API routes...');
app.use('/api/schemas', schemaRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/bots', botRoutes);
app.use('/api/bot-execution', botExecutionRoutes);
app.use('/api/bot-tools', botToolRoutes);
app.use('/api/features', featureRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/secrets', secretRoutes);
app.use('/api/services', serviceRoutes);

console.log('✅ API routes configured');

// The error handler must be registered before any other error middleware and after all controllers
if (process.env.NODE_ENV !== 'development') {
  Sentry.setupExpressErrorHandler(app);
}

// Error handling
app.use(errorHandler);
console.log('⚠️ Error handler configured');

// Initialize and start server
async function startServer() {
  try {
    console.log('🔌 Initializing database connection...');
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    console.log('🔴 Initializing Redis connection...');
    // Initialize Redis
    await initializeRedis();
    console.log('✅ Redis initialized successfully');



    console.log(`🚀 Starting HTTP server on port ${PORT}...`);

    // Initialize WebSocket server
    const wsServer = new ChatWebSocketServer(server);
    const messageHandler = MessageHandler.getInstance();
    messageHandler.setWebSocketServer(wsServer);

    console.log('🔌 WebSocket server initialized');

    // Start bot response listener
    console.log('🤖 Initializing bot response service...');
    const botResponseService = BotResponseService.getInstance();
    console.log('🤖 Bot response service instance created');
    await botResponseService.startListening();

    console.log('🤖 Bot response listener started');

    // Start server
    server.listen(PORT, () => {
      console.log(`🎉 Platform API server running on port ${PORT}`);
      console.log(`🌐 Health check available at: http://localhost:${PORT}/health`);
      console.log(`📊 API endpoints available at: http://localhost:${PORT}/api/*`);
      console.log(`🔌 WebSocket server available at: ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    console.error('🔍 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    process.exit(1);
  }
}

// Remove require.main === module check for ESM compatibility
// Just run the bootstrap logic unconditionally
startServer();

export { app };
