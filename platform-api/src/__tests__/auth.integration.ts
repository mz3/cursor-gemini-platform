import request from 'supertest';
import { AppDataSource } from '../config/database';
import { app } from '../index';

describe('POST /api/users/login', () => {
  beforeAll(async () => {
    await AppDataSource.initialize();
  });
  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it('should login successfully with valid credentials', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'admin@platform.com', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({
      email: 'admin@platform.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    });
  });

  it('should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'admin@platform.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid credentials');
  });
});
