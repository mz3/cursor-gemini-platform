// Mock config module
jest.mock('../config/environment.js', () => ({
  default: {
    GEMINI_KEY: 'test-api-key',
    get GEMINI_API_KEY() {
      return this.GEMINI_KEY;
    }
  }
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
      const result = await geminiService.generateResponse(
        'You are a helpful assistant.',
        'User: Hello\nAssistant: Hi there!',
        'How are you?'
      );

      expect(result.response).toBe('This is a mock response from the GeminiService test. I am a helpful AI assistant and I understand your message.');
      expect(result.tokensUsed).toBeGreaterThan(0);
    });
  });
});
