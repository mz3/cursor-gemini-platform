import request from 'supertest';
import { AppDataSource } from '../config/database.js';

const API_BASE_URL = 'http://localhost:4000';

describe('POST /api/models', () => {
  let token: string;
  let userId: string;
  let projectModelId: string;

  beforeAll(async () => {
    // Login to get token and userId
    const res = await request(API_BASE_URL)
      .post('/api/users/login')
      .send({ email: 'admin@platform.com', password: 'admin123' });
    token = res.body.token;
    userId = res.body.user.id;

    // Create a Project model (parent)
    const projectRes = await request(API_BASE_URL)
      .post('/api/models')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Project',
        displayName: 'Projects',
        schema: { fields: [{ name: 'title', type: 'string', required: true }] },
        userId
      });
    projectModelId = projectRes.body.id;
  });

  it('should create a new model with valid data', async () => {
    const modelData = {
      name: 'TestModel',
      displayName: 'Test Models',
      schema: { fields: [{ name: 'field1', type: 'string', required: true }] },
      userId
    };
    const res = await request(API_BASE_URL)
      .post('/api/models')
      .set('Authorization', `Bearer ${token}`)
      .send(modelData);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('TestModel');
    expect(res.body.displayName).toBe('Test Models');
  });

  it('should fail with missing required fields', async () => {
    const res = await request(API_BASE_URL)
      .post('/api/models')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Missing required fields');
  });

  it('should create a Task model with a relationship to Project', async () => {
    const modelData = {
      name: 'Task',
      displayName: 'Tasks',
      schema: { fields: [
        { name: 'description', type: 'string', required: true },
        { name: 'dueDate', type: 'date', required: false }
      ] },
      userId,
      relationships: [
        {
          name: 'projectTasks',
          displayName: 'Project Tasks',
          type: 'many-to-one',
          targetModelId: projectModelId,
          sourceField: 'project',
          targetField: 'tasks',
          cascade: false,
          nullable: false,
          description: 'Each task belongs to a project.'
        }
      ]
    };
    const res = await request(API_BASE_URL)
      .post('/api/models')
      .set('Authorization', `Bearer ${token}`)
      .send(modelData);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.relationships).toBeDefined();
    expect(res.body.relationships.length).toBe(1);
    expect(res.body.relationships[0]).toMatchObject({
      name: 'projectTasks',
      type: 'many-to-one',
      targetModelId: projectModelId,
      sourceField: 'project',
      targetField: 'tasks',
      description: 'Each task belongs to a project.'
    });
  });
});
