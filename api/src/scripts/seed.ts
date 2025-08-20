#!/usr/bin/env node

import 'reflect-metadata';
import dotenv from 'dotenv';
import { initializeDatabase } from '../config/database.js';
// import { seedDatabase } from '../utils/seedDatabase.js';

// Load environment variables
dotenv.config();

console.log('🌱 Starting database seeding...');
console.log('📅 Current time:', new Date().toISOString());

async function runSeeding() {
  try {
    console.log('🔌 Initializing database connection...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    console.log('🌱 Seeding database with initial data...');
    // await seedDatabase();
    console.log('✅ Database seeded successfully (disabled)');

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Failed to seed database:', error);
    console.error('🔍 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    process.exit(1);
  }
}

runSeeding();
