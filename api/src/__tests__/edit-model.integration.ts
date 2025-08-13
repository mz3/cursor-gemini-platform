import request from 'supertest';
import { AppDataSource } from '../config/database.js';
import { Model } from '../entities/Model.js';
import { Relationship } from '../entities/Relationship.js';
import { User } from '../entities/User.js';

const API_BASE_URL = process.env.API_URL || 'http://localhost:4001';

describe('Edit Model API', () => {
  let token: string;
  let userId: string;
  let testModelId: string;

  beforeAll(async () => {
    // Login to get token
    const loginResponse = await request(API_BASE_URL)
      .post('/api/users/login')
      .send({
        email: 'admin@platform.com',
        password: 'admin123'
      });

    token = loginResponse.body.token;
    userId = loginResponse.body.user.id;

    // Create a test model to edit
    const modelData = {
      name: 'TestModelForEdit',
      displayName: 'Test Model For Edit',
      schema: {
        fields: [
          { name: 'originalField', type: 'string', required: true, displayName: 'Original Field' }
        ]
      },
      userId
    };

    const createResponse = await request(API_BASE_URL)
      .post('/api/models')
      .set('Authorization', `Bearer ${token}`)
      .send(modelData);

    testModelId = createResponse.body.id;
  });

  afterAll(async () => {
    // Clean up test model
    if (testModelId) {
      await request(API_BASE_URL)
        .delete(`/api/models/${testModelId}`)
        .set('Authorization', `Bearer ${token}`);
    }
  });

  it('should update model basic information', async () => {
    const updateData = {
      displayName: 'Updated Test Model',
      description: 'Updated description for the test model',
      schema: {
        fields: [
          { name: 'originalField', type: 'string', required: true, displayName: 'Updated Field' },
          { name: 'newField', type: 'number', required: false, displayName: 'New Field' }
        ]
      }
    };

    const response = await request(API_BASE_URL)
      .put(`/api/models/${testModelId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.displayName).toBe('Updated Test Model');
    expect(response.body.description).toBe('Updated description for the test model');
    expect(response.body.schema.fields).toHaveLength(2);
    expect(response.body.schema.fields[0].displayName).toBe('Updated Field');
    expect(response.body.schema.fields[1].name).toBe('newField');
  });

  it('should handle relationships when updating model', async () => {
    // First, create a target model for the relationship
    const targetModelData = {
      name: 'TargetModel',
      displayName: 'Target Model',
      schema: {
        fields: [
          { name: 'name', type: 'string', required: true, displayName: 'Name' }
        ]
      },
      userId
    };

    const targetResponse = await request(API_BASE_URL)
      .post('/api/models')
      .set('Authorization', `Bearer ${token}`)
      .send(targetModelData);

    const targetModelId = targetResponse.body.id;

    // Create a relationship
    const relationshipData = {
      name: 'testRelationship',
      displayName: 'Test Relationship',
      type: 'many-to-one',
      sourceModelId: testModelId,
      targetModelId: targetModelId,
      sourceField: 'targetId',
      targetField: 'id',
      cascade: false,
      nullable: true,
      description: 'Test relationship',
      userId
    };

    const relResponse = await request(API_BASE_URL)
      .post('/api/relationships')
      .set('Authorization', `Bearer ${token}`)
      .send(relationshipData);

    expect(relResponse.status).toBe(201);
    expect(relResponse.body.name).toBe('testRelationship');

    // Verify the relationship was created
    const relationshipsResponse = await request(API_BASE_URL)
      .get(`/api/models/${testModelId}/relationships`)
      .set('Authorization', `Bearer ${token}`);

    expect(relationshipsResponse.status).toBe(200);
    expect(relationshipsResponse.body).toHaveLength(1);
    expect(relationshipsResponse.body[0].name).toBe('testRelationship');

    // Clean up target model
    await request(API_BASE_URL)
      .delete(`/api/models/${targetModelId}`)
      .set('Authorization', `Bearer ${token}`);
  });

  it('should return 404 for non-existent model', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const updateData = {
      displayName: 'Updated Model'
    };

    const response = await request(API_BASE_URL)
      .put(`/api/models/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Model not found');
  });

  it('should validate required fields when creating relationships', async () => {
    const invalidRelationshipData = {
      name: 'testRelationship',
      // Missing required fields
      userId
    };

    const response = await request(API_BASE_URL)
      .post('/api/relationships')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidRelationshipData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Missing required fields');
  });
});
