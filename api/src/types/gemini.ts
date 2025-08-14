export interface GeminiResponse {
  response: string;
  tokensUsed: number;
}

export interface GeminiError {
  message: string;
  code?: string;
}