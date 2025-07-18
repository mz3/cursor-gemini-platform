import request from 'supertest';
import { AppDataSource } from '../config/database.js';
import { Model } from '../entities/Model.js';
import { Prompt } from '../entities/Prompt.js';
import { PromptVersion } from '../entities/PromptVersion.js';

const API_BASE_URL = 'http://localhost:4000';

describe('Prompt API Integration Tests', () => {
  let token: string;
  let userId: string;
  let createdPromptId: string;

  beforeAll(async () => {
    // Login to get token and userId
    const res = await request(API_BASE_URL)
      .post('/api/users/login')
      .send({ email: 'admin@platform.com', password: 'admin123' });
    token = res.body.token;
    userId = res.body.user.id;
  });

  describe('POST /api/prompts', () => {
    it('should create a new prompt with valid data', async () => {
      const promptData = {
        name: 'Test Prompt',
        content: 'This is a test prompt content',
        type: 'llm',
        description: 'A test prompt for integration testing'
      };

      const res = await request(API_BASE_URL)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${token}`)
        .send(promptData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Test Prompt');
      expect(res.body.content).toBe('This is a test prompt content');
      expect(res.body.type).toBe('llm');
      expect(res.body.description).toBe('A test prompt for integration testing');
      expect(res.body.version).toBe(1);
      expect(res.body.isActive).toBe(true);
      expect(res.body.userId).toBe(userId);

      // Store the prompt ID for later tests
      createdPromptId = res.body.id;
    });

    it('should fail with missing required fields', async () => {
      const res = await request(API_BASE_URL)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Prompt' }); // Missing content

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Name and content are required');
    });

    it('should create a prompt with code generation type', async () => {
      const promptData = {
        name: 'Code Generation Prompt',
        content: 'Generate a React component for a button',
        type: 'code_generation',
        description: 'Prompt for generating React components'
      };

      const res = await request(API_BASE_URL)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${token}`)
        .send(promptData);

      expect(res.status).toBe(201);
      expect(res.body.type).toBe('code_generation');
      expect(res.body.version).toBe(1);
    });
  });

  describe('PUT /api/prompts/:id', () => {
    it('should update a prompt and create a new version', async () => {
      const updateData = {
        name: 'Updated Test Prompt',
        content: 'This is the updated test prompt content',
        description: 'Updated description for the test prompt'
      };

      const res = await request(API_BASE_URL)
        .put(`/api/prompts/${createdPromptId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Updated Test Prompt');
      expect(res.body.content).toBe('This is the updated test prompt content');
      expect(res.body.description).toBe('Updated description for the test prompt');
      expect(res.body.version).toBe(2); // Should be version 2
      expect(res.body.isActive).toBe(true);
      expect(res.body.userId).toBe(userId);
    });

    it('should fail to update non-existent prompt', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const updateData = {
        name: 'Updated Prompt',
        content: 'Updated content'
      };

      const res = await request(API_BASE_URL)
        .put(`/api/prompts/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Prompt not found');
    });

    it('should create another version with partial updates', async () => {
      const updateData = {
        content: 'This is the third version of the test prompt content'
      };

      const res = await request(API_BASE_URL)
        .put(`/api/prompts/${createdPromptId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.version).toBe(3); // Should be version 3
      expect(res.body.content).toBe('This is the third version of the test prompt content');
      expect(res.body.name).toBe('Updated Test Prompt'); // Should retain previous name
      expect(res.body.isActive).toBe(true);
    });
  });

  describe('GET /api/prompts/:id/versions', () => {
    it('should return all versions of a prompt', async () => {
      const res = await request(API_BASE_URL)
        .get(`/api/prompts/${createdPromptId}/versions`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3); // Should have 3 versions

      // Check that versions are ordered correctly
      const versions = res.body.sort((a: any, b: any) => a.version - b.version);
      expect(versions[0].version).toBe(1);
      expect(versions[1].version).toBe(2);
      expect(versions[2].version).toBe(3);

      // Check that only the latest version is active
      const activeVersions = versions.filter((v: any) => v.isActive);
      expect(activeVersions.length).toBe(1);
      expect(activeVersions[0].version).toBe(3);

      // Check that all versions reference the same prompt
      expect(versions[0].promptId).toBe(createdPromptId);
      expect(versions[1].promptId).toBe(createdPromptId);
      expect(versions[2].promptId).toBe(createdPromptId);
    });

    it('should fail to get versions of non-existent prompt', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const res = await request(API_BASE_URL)
        .get(`/api/prompts/${fakeId}/versions`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Prompt not found');
    });
  });

  describe('GET /api/prompts', () => {
    it('should return only the latest version of each prompt', async () => {
      const res = await request(API_BASE_URL)
        .get('/api/prompts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      // Find our test prompt
      const testPrompt = res.body.find((p: any) => p.name === 'Updated Test Prompt');
      expect(testPrompt).toBeDefined();
      expect(testPrompt.version).toBe(3); // Should only return the latest version
      expect(testPrompt.isActive).toBe(true);
    });
  });

  describe('GET /api/prompts/:id', () => {
    it('should return a specific prompt by ID', async () => {
      const res = await request(API_BASE_URL)
        .get(`/api/prompts/${createdPromptId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdPromptId);
      expect(res.body.version).toBe(3); // Should return the latest active version
      expect(res.body.isActive).toBe(true);
    });

    it('should fail to get non-existent prompt', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const res = await request(API_BASE_URL)
        .get(`/api/prompts/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Prompt not found');
    });
  });

  describe('DELETE /api/prompts/:id', () => {
    it('should delete a prompt and all its versions', async () => {
      // Create a prompt first if we don't have one
      if (!createdPromptId) {
        const promptData = {
          name: 'Delete Test Prompt',
          content: 'This prompt will be deleted',
          type: 'llm',
          description: 'A test prompt for deletion'
        };

        const createRes = await request(API_BASE_URL)
          .post('/api/prompts')
          .set('Authorization', `Bearer ${token}`)
          .send(promptData);

        expect(createRes.status).toBe(201);
        createdPromptId = createRes.body.id;
      }

      const res = await request(API_BASE_URL)
        .delete(`/api/prompts/${createdPromptId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);

      // Verify that the prompt and all its versions are deleted
      const getRes = await request(API_BASE_URL)
        .get(`/api/prompts/${createdPromptId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getRes.status).toBe(404);

      // Verify that the versions endpoint also returns 404
      const versionsRes = await request(API_BASE_URL)
        .get(`/api/prompts/${createdPromptId}/versions`)
        .set('Authorization', `Bearer ${token}`);

      expect(versionsRes.status).toBe(404);
    });

    it('should fail to delete non-existent prompt', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const res = await request(API_BASE_URL)
        .delete(`/api/prompts/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Prompt not found');
    });
  });
});
