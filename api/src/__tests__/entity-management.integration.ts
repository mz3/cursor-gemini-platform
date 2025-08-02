import request from 'supertest';
import { AppDataSource } from '../config/database.ts';
import { User } from '../entities/User.js';
import { Model } from '../entities/Model.js';
import { Entity } from '../entities/Entity.js';

const API_BASE_URL = 'http://localhost:4000';

describe('Entity Management Integration Tests', () => {
  let testUser: User;
  let authToken: string;
  let testModel: Model;

  beforeAll(async () => {
    // Initialize database connection
    await AppDataSource.initialize();
  });

  beforeEach(async () => {
    // Create a test user
    const userRepository = AppDataSource.getRepository(User);
    testUser = userRepository.create({
      email: 'test@example.com',
      password: 'testpassword',
      firstName: 'Test',
      lastName: 'User'
    });
    await userRepository.save(testUser);

    // Login to get auth token
    const loginResponse = await request(API_BASE_URL)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword'
      })
      .expect(200);

    authToken = loginResponse.body.token;
  });

  afterEach(async () => {
    // Clean up test data
    const entityRepository = AppDataSource.getRepository(Entity);
    const modelRepository = AppDataSource.getRepository(Model);
    const userRepository = AppDataSource.getRepository(User);

    await entityRepository.delete({ userId: testUser.id });
    await modelRepository.delete({ userId: testUser.id });
    await userRepository.delete({ id: testUser.id });
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('Model and Entity Creation Flow', () => {
    it('should create a model and then create entities of that model type', async () => {
      // Step 1: Create a model
      const modelData = {
        name: 'Product',
        displayName: 'Product Model',
        schema: {
          fields: [
            { name: 'name', type: 'string', required: true },
            { name: 'price', type: 'number', required: true },
            { name: 'description', type: 'string', required: false },
            { name: 'inStock', type: 'boolean', required: true }
          ]
        }
      };

      const modelResponse = await request(API_BASE_URL)
        .post('/api/models')
        .set('Authorization', `Bearer ${authToken}`)
        .send(modelData)
        .expect(201);

      testModel = modelResponse.body;
      expect(testModel.name).toBe('Product');
      expect(testModel.displayName).toBe('Product Model');
      expect(testModel.schema.fields).toHaveLength(4);

      // Step 2: Create an entity of the model type
      const entityData = {
        name: 'laptop',
        displayName: 'Gaming Laptop',
        modelId: testModel.id,
        data: {
          name: 'Gaming Laptop Pro',
          price: 1299.99,
          description: 'High-performance gaming laptop',
          inStock: true
        }
      };

      const entityResponse = await request(API_BASE_URL)
        .post('/api/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(entityData)
        .expect(201);

      const createdEntity = entityResponse.body;
      expect(createdEntity.name).toBe('laptop');
      expect(createdEntity.displayName).toBe('Gaming Laptop');
      expect(createdEntity.modelId).toBe(testModel.id);
      expect(createdEntity.data.name).toBe('Gaming Laptop Pro');
      expect(createdEntity.data.price).toBe(1299.99);
      expect(createdEntity.data.inStock).toBe(true);

      // Step 3: Create another entity of the same model type
      const entityData2 = {
        name: 'smartphone',
        displayName: 'Smartphone',
        modelId: testModel.id,
        data: {
          name: 'iPhone 15 Pro',
          price: 999.99,
          description: 'Latest smartphone model',
          inStock: false
        }
      };

      const entityResponse2 = await request(API_BASE_URL)
        .post('/api/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(entityData2)
        .expect(201);

      const createdEntity2 = entityResponse2.body;
      expect(createdEntity2.name).toBe('smartphone');
      expect(createdEntity2.displayName).toBe('Smartphone');
      expect(createdEntity2.data.name).toBe('iPhone 15 Pro');
      expect(createdEntity2.data.inStock).toBe(false);

      // Step 4: Get all entities for the model
      const entitiesResponse = await request(API_BASE_URL)
        .get(`/api/entities/model/${testModel.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const entities = entitiesResponse.body;
      expect(entities).toHaveLength(2);
      expect(entities[0].modelId).toBe(testModel.id);
      expect(entities[1].modelId).toBe(testModel.id);

      // Step 5: Get a specific entity
      const specificEntityResponse = await request(API_BASE_URL)
        .get(`/api/entities/${createdEntity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const retrievedEntity = specificEntityResponse.body;
      expect(retrievedEntity.id).toBe(createdEntity.id);
      expect(retrievedEntity.name).toBe('laptop');
      expect(retrievedEntity.data.name).toBe('Gaming Laptop Pro');
    });

    it('should validate entity data against model schema', async () => {
      // Create a model first
      const modelData = {
        name: 'User',
        displayName: 'User Model',
        schema: {
          fields: [
            { name: 'name', type: 'string', required: true },
            { name: 'age', type: 'number', required: true },
            { name: 'email', type: 'string', required: true },
            { name: 'isActive', type: 'boolean', required: false }
          ]
        }
      };

      const modelResponse = await request(API_BASE_URL)
        .post('/api/models')
        .set('Authorization', `Bearer ${authToken}`)
        .send(modelData)
        .expect(201);

      const model = modelResponse.body;

      // Try to create entity with invalid data (missing required field)
      const invalidEntityData = {
        name: 'john_doe',
        displayName: 'John Doe',
        modelId: model.id,
        data: {
          name: 'John Doe',
          age: 30
          // Missing required 'email' field
        }
      };

      await request(API_BASE_URL)
        .post('/api/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidEntityData)
        .expect(400);

      // Try to create entity with wrong data type
      const invalidTypeData = {
        name: 'jane_doe',
        displayName: 'Jane Doe',
        modelId: model.id,
        data: {
          name: 'Jane Doe',
          age: 'thirty', // Should be number
          email: 'jane@example.com',
          isActive: true
        }
      };

      await request(API_BASE_URL)
        .post('/api/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTypeData)
        .expect(400);

      // Create entity with valid data
      const validEntityData = {
        name: 'john_doe',
        displayName: 'John Doe',
        modelId: model.id,
        data: {
          name: 'John Doe',
          age: 30,
          email: 'john@example.com',
          isActive: true
        }
      };

      const validEntityResponse = await request(API_BASE_URL)
        .post('/api/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validEntityData)
        .expect(201);

      const createdEntity = validEntityResponse.body;
      expect(createdEntity.data.name).toBe('John Doe');
      expect(createdEntity.data.age).toBe(30);
      expect(createdEntity.data.email).toBe('john@example.com');
      expect(createdEntity.data.isActive).toBe(true);
    });

    it('should update entity data', async () => {
      // Create a model
      const modelData = {
        name: 'Book',
        displayName: 'Book Model',
        schema: {
          fields: [
            { name: 'title', type: 'string', required: true },
            { name: 'author', type: 'string', required: true },
            { name: 'price', type: 'number', required: true }
          ]
        }
      };

      const modelResponse = await request(API_BASE_URL)
        .post('/api/models')
        .set('Authorization', `Bearer ${authToken}`)
        .send(modelData)
        .expect(201);

      const model = modelResponse.body;

      // Create an entity
      const entityData = {
        name: 'book1',
        displayName: 'Sample Book',
        modelId: model.id,
        data: {
          title: 'The Great Gatsby',
          author: 'F. Scott Fitzgerald',
          price: 9.99
        }
      };

      const entityResponse = await request(API_BASE_URL)
        .post('/api/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(entityData)
        .expect(201);

      const createdEntity = entityResponse.body;

      // Update the entity
      const updatedData = {
        title: 'The Great Gatsby (Updated)',
        author: 'F. Scott Fitzgerald',
        price: 12.99
      };

      const updateResponse = await request(API_BASE_URL)
        .put(`/api/entities/${createdEntity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ data: updatedData })
        .expect(200);

      const updatedEntity = updateResponse.body;
      expect(updatedEntity.data.title).toBe('The Great Gatsby (Updated)');
      expect(updatedEntity.data.price).toBe(12.99);
    });

    it('should delete an entity', async () => {
      // Create a model
      const modelData = {
        name: 'Task',
        displayName: 'Task Model',
        schema: {
          fields: [
            { name: 'title', type: 'string', required: true },
            { name: 'completed', type: 'boolean', required: true }
          ]
        }
      };

      const modelResponse = await request(API_BASE_URL)
        .post('/api/models')
        .set('Authorization', `Bearer ${authToken}`)
        .send(modelData)
        .expect(201);

      const model = modelResponse.body;

      // Create an entity
      const entityData = {
        name: 'task1',
        displayName: 'Sample Task',
        modelId: model.id,
        data: {
          title: 'Complete project',
          completed: false
        }
      };

      const entityResponse = await request(API_BASE_URL)
        .post('/api/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(entityData)
        .expect(201);

      const createdEntity = entityResponse.body;

      // Delete the entity
      await request(API_BASE_URL)
        .delete(`/api/entities/${createdEntity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify entity is deleted
      await request(API_BASE_URL)
        .get(`/api/entities/${createdEntity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
}); 