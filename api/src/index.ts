import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database.js';
import { initializeRedis } from './config/redis.js';
import { modelRoutes } from './routes/modelRoutes.js';
import { relationshipRoutes } from './routes/relationshipRoutes.js';
import { applicationRoutes } from './routes/applicationRoutes.js';
import { userRoutes } from './routes/userRoutes.js';
import { workflowRoutes } from './routes/workflowRoutes.js';
import promptRoutes from './routes/promptRoutes.js';
import { botRoutes } from './routes/botRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { seedDatabase } from './utils/seedDatabase.js';

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
app.use('/api/models', modelRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/bots', botRoutes);
console.log('✅ API routes configured');

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

    console.log('🌱 Seeding database with initial data...');
    // Seed database with initial data
    await seedDatabase();
    console.log('✅ Database seeded successfully');

    console.log(`🚀 Starting HTTP server on port ${PORT}...`);
    // Start server
    app.listen(PORT, () => {
      console.log(`🎉 Platform API server running on port ${PORT}`);
      console.log(`🌐 Health check available at: http://localhost:${PORT}/health`);
      console.log(`📊 API endpoints available at: http://localhost:${PORT}/api/*`);
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
