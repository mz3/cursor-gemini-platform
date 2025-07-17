import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';
import { modelRoutes } from './routes/modelRoutes';
import { applicationRoutes } from './routes/applicationRoutes';
import { userRoutes } from './routes/userRoutes';
import { workflowRoutes } from './routes/workflowRoutes';
import { errorHandler } from './middleware/errorHandler';
import { seedDatabase } from './utils/seedDatabase';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/models', modelRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workflows', workflowRoutes);

// Error handling
app.use(errorHandler);

// Initialize and start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    // Initialize Redis
    await initializeRedis();

    // Seed database with initial data
    await seedDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`Platform API server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

export { app };
