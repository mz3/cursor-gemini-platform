import request from 'supertest';
import { AppDataSource } from '../config/database';
import { app } from '../index';

describe('POST /api/models', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    await AppDataSource.initialize();
    // Login to get token and userId
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'admin@platform.com', password: 'admin123' });
    token = res.body.token;
    userId = res.body.user.id;
  });
  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it('should create a new model with valid data', async () => {
    const modelData = {
      name: 'TestModel',
      displayName: 'Test Models',
      schema: { fields: [{ name: 'field1', type: 'string', required: true }] },
      userId
    };
    const res = await request(app)
      .post('/api/models')
      .set('Authorization', `Bearer ${token}`)
      .send(modelData);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('TestModel');
    expect(res.body.displayName).toBe('Test Models');
  });

  it('should fail with missing required fields', async () => {
    const res = await request(app)
      .post('/api/models')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Missing required fields');
  });
});
