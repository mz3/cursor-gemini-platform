import api from '../utils/api';

export interface AIModel {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  provider: 'gemini' | 'openai' | 'anthropic' | 'deepseek' | 'local';
  modelId: string;
  apiVersion?: string;
  baseUrl?: string;
  capabilities?: string;
  configuration?: any;
  isActive: boolean;
  isDefault: boolean;
  userId: string;
  secretId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAIModelDto {
  name: string;
  displayName: string;
  description?: string;
  provider: 'gemini' | 'openai' | 'anthropic' | 'deepseek' | 'local';
  modelId: string;
  apiVersion?: string;
  baseUrl?: string;
  capabilities?: string;
  configuration?: any;
  isActive?: boolean;
  isDefault?: boolean;
  secretId?: string;
}

export interface UpdateAIModelDto extends Partial<CreateAIModelDto> {}

export interface TestConnectionResponse {
  connected: boolean;
  message?: string;
}

export interface GenerateResponseRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateResponseResponse {
  response: string;
  tokens?: number;
  model?: string;
}

export const aiModelApi = {
  getAll: () => api.get<AIModel[]>('/ai-models').then(res => res.data),
  getById: (id: string) => api.get<AIModel>(`/ai-models/${id}`).then(res => res.data),
  create: (data: CreateAIModelDto) => api.post<AIModel>('/ai-models', data).then(res => res.data),
  update: (id: string, data: UpdateAIModelDto) => api.put<AIModel>(`/ai-models/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/ai-models/${id}`).then(res => res.data),
  testConnection: (id: string) => api.post<TestConnectionResponse>(`/ai-models/${id}/test`).then(res => res.data),
  generateResponse: (id: string, data: GenerateResponseRequest) =>
    api.post<GenerateResponseResponse>(`/ai-models/${id}/generate`, data).then(res => res.data),
  setDefault: (id: string) => api.post<AIModel>(`/ai-models/${id}/set-default`).then(res => res.data),
};
