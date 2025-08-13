import request from 'supertest';

const API_BASE_URL = process.env.API_URL || 'http://localhost:4001';

describe('Entity Management Integration Tests', () => {
  let testUserId: string;
  let authToken: string;
  let testSchemaId: string;

  beforeAll(async () => {
    // Login to get auth token using admin user
    const loginRes = await request(API_BASE_URL)
      .post('/api/users/login')
      .send({ email: 'admin@platform.com', password: 'admin123' });
    authToken = loginRes.body.token;
    testUserId = loginRes.body.user.id;
  });

  describe('Model and Entity Creation Flow', () => {
    it('should create a schema and then create entities of that schema type', async () => {
      // Step 1: Create a schema
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
        },
        userId: testUserId
      };

      const modelResponse = await request(API_BASE_URL)
        .post('/api/schemas')
        .set('Authorization', `Bearer ${authToken}`)
        .send(modelData)
        .expect(201);

      testSchemaId = modelResponse.body.id;
      expect(modelResponse.body.name).toBe('Product');
      expect(modelResponse.body.displayName).toBe('Product Model');
      expect(modelResponse.body.schema.fields).toHaveLength(4);

      // Step 2: Create an entity of the schema type
      const entityData = {
        name: 'laptop',
        displayName: 'Gaming Laptop',
        schemaId: testSchemaId,
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
      expect(createdEntity.schemaId).toBe(testSchemaId);
      expect(createdEntity.data.name).toBe('Gaming Laptop Pro');
      expect(createdEntity.data.price).toBe(1299.99);
      expect(createdEntity.data.inStock).toBe(true);

      // Step 3: Create another entity of the same model type
      const entityData2 = {
        name: 'smartphone',
        displayName: 'Smartphone',
        schemaId: testSchemaId,
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

      // Step 4: Get all entities for the schema
      const entitiesResponse = await request(API_BASE_URL)
        .get(`/api/entities/schema/${testSchemaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const entities = entitiesResponse.body;
      expect(entities).toHaveLength(2);
      expect(entities[0].schemaId).toBe(testSchemaId);
      expect(entities[1].schemaId).toBe(testSchemaId);

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
      // Create a schema first
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
        },
        userId: testUserId
      };

      const modelResponse = await request(API_BASE_URL)
        .post('/api/schemas')
        .set('Authorization', `Bearer ${authToken}`)
        .send(modelData)
        .expect(201);

      const model = modelResponse.body;

      // Try to create entity with invalid data (missing required field)
      const invalidEntityData = {
        name: 'john_doe',
        displayName: 'John Doe',
        schemaId: model.id,
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
        .expect(500); // Validation errors return 500 via error handler

      // Try to create entity with wrong data type
      const invalidTypeData = {
        name: 'jane_doe',
        displayName: 'Jane Doe',
        schemaId: model.id,
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
        .expect(500); // Type validation errors return 500

      // Create entity with valid data
      const validEntityData = {
        name: 'john_doe',
        displayName: 'John Doe',
        schemaId: model.id,
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
      // Create a schema
      const modelData = {
        name: 'Book',
        displayName: 'Book Model',
        schema: {
          fields: [
            { name: 'title', type: 'string', required: true },
            { name: 'author', type: 'string', required: true },
            { name: 'price', type: 'number', required: true }
          ]
        },
        userId: testUserId
      };

      const modelResponse = await request(API_BASE_URL)
        .post('/api/schemas')
        .set('Authorization', `Bearer ${authToken}`)
        .send(modelData)
        .expect(201);

      const model = modelResponse.body;

      // Create an entity
      const entityData = {
        name: 'book1',
        displayName: 'Sample Book',
        schemaId: model.id,
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
      // Create a schema
      const modelData = {
        name: 'Task',
        displayName: 'Task Model',
        schema: {
          fields: [
            { name: 'title', type: 'string', required: true },
            { name: 'completed', type: 'boolean', required: true }
          ]
        },
        userId: testUserId
      };

      const modelResponse = await request(API_BASE_URL)
        .post('/api/schemas')
        .set('Authorization', `Bearer ${authToken}`)
        .send(modelData)
        .expect(201);

      const model = modelResponse.body;

      // Create an entity
      const entityData = {
        name: 'task1',
        displayName: 'Sample Task',
        schemaId: model.id,
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
