import request from 'supertest';
import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';

const API_BASE_URL = process.env.API_URL || 'http://localhost:4000';

describe('POST /api/users/login', () => {
  it('should login successfully with valid credentials', async () => {
    const res = await request(API_BASE_URL)
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
    const res = await request(API_BASE_URL)
      .post('/api/users/login')
      .send({ email: 'admin@platform.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid credentials');
  });
});
