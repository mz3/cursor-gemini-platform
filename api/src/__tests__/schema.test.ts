import request from 'supertest';
import { AppDataSource } from '../config/database.js';

const API_BASE_URL = process.env.API_URL || 'http://localhost:4000';

describe('POST /api/schemas', () => {
  let token: string;
  let userId: string;
  let projectSchemaId: string;

  beforeAll(async () => {
    // Login to get token and userId
    const res = await request(API_BASE_URL)
      .post('/api/users/login')
      .send({ email: 'admin@platform.com', password: 'admin123' });
    token = res.body.token;
    userId = res.body.user.id;

    // Create a Project schema (parent)
    const projectRes = await request(API_BASE_URL)
      .post('/api/schemas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Project',
        displayName: 'Projects',
        schema: { fields: [{ name: 'title', type: 'string', required: true }] },
        userId
      });
    projectSchemaId = projectRes.body.id;
  });

  it('should create a new schema with valid data', async () => {
    const schemaData = {
      name: 'TestSchema',
      displayName: 'Test Schemas',
      schema: { fields: [{ name: 'field1', type: 'string', required: true }] },
      userId
    };
    const res = await request(API_BASE_URL)
      .post('/api/schemas')
      .set('Authorization', `Bearer ${token}`)
      .send(schemaData);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('TestSchema');
    expect(res.body.displayName).toBe('Test Schemas');
  });

  it('should fail with missing required fields', async () => {
    const res = await request(API_BASE_URL)
      .post('/api/schemas')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Missing required fields');
  });

  it('should create a Task schema with a relationship to Project', async () => {
    const schemaData = {
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
          targetSchemaId: projectSchemaId,
          sourceField: 'project',
          targetField: 'tasks',
          cascade: false,
          nullable: false,
          description: 'Each task belongs to a project.'
        }
      ]
    };
    const res = await request(API_BASE_URL)
      .post('/api/schemas')
      .set('Authorization', `Bearer ${token}`)
      .send(schemaData);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.relationships).toBeDefined();
    expect(res.body.relationships.length).toBe(1);
    expect(res.body.relationships[0]).toMatchObject({
      name: 'projectTasks',
      type: 'many-to-one',
      targetSchemaId: projectSchemaId,
      sourceField: 'project',
      targetField: 'tasks',
      description: 'Each task belongs to a project.'
    });
  });
});
