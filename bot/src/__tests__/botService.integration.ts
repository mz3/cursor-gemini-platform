import { AppDataSource } from '../config/database';
import { initializeRedis, publishEvent, redisClient } from '../config/redis';
import { Application } from '../entities/Application';
import { User } from '../entities/User';
import { Model } from '../entities/Model';
import { startBot } from '../services/botService';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

describe('Bot Service Integration Tests', () => {
  let testUser: User;
  let testModel: Model;
  let testApplication: Application;
  let botProcess: NodeJS.Timeout;

  beforeAll(async () => {
    // Initialize database connection
    await AppDataSource.initialize();

    // Initialize Redis connection
    await initializeRedis();

    // Create test user with unique email
    const userRepository = AppDataSource.getRepository(User);
    const uniqueEmail = `test-${uuidv4()}@example.com`;
    testUser = userRepository.create({
      email: uniqueEmail,
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    });
    await userRepository.save(testUser);

    // Create test model
    const modelRepository = AppDataSource.getRepository(Model);
    testModel = modelRepository.create({
      name: 'test-model',
      displayName: 'Test Model',
      schema: { fields: [] },
      isSystem: false,
      userId: testUser.id
    });
    await modelRepository.save(testModel);

    // Start the bot service
    await startBot();
  });

  afterAll(async () => {
    // Clean up test data in correct order (applications first, then models, then users)
    const applicationRepository = AppDataSource.getRepository(Application);
    const modelRepository = AppDataSource.getRepository(Model);
    const userRepository = AppDataSource.getRepository(User);

    // Clean up all applications for this test user
    const applications = await applicationRepository.find({
      where: { userId: testUser.id }
    });
    for (const app of applications) {
      await applicationRepository.remove(app);
    }

    if (testModel) {
      await modelRepository.remove(testModel);
    }
    if (testUser) {
      await userRepository.remove(testUser);
    }

    // Close Redis connection
    await redisClient.quit();

    // Close database connection
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    // Create test application before each test
    const applicationRepository = AppDataSource.getRepository(Application);
    testApplication = applicationRepository.create({
      name: 'test-app',
      displayName: 'Test Application',
      description: 'A test application for integration testing',
      config: { theme: 'light' },
      status: 'draft',
      userId: testUser.id,
      modelId: testModel.id
    });
    await applicationRepository.save(testApplication);
  });

  afterEach(async () => {
    // Clean up generated files
    if (testApplication && testApplication.name) {
      const appDir = path.join('/app/generated-apps', testApplication.name);
      if (await fs.pathExists(appDir)) {
        await fs.remove(appDir);
      }
    }
  });

  it('should process build job from Redis queue and build application successfully', async () => {
    // Publish a build job to Redis queue
    await publishEvent('app_builds', {
      application_id: testApplication.id,
      action: 'build'
    });

    // Wait longer for the bot to process the job and complete the build
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Verify the application status was updated
    const applicationRepository = AppDataSource.getRepository(Application);
    const updatedApplication = await applicationRepository.findOne({
      where: { id: testApplication.id }
    });

    expect(updatedApplication).toBeDefined();
    expect(updatedApplication!.status).toBe('built');

    // Verify the generated files exist
    const appDir = path.join('/app/generated-apps', testApplication.name);
    expect(await fs.pathExists(appDir)).toBe(true);
    expect(await fs.pathExists(path.join(appDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(appDir, 'public/index.html'))).toBe(true);
    expect(await fs.pathExists(path.join(appDir, 'src/App.js'))).toBe(true);
    expect(await fs.pathExists(path.join(appDir, 'Dockerfile'))).toBe(true);

    // Verify package.json content
    const packageJson = await fs.readJson(path.join(appDir, 'package.json'));
    expect(packageJson.name).toBe(testApplication.name);
    expect(packageJson.dependencies).toHaveProperty('react');
    expect(packageJson.dependencies).toHaveProperty('react-dom');

    // Verify index.html content
    const indexHtml = await fs.readFile(path.join(appDir, 'public/index.html'), 'utf-8');
    expect(indexHtml).toContain(testApplication.displayName);
    expect(indexHtml).toContain(testApplication.description);

    // Verify App.js content
    const appJs = await fs.readFile(path.join(appDir, 'src/App.js'), 'utf-8');
    expect(appJs).toContain(testApplication.displayName);
    expect(appJs).toContain(testApplication.description);
  }, 60000); // 60 second timeout for build process

  it('should handle multiple build jobs in sequence', async () => {
    // Create a second test application
    const applicationRepository = AppDataSource.getRepository(Application);
    const secondApplication = applicationRepository.create({
      name: 'test-app-2',
      displayName: 'Test Application 2',
      description: 'A second test application',
      config: { theme: 'dark' },
      status: 'draft',
      userId: testUser.id,
      modelId: testModel.id
    });
    await applicationRepository.save(secondApplication);

    try {
      // Publish first build job
      await publishEvent('app_builds', {
        application_id: testApplication.id,
        action: 'build'
      });

      // Publish second build job
      await publishEvent('app_builds', {
        application_id: secondApplication.id,
        action: 'build'
      });

      // Wait longer for both jobs to be processed
      await new Promise(resolve => setTimeout(resolve, 20000));

      // Verify both applications were built
      const firstApp = await applicationRepository.findOne({
        where: { id: testApplication.id }
      });
      const secondApp = await applicationRepository.findOne({
        where: { id: secondApplication.id }
      });

      expect(firstApp).toBeDefined();
      expect(firstApp!.status).toBe('built');
      expect(secondApp).toBeDefined();
      expect(secondApp!.status).toBe('built');

      // Verify both generated directories exist
      const firstAppDir = path.join('/app/generated-apps', testApplication.name);
      const secondAppDir = path.join('/app/generated-apps', secondApplication.name);

      expect(await fs.pathExists(firstAppDir)).toBe(true);
      expect(await fs.pathExists(secondAppDir)).toBe(true);
    } finally {
      // Clean up second application
      await applicationRepository.remove(secondApplication);
      const secondAppDir = path.join('/app/generated-apps', secondApplication.name);
      if (await fs.pathExists(secondAppDir)) {
        await fs.remove(secondAppDir);
      }
    }
  }, 90000); // 90 second timeout for multiple builds

  it('should handle build failures gracefully through Redis queue', async () => {
    // Create an application with invalid data to trigger a build failure
    const applicationRepository = AppDataSource.getRepository(Application);
    const invalidApplication = applicationRepository.create({
      name: '', // Invalid empty name
      displayName: 'Invalid App',
      description: 'An invalid application',
      config: { theme: 'light' },
      status: 'draft',
      userId: testUser.id,
      modelId: testModel.id
    });
    await applicationRepository.save(invalidApplication);

    try {
      // Publish build job for invalid application
      await publishEvent('app_builds', {
        application_id: invalidApplication.id,
        action: 'build'
      });

      // Wait for the bot to process the job
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Verify the application status was updated to failed
      const updatedApplication = await applicationRepository.findOne({
        where: { id: invalidApplication.id }
      });

      expect(updatedApplication).toBeDefined();
      expect(updatedApplication!.status).toBe('failed');
    } finally {
      // Clean up
      await applicationRepository.remove(invalidApplication);
    }
  }, 60000);

  it('should ignore jobs with invalid action', async () => {
    // Publish a job with invalid action
    await publishEvent('app_builds', {
      application_id: testApplication.id,
      action: 'invalid_action'
    });

    // Wait for the bot to process the job
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verify the application status remains unchanged
    const applicationRepository = AppDataSource.getRepository(Application);
    const updatedApplication = await applicationRepository.findOne({
      where: { id: testApplication.id }
    });

    expect(updatedApplication).toBeDefined();
    expect(updatedApplication!.status).toBe('draft'); // Should remain unchanged
  }, 30000);
});
