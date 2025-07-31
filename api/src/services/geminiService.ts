import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/environment.js';
import { GeminiResponse } from '../types/gemini.js';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = config.GEMINI_KEY || process.env.GEMINI_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not configured (GEMINI_KEY)');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async generateResponse(
    promptContext: string,
    conversationHistory: string,
    userMessage: string
  ): Promise<GeminiResponse> {
    const apiKey = config.GEMINI_KEY || process.env.GEMINI_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not configured (GEMINI_KEY)');
    }

    const systemPrompt = `You are a helpful AI assistant. Use the following context to guide your responses:

${promptContext}

Previous conversation:
${conversationHistory}

User: ${userMessage}
Assistant:`;

    try {
      const result = await this.model.generateContent(systemPrompt);
      const response = result.response.text();

      if (!response) {
        throw new Error('Empty response from Gemini API');
      }

      // Estimate tokens (Gemini doesn't provide exact count in response)
      const tokensUsed = this.estimateTokenCount(systemPrompt + response);

      return { response, tokensUsed };
    } catch (error) {
      console.error('Gemini API error:', error);

      if (error instanceof Error) {
        if (error.message.includes('API_KEY') || error.message.includes('API key')) {
          throw new Error('Invalid Gemini API key');
        }
        if (error.message.includes('QUOTA') || error.message.includes('quota')) {
          throw new Error('Gemini API quota exceeded');
        }
        if (error.message.includes('SAFETY') || error.message.includes('safety')) {
          throw new Error('Content blocked by safety filters');
        }
        if (error.message.includes('RATE_LIMIT') || error.message.includes('rate limit')) {
          throw new Error('Gemini API rate limit exceeded');
        }
      }

      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private estimateTokenCount(text: string): number {
    // Simple estimation: ~4 characters per token
    // This is a rough approximation for English text
    return Math.ceil(text.length / 4);
  }
}