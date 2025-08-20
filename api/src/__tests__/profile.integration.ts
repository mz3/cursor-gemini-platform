import request from 'supertest';
import { TEST_CONFIG } from './config.js';
import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';
import { Role } from '../entities/Role.js';
import bcrypt from 'bcryptjs';


describe('Profile Update Endpoints', () => {
  let authToken: string;
  let originalPassword: string;

  beforeAll(async () => {
    // Login to get token
    const res = await request(TEST_CONFIG.API_BASE_URL)
      .post('/api/users/login')
      .send({ email: 'admin@platform.com', password: 'admin123' });
    authToken = res.body.token;
    
    // Store original password for cleanup
    originalPassword = 'admin123';
  });

  afterAll(async () => {
    // Reset admin user password back to original
    try {
      const userRepository = AppDataSource.getRepository(User);
      const adminUser = await userRepository.findOne({ where: { email: 'admin@platform.com' } });
      if (adminUser) {
        const hashedPassword = await bcrypt.hash(originalPassword, 10);
        adminUser.password = hashedPassword;
        await userRepository.save(adminUser);
      }
    } catch (error) {
      console.error('Failed to reset admin password:', error);
    }
  });

  describe('PUT /api/users/profile', () => {
    it('should update user email successfully', async () => {
      const newEmail = 'newemail@example.com';

      const response = await request(TEST_CONFIG.API_BASE_URL)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: newEmail });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', newEmail);
      expect(response.body).toHaveProperty('firstName', 'Admin');
      expect(response.body).toHaveProperty('lastName', 'User');
    });

    it('should update user password successfully', async () => {
      const newPassword = 'newpassword123';

      const response = await request(TEST_CONFIG.API_BASE_URL)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'admin123',
          newPassword: newPassword
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('firstName', 'Admin');
      expect(response.body).toHaveProperty('lastName', 'User');

      // Verify the password was actually changed by trying to login with new password
      const loginResponse = await request(TEST_CONFIG.API_BASE_URL)
        .post('/api/users/login')
        .send({
          email: 'newemail@example.com',
          password: newPassword
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(TEST_CONFIG.API_BASE_URL)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('valid email address');
    });

    it('should return 400 for password less than 6 characters', async () => {
      const response = await request(TEST_CONFIG.API_BASE_URL)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'admin123',
          newPassword: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('6 characters long');
    });

    it('should return 401 for incorrect current password', async () => {
      const response = await request(TEST_CONFIG.API_BASE_URL)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('incorrect');
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(TEST_CONFIG.API_BASE_URL)
        .put('/api/users/profile')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
    });
  });
});
