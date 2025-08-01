import { AppDataSource } from '../config/database';
import { Application } from '../entities/Application';
import { User } from '../entities/User';
import { Model } from '../entities/Model';
import { buildApplication } from '../services/buildService';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Mock the exec function to avoid Docker builds in unit tests
jest.mock('child_process', () => ({
  exec: jest.fn().mockImplementation((cmd, callback) => {
    // Simulate successful Docker build
    callback(null, { stdout: 'Docker build successful', stderr: '' });
  })
}));

describe('Build Service Unit Tests', () => {
  let testUser: User;
  let testModel: Model;
  let testApplication: Application;

  beforeAll(async () => {
    // Initialize database connection
    await AppDataSource.initialize();

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

  it('should build an application successfully', async () => {
    // Build the application
    await buildApplication(testApplication.id);

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
  });

  it('should handle build failures gracefully', async () => {
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

    // Try to build the invalid application
    await buildApplication(invalidApplication.id);

    // Verify the application status was updated to failed
    const updatedApplication = await applicationRepository.findOne({
      where: { id: invalidApplication.id }
    });

    expect(updatedApplication).toBeDefined();
    expect(updatedApplication!.status).toBe('failed');

    // Clean up
    await applicationRepository.remove(invalidApplication);
  });

  it('should update application status during build process', async () => {
    // Start the build process
    const buildPromise = buildApplication(testApplication.id);

    // Check status during build (should be 'building')
    await new Promise(resolve => setTimeout(resolve, 1000));

    const applicationRepository = AppDataSource.getRepository(Application);
    const buildingApplication = await applicationRepository.findOne({
      where: { id: testApplication.id }
    });

    expect(buildingApplication).toBeDefined();
    expect(['building', 'built']).toContain(buildingApplication!.status);

    // Wait for build to complete
    await buildPromise;

    // Verify final status
    const finalApplication = await applicationRepository.findOne({
      where: { id: testApplication.id }
    });

    expect(finalApplication).toBeDefined();
    expect(finalApplication!.status).toBe('built');
  });
});
