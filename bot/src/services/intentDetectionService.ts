import { BotTool } from '../entities/BotTool.js';
import { AIModel } from '../entities/AIModel.js';
import { LLMServiceFactory } from './llmServiceFactory.js';

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
  private aiModel: AIModel | null = null;

  constructor() {
    // Will be set when needed
  }

  private async getDefaultAIModel(userId: string): Promise<AIModel> {
    if (!this.aiModel) {
      // Get the default AI model for the user
      const { AppDataSource } = await import('../config/database.js');
      const aiModelRepository = AppDataSource.getRepository(AIModel);
      this.aiModel = await aiModelRepository.findOne({
        where: { userId, isDefault: true, isActive: true }
      });

      if (!this.aiModel) {
        throw new Error('No default AI model found for user');
      }
    }
    return this.aiModel;
  }

  async detectToolCalls(
    message: string,
    tools: BotTool[],
    userId: string,
    aiModel?: AIModel
  ): Promise<ToolCall[]> {
    const availableTools = tools.filter(tool => tool.isActive);

    if (availableTools.length === 0) {
      return [];
    }

    const systemPrompt = this.buildSystemPrompt(availableTools);
    const conversationHistory = ''; // We could pass this in if needed

    try {
      // Use provided AI model or fall back to default
      const modelToUse = aiModel || await this.getDefaultAIModel(userId);
      const llmResponse = await LLMServiceFactory.generateResponse(
        modelToUse,
        message,
        systemPrompt,
        0.1, // Low temperature for more deterministic responses
        1000
      );

      const toolCalls = this.parseLLMResponse(llmResponse.content, availableTools, userId);

      // If LLM parsing failed or no valid tools found, try keyword-based detection as fallback
      if (toolCalls.length === 0) {
        console.log('🔄 LLM parsing failed or no valid tools found, trying keyword-based detection...');
        return this.fallbackKeywordDetection(message, availableTools, userId);
      }

      return toolCalls;
    } catch (error) {
      console.error('Error detecting intent:', error);
      console.log('🔄 Falling back to keyword-based detection...');
      return this.fallbackKeywordDetection(message, availableTools, userId);
    }
  }

  private buildSystemPrompt(tools: BotTool[]): string {
    const toolDescriptions = tools.map(tool => {
      const operations = this.getToolOperations(tool);
      return `
Tool: ${tool.displayName} (EXACT NAME: ${tool.name})
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

CRITICAL: You must respond with ONLY a valid JSON object. Do not include any other text, explanations, or descriptions.

IMPORTANT: Use the EXACT tool name (the part in parentheses) for the "toolName" field, NOT the display name.

The JSON must be in this exact format:
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

Examples of valid responses:

For "list my AI models":
{
  "toolCalls": [
    {
      "toolName": "platform-api-sdk",
      "operation": "list_ai_models",
      "parameters": {
      },
      "confidence": 0.95
    }
  ]
}

For "create a schema called UserSchema":
{
  "toolCalls": [
    {
      "toolName": "platform-api-sdk",
      "operation": "create_schema",
      "parameters": {
        "name": "UserSchema",
        "displayName": "UserSchema",
        "description": "Schema for user data",
        "fields": []
      },
      "confidence": 0.95
    }
  ]
}

If no tools should be called, return:
{
  "toolCalls": []
}

Remember: ONLY return the JSON object, nothing else. Use the EXACT tool name, not the display name.`;
  }

  private getToolOperations(tool: BotTool): string[] {
    switch (tool.type) {
      case 'mcp_tool':
        return [
          'create_schema',
          'list_schemas',
          'get_schema',
          'update_schema',
          'delete_schema',
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
        return `For create_schema:
- name: "UserSchema"
- displayName: "User Schema"
- description: "Schema for user data"
- fields: [{"name": "email", "type": "string", "required": true}, {"name": "age", "type": "number", "required": false}]

For list_schemas:
- (no parameters needed for platform-api-sdk)

For get_schema:
- id: "schema-id-here"`;
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
      console.log('🔍 Parsing LLM response for tool calls...');
      console.log('Raw response:', response);

      // Check if the response looks like JSON
      const trimmedResponse = response.trim();
      if (!trimmedResponse.startsWith('{') || !trimmedResponse.includes('"toolCalls"')) {
        console.log('❌ LLM response is not in expected JSON format, triggering fallback...');
        return []; // Return empty array to trigger fallback
      }

      // Try to extract JSON from the response - look for the first valid JSON object
      let jsonMatch = response.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) {
        console.log('No JSON found in LLM response');
        return [];
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.log('Failed to parse extracted JSON, trying to find valid JSON...');
        // Try to find a valid JSON object by looking for the start and end
        const startIdx = response.indexOf('{');
        const endIdx = response.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          const jsonStr = response.substring(startIdx, endIdx + 1);
          try {
            parsed = JSON.parse(jsonStr);
          } catch (secondError) {
            console.log('Failed to parse JSON even with manual extraction');
            console.log('Raw response:', response);
            return [];
          }
        } else {
          console.log('Could not find valid JSON structure');
          return [];
        }
      }

      if (!parsed.toolCalls || !Array.isArray(parsed.toolCalls)) {
        console.log('Invalid toolCalls format in LLM response:', parsed);
        return [];
      }

      const toolCalls: ToolCall[] = [];

      for (const toolCall of parsed.toolCalls) {
        if (!toolCall.toolName || !toolCall.operation) {
          console.log('Invalid tool call format:', toolCall);
          continue;
        }

        const tool = tools.find(t => t.name === toolCall.toolName);
        if (!tool) {
          console.log(`Tool not found: ${toolCall.toolName}`);
          continue;
        }

        // Add userId to parameters (but don't override for system tools)
        const params = {
          ...toolCall.parameters,
          operation: toolCall.operation
        };

        // Only add userId if it's not already provided (for system tools like platform-api-sdk)
        if (!params.userId) {
          params.userId = userId;
        }

        toolCalls.push({ tool, params });
      }

      console.log(`✅ Successfully parsed ${toolCalls.length} tool calls`);
      return toolCalls;
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      console.log('Raw response:', response);
      return [];
    }
  }

  private fallbackKeywordDetection(message: string, tools: BotTool[], userId: string): ToolCall[] {
    const lowerMessage = message.toLowerCase();
    const toolCalls: ToolCall[] = [];

    console.log('🔍 Using keyword-based tool detection...');

    // Check for AI models related requests
    if (lowerMessage.includes('ai model') || lowerMessage.includes('ai models') || lowerMessage.includes('list my ai')) {
      const platformTool = tools.find(t => t.name === 'platform-api-sdk');
      if (platformTool) {
        toolCalls.push({
          tool: platformTool,
          params: {
            operation: 'list_ai_models'
            // Don't add userId for platform-api-sdk - it uses its configured system userId
          }
        });
        console.log('✅ Detected AI models list request via keywords');
      }
    }

    // Check for schema related requests
    if (lowerMessage.includes('schema') || lowerMessage.includes('schemas')) {
      if (lowerMessage.includes('create') || lowerMessage.includes('new')) {
        const platformTool = tools.find(t => t.name === 'platform-api-sdk');
        if (platformTool) {
          // Extract schema name from message
          const nameMatch = message.match(/create.*?schema.*?called\s+["']?([^"'\s]+)["']?/i) ||
                           message.match(/create.*?schema.*?named\s+["']?([^"'\s]+)["']?/i) ||
                           message.match(/new.*?schema.*?called\s+["']?([^"'\s]+)["']?/i);

          const schemaName = nameMatch ? nameMatch[1] : 'NewSchema';

          toolCalls.push({
            tool: platformTool,
            params: {
              operation: 'create_schema',
              name: schemaName,
              displayName: schemaName,
              description: `Schema created from user request: ${message}`,
              fields: []
              // Don't add userId for platform-api-sdk - it uses its configured system userId
            }
          });
          console.log(`✅ Detected schema creation request via keywords: ${schemaName}`);
        }
      } else if (lowerMessage.includes('list') || lowerMessage.includes('show')) {
        const platformTool = tools.find(t => t.name === 'platform-api-sdk');
        if (platformTool) {
        toolCalls.push({
          tool: platformTool,
          params: {
            operation: 'list_schemas'
            // Don't add userId for platform-api-sdk - it uses its configured system userId
          }
        });
          console.log('✅ Detected schema list request via keywords');
        }
      }
    }

    // Check for bot related requests
    if (lowerMessage.includes('bot') || lowerMessage.includes('bots')) {
      if (lowerMessage.includes('list') || lowerMessage.includes('show')) {
        const platformTool = tools.find(t => t.name === 'platform-api-sdk');
        if (platformTool) {
          toolCalls.push({
            tool: platformTool,
            params: {
              operation: 'list_bots'
              // Don't add userId for platform-api-sdk - it uses its configured system userId
            }
          });
          console.log('✅ Detected bot list request via keywords');
        }
      }
    }

    // Check for application related requests
    if (lowerMessage.includes('app') || lowerMessage.includes('application') || lowerMessage.includes('applications')) {
      if (lowerMessage.includes('list') || lowerMessage.includes('show')) {
        const platformTool = tools.find(t => t.name === 'platform-api-sdk');
        if (platformTool) {
          toolCalls.push({
            tool: platformTool,
            params: {
              operation: 'list_applications'
              // Don't add userId for platform-api-sdk - it uses its configured system userId
            }
          });
          console.log('✅ Detected application list request via keywords');
        }
      }
    }

    console.log(`🔍 Keyword detection found ${toolCalls.length} tool calls`);
    return toolCalls;
  }
}
