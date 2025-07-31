// Mock the config module before any imports
const mockConfig = {
  GEMINI_KEY: 'test-api-key'
};

jest.mock('../config/environment.js', () => ({
  default: mockConfig
}));

// Mock Google Generative AI before imports
const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn().mockReturnValue({
  generateContent: mockGenerateContent
});

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel
  }))
}));

import { GeminiService } from './geminiService.js';

describe('GeminiService', () => {
  let geminiService: GeminiService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the mocks
    mockGenerateContent.mockClear();
    mockGetGenerativeModel.mockClear();
    
    // Create service instance
    geminiService = new GeminiService();
  });

  describe('constructor', () => {
    it('should throw error if API key is not configured', () => {
      // Temporarily override the config
      const originalKey = mockConfig.GEMINI_KEY;
      mockConfig.GEMINI_KEY = '';
      
      expect(() => {
        new GeminiService();
      }).toThrow('Gemini API key not configured (GEMINI_KEY)');
      
      // Restore the key
      mockConfig.GEMINI_KEY = originalKey;
    });
  });

  describe('generateResponse', () => {
    it('should generate a response with valid input', async () => {
      const mockResponse = {
        response: {
          text: () => 'This is a helpful response from Gemini.'
        }
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.generateResponse(
        'You are a helpful assistant.',
        'User: Hello\nAssistant: Hi there!',
        'How are you?'
      );

      expect(result.response).toBe('This is a helpful response from Gemini.');
      expect(result.tokensUsed).toBeGreaterThan(0);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should handle empty response from API', async () => {
      const mockResponse = {
        response: {
          text: () => ''
        }
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      await expect(geminiService.generateResponse('', '', 'test')).rejects.toThrow('Empty response from Gemini API');
    });

    it('should handle API key errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Invalid API key provided'));

      await expect(geminiService.generateResponse('', '', 'test')).rejects.toThrow('Invalid Gemini API key');
    });

    it('should handle quota exceeded errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Quota exceeded for this API key'));

      await expect(geminiService.generateResponse('', '', 'test')).rejects.toThrow('Gemini API quota exceeded');
    });

    it('should handle safety filter errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Content blocked by safety filters'));

      await expect(geminiService.generateResponse('', '', 'test')).rejects.toThrow('Content blocked by safety filters');
    });

    it('should handle rate limit errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Rate limit exceeded'));

      await expect(geminiService.generateResponse('', '', 'test')).rejects.toThrow('Gemini API rate limit exceeded');
    });

    it('should handle generic API errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Unknown API error'));

      await expect(geminiService.generateResponse('', '', 'test')).rejects.toThrow('Gemini API error: Unknown API error');
    });

    it('should calculate token count correctly', async () => {
      const mockResponse = {
        response: {
          text: () => 'Short response'
        }
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.generateResponse(
        'Context',
        'History',
        'Message'
      );

      // The prompt is roughly: "You are a helpful... Context\n\n... History\n\nUser: Message\nAssistant:"
      // Plus the response "Short response"
      // Total characters should be estimated and divided by 4
      expect(result.tokensUsed).toBeGreaterThan(50); // Should be reasonable for the full prompt + response
    });
  });
});