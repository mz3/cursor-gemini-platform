import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/environment.js';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async generateResponse(
    promptContext: string,
    conversationHistory: string,
    userMessage: string
  ): Promise<{ response: string; tokensUsed: number }> {
    if (!config.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
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
        if (error.message.includes('API_KEY')) {
          throw new Error('Invalid Gemini API key');
        }
        if (error.message.includes('QUOTA')) {
          throw new Error('Gemini API quota exceeded');
        }
        if (error.message.includes('SAFETY')) {
          throw new Error('Content blocked by safety filters');
        }
      }
      
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private estimateTokenCount(text: string): number {
    // Simple estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}