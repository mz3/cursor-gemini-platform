import { GeminiService } from './geminiService.js';
import { BotTool } from '../entities/BotTool.js';

export interface DetectedIntent {
  toolName: string;
  operation: string;
  parameters: Record<string, any>;
  confidence: number;
}

export interface ToolCall {
  tool: BotTool;
  params: Record<string, any>;
}

export class IntentDetectionService {
  private geminiService: GeminiService;

  constructor() {
    this.geminiService = new GeminiService();
  }

  async detectToolCalls(
    message: string,
    tools: BotTool[],
    userId: string
  ): Promise<ToolCall[]> {
    const availableTools = tools.filter(tool => tool.isActive);

    if (availableTools.length === 0) {
      return [];
    }

    const systemPrompt = this.buildSystemPrompt(availableTools);
    const conversationHistory = ''; // We could pass this in if needed

    try {
      const response = await this.geminiService.generateResponse(
        systemPrompt,
        conversationHistory,
        message
      );

      return this.parseLLMResponse(response.response, availableTools, userId);
    } catch (error) {
      console.error('Error detecting intent:', error);
      return [];
    }
  }

  private buildSystemPrompt(tools: BotTool[]): string {
    const toolDescriptions = tools.map(tool => {
      const operations = this.getToolOperations(tool);
      return `
Tool: ${tool.displayName} (${tool.name})
Type: ${tool.type}
Description: ${tool.description || 'No description available'}
Available Operations: ${operations.join(', ')}
Parameter Examples:
${this.getParameterExamples(tool)}
`;
    }).join('\n');

    return `You are an AI assistant that helps users interact with a platform API. Your job is to:

1. Analyze the user's message to detect their intent
2. Identify which tool(s) should be called
3. Extract the correct parameters for each tool call
4. Return a structured JSON response

Available Tools:
${toolDescriptions}

IMPORTANT: You must respond with ONLY a valid JSON object in this exact format:
{
  "toolCalls": [
    {
      "toolName": "exact_tool_name_from_list",
      "operation": "operation_name",
      "parameters": {
        "param1": "value1",
        "param2": "value2"
      },
      "confidence": 0.95
    }
  ]
}

For model creation, extract these parameters:
- name: The model name (required)
- displayName: The display name (required - if not explicitly provided, use the same value as name)
- description: Optional description
- fields: Array of field objects with name, type, required, description

For field extraction, look for patterns like:
- "field called 'name' that should be string type"
- "name should be string type"
- "age should be number type"

Return an empty array if no tools should be called.`;
  }

  private getToolOperations(tool: BotTool): string[] {
    switch (tool.type) {
      case 'mcp_tool':
        return [
          'create_model',
          'list_models',
          'get_model',
          'update_model',
          'delete_model',
          'create_application',
          'list_applications',
          'get_application',
          'update_application',
          'delete_application',
          'create_bot',
          'list_bots',
          'get_bot',
          'update_bot',
          'delete_bot',
          'create_prompt',
          'list_prompts',
          'get_prompt',
          'update_prompt',
          'delete_prompt',
          'create_feature',
          'list_features',
          'get_feature',
          'update_feature',
          'delete_feature',
          'create_workflow',
          'list_workflows',
          'get_workflow',
          'update_workflow',
          'delete_workflow',
          'get_user_info',
          'list_user_data',
          'search_platform'
        ];
      case 'http_request':
        return ['GET', 'POST', 'PUT', 'DELETE'];
      case 'shell_command':
        return ['execute_command'];
      case 'file_operation':
        return ['read_file', 'write_file', 'delete_file'];
      default:
        return ['unknown'];
    }
  }

  private getParameterExamples(tool: BotTool): string {
    switch (tool.type) {
      case 'mcp_tool':
        return `For create_model:
- name: "UserModel"
- displayName: "User Model" 
- description: "Model for user data"
- fields: [{"name": "email", "type": "string", "required": true}, {"name": "age", "type": "number", "required": false}]

For list_models:
- userId: "user-id-here"

For get_model:
- id: "model-id-here"
- userId: "user-id-here"`;
      case 'http_request':
        return `- url: "https://api.example.com/endpoint"
- method: "GET"
- headers: {"Content-Type": "application/json"}
- body: {"key": "value"}`;
      case 'shell_command':
        return `- command: "ls -la"
- workingDirectory: "/app"`;
      case 'file_operation':
        return `- path: "/path/to/file"
- content: "file content" (for write operations)`;
      default:
        return 'No examples available';
    }
  }

  private parseLLMResponse(response: string, tools: BotTool[], userId: string): ToolCall[] {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('No JSON found in LLM response:', response);
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.toolCalls || !Array.isArray(parsed.toolCalls)) {
        console.log('Invalid toolCalls format in LLM response:', parsed);
        return [];
      }

      const toolCalls: ToolCall[] = [];

      for (const toolCall of parsed.toolCalls) {
        const tool = tools.find(t => t.name === toolCall.toolName);
        if (!tool) {
          console.log(`Tool not found: ${toolCall.toolName}`);
          continue;
        }

        // Add userId to parameters
        const params = {
          ...toolCall.parameters,
          userId,
          operation: toolCall.operation
        };

        toolCalls.push({ tool, params });
      }

      return toolCalls;
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      console.log('Raw response:', response);
      return [];
    }
  }
} 
