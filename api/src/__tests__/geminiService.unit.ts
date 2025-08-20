// Mock config module
jest.mock('../config/environment.js', () => ({
  default: {
    GEMINI_KEY: 'test-api-key',
    get GEMINI_API_KEY() {
      return this.GEMINI_KEY;
    }
  }
}));

// Mock SecretService
jest.mock('../services/secretService.js', () => ({
  SecretService: jest.fn().mockImplementation(() => ({
    findById: jest.fn().mockResolvedValue({
      id: 'test-secret-id',
      key: 'GEMINI_API_KEY',
      userId: 'test-user'
    }),
    getSecretValueByKey: jest.fn().mockResolvedValue('test-api-key')
  }))
}));

// Mock GoogleGenerativeAI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('This is a mock response from the GeminiService test.')
        }
      })
    })
  }))
}));

import { GeminiService } from '../services/geminiService.js';

describe('GeminiService', () => {
  let geminiService: GeminiService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Set environment variable for tests
    process.env.GEMINI_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.GEMINI_KEY;
  });

  describe('constructor', () => {
    it('should create instance successfully with valid API key', () => {
      expect(() => {
        geminiService = new GeminiService();
      }).not.toThrow();
    });
  });

  describe('generateResponse', () => {
    beforeEach(() => {
      geminiService = new GeminiService();
    });

    it('should generate a response with valid input', async () => {
      const mockAIModel = {
        id: 'test-id',
        name: 'test-model',
        displayName: 'Test Model',
        provider: 'gemini' as const,
        modelId: 'gemini-2.5-flash',
        userId: 'test-user',
        isActive: true,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {} as any,
        secret: undefined,
        secretId: 'test-secret-id',
        description: undefined,
        apiVersion: undefined,
        baseUrl: undefined,
        capabilities: undefined,
        configuration: undefined
      };

      const result = await geminiService.generateResponse(
        mockAIModel,
        'How are you?',
        'You are a helpful assistant.',
        0.7,
        1000
      );

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
