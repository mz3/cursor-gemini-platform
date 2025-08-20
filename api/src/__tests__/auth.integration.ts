import request from 'supertest';
import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';
import { TEST_CONFIG } from './config.js';

describe('POST /api/users/login', () => {
  it('should login successfully with valid credentials', async () => {
    const res = await request(TEST_CONFIG.API_BASE_URL)
      .post('/api/users/login')
      .send({ email: TEST_CONFIG.TEST_USER.email, password: TEST_CONFIG.TEST_USER.password });
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
    const res = await request(TEST_CONFIG.API_BASE_URL)
      .post('/api/users/login')
      .send({ email: TEST_CONFIG.TEST_USER.email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.error).toHaveProperty('message', 'Invalid email or password');
  });
});

describe('User Settings (Dark Mode)', () => {
  let token: string;

  beforeAll(async () => {
    // Login to get token
    const res = await request(TEST_CONFIG.API_BASE_URL)
      .post('/api/users/login')
      .send({ email: TEST_CONFIG.TEST_USER.email, password: TEST_CONFIG.TEST_USER.password });
    token = res.body.token;
  });

  it('should enable dark mode and persist the setting', async () => {
    // Enable dark mode
    const putRes = await request(TEST_CONFIG.API_BASE_URL)
      .put('/api/users/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ darkMode: true });
    expect(putRes.status).toBe(200);
    expect(putRes.body).toHaveProperty('darkMode', true);

    // Fetch settings and verify dark mode is enabled
    const getRes = await request(TEST_CONFIG.API_BASE_URL)
      .get('/api/users/settings')
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body).toHaveProperty('darkMode', true);
  });

  it('should disable dark mode and persist the setting', async () => {
    // Disable dark mode
    const putRes = await request(TEST_CONFIG.API_BASE_URL)
      .put('/api/users/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ darkMode: false });
    expect(putRes.status).toBe(200);
    expect(putRes.body).toHaveProperty('darkMode', false);

    // Fetch settings and verify dark mode is disabled
    const getRes = await request(TEST_CONFIG.API_BASE_URL)
      .get('/api/users/settings')
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body).toHaveProperty('darkMode', false);
  });
});
