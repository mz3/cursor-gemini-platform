import { IntentDetectionService } from '../services/intentDetectionService';
import { BotTool } from '../entities/BotTool';

jest.mock('../services/geminiService', () => {
  return {
    GeminiService: jest.fn().mockImplementation(() => ({
      generateResponse: jest.fn((promptContext, conversationHistory, userMessage) => {
        // Simulate LLM output based on userMessage
        if (userMessage.includes('create a model') && userMessage.includes('list models')) {
          return Promise.resolve({
            response: JSON.stringify({
              toolCalls: [
                {
                  toolName: 'platform-api-sdk',
                  operation: 'list_models',
                  parameters: {},
                  confidence: 0.95
                },
                {
                  toolName: 'platform-api-sdk',
                  operation: 'create_model',
                  parameters: { name: 'Multi', displayName: 'Multi' },
                  confidence: 0.92
                }
              ]
            }),
            tokensUsed: 55
          });
        } else if (userMessage.includes('create a model')) {
          return Promise.resolve({
            response: JSON.stringify({
              toolCalls: [
                {
                  toolName: 'platform-api-sdk',
                  operation: 'create_model',
                  parameters: {
                    name: 'TestModel',
                    displayName: 'Test Model',
                    fields: [
                      { name: 'name', type: 'string', required: true },
                      { name: 'age', type: 'number', required: false }
                    ]
                  },
                  confidence: 0.98
                }
              ]
            }),
            tokensUsed: 42
          });
        } else if (userMessage.includes('hello')) {
          return Promise.resolve({
            response: JSON.stringify({ toolCalls: [] }),
            tokensUsed: 10
          });
        } else if (userMessage.includes('invalid json')) {
          return Promise.resolve({
            response: 'not a json',
            tokensUsed: 1
          });
        } else if (userMessage.includes('unknown tool')) {
          return Promise.resolve({
            response: JSON.stringify({
              toolCalls: [
                {
                  toolName: 'not-in-list',
                  operation: 'do_something',
                  parameters: {},
                  confidence: 0.5
                }
              ]
            }),
            tokensUsed: 1
          });
        }
        // Fallback
        return Promise.resolve({
          response: JSON.stringify({ toolCalls: [] }),
          tokensUsed: 1
        });
      })
    }))
  };
});

describe('IntentDetectionService', () => {
  const tools: BotTool[] = [
    {
      id: '1',
      name: 'platform-api-sdk',
      displayName: 'Platform API SDK',
      type: 'mcp_tool',
      description: 'Comprehensive API SDK',
      isActive: true
    } as any
  ];
  const userId = 'user-123';
  let service: IntentDetectionService;

  beforeEach(() => {
    service = new IntentDetectionService();
  });

  it('detects create_model intent and parameters', async () => {
    const message = 'Please create a model called "TestModel" with display name "Test Model". The model should have a field called "name" that should be string type and a field called "age" that should be number type.';
    const result = await service.detectToolCalls(message, tools, userId);
    expect(result.length).toBe(1);
    if (result.length > 0) {
      expect(result[0]!.tool.name).toBe('platform-api-sdk');
      expect(result[0]!.params.operation).toBe('create_model');
      expect(result[0]!.params.name).toBe('TestModel');
      expect(result[0]!.params.displayName).toBe('Test Model');
      expect(result[0]!.params.fields).toEqual([
        { name: 'name', type: 'string', required: true },
        { name: 'age', type: 'number', required: false }
      ]);
    }
  });

  it('returns no tool call for non-tool message', async () => {
    const message = 'hello, how are you?';
    const result = await service.detectToolCalls(message, tools, userId);
    expect(result.length).toBe(0);
  });

  it('detects multiple tool calls', async () => {
    const message = 'list models and also create a model called Multi with display name Multi';
    const result = await service.detectToolCalls(message, tools, userId);
    expect(result.length).toBe(2);
    if (result.length > 1) {
      expect(result[0]!.params.operation).toBe('list_models');
      expect(result[1]!.params.operation).toBe('create_model');
      expect(result[1]!.params.name).toBe('Multi');
    }
  });

  it('handles fallback/default behavior', async () => {
    const message = 'something random';
    const result = await service.detectToolCalls(message, tools, userId);
    expect(result.length).toBe(0);
  });

  it('handles invalid JSON from LLM', async () => {
    const message = 'invalid json';
    const result = await service.detectToolCalls(message, tools, userId);
    expect(result.length).toBe(0);
  });

  it('ignores tool calls for unknown tools', async () => {
    const message = 'unknown tool';
    const result = await service.detectToolCalls(message, tools, userId);
    expect(result.length).toBe(0);
  });
});