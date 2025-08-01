import { BotTool, ToolType } from '../entities/BotTool.js';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AppDataSource } from '../config/database.js';

const execAsync = promisify(exec);

export class ToolExecutionService {
  static async executeTool(tool: BotTool, params: Record<string, any>): Promise<any> {
    switch (tool.type) {
      case ToolType.HTTP_REQUEST:
        return await this.executeHttpRequest(tool, params);

      case ToolType.DATABASE_QUERY:
        return await this.executeDatabaseQuery(tool, params);

      case ToolType.FILE_OPERATION:
        return await this.executeFileOperation(tool, params);

      case ToolType.SHELL_COMMAND:
        return await this.executeShellCommand(tool, params);

      case ToolType.CUSTOM_SCRIPT:
        return await this.executeCustomScript(tool, params);

      case ToolType.WORKFLOW_ACTION:
        return await this.executeWorkflowAction(tool, params);

      default:
        throw new Error(`Unknown tool type: ${tool.type}`);
    }
  }

  private static async executeHttpRequest(tool: BotTool, params: Record<string, any>): Promise<any> {
    const { url, method = 'GET', headers = {}, body } = tool.config;

    const response = await axios({
      method,
      url: this.interpolateParams(url, params),
      headers,
      data: body ? this.interpolateParams(body, params) : undefined,
      timeout: 10000 // 10 second timeout
    });

    return {
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  }

  private static async executeDatabaseQuery(tool: BotTool, params: Record<string, any>): Promise<any> {
    const { query, type = 'select' } = tool.config;
    const interpolatedQuery = this.interpolateParams(query, params);

    const queryRunner = AppDataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      let result;
      switch (type) {
        case 'select':
          result = await queryRunner.query(interpolatedQuery);
          break;
        case 'insert':
        case 'update':
        case 'delete':
          result = await queryRunner.query(interpolatedQuery);
          break;
        default:
          throw new Error(`Unknown query type: ${type}`);
      }

      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private static async executeFileOperation(tool: BotTool, params: Record<string, any>): Promise<any> {
    const { operation, path, content } = tool.config;
    const fs = await import('fs-extra');

    const safePath = this.interpolateParams(path, params);

    // Security: Only allow operations in safe directories
    const safeDirectories = ['/app/data', '/tmp'];
    const isPathSafe = safeDirectories.some(dir => safePath.startsWith(dir));

    if (!isPathSafe) {
      throw new Error('File operation not allowed in this directory');
    }

    switch (operation) {
      case 'read':
        return await fs.readFile(safePath, 'utf8');
      case 'write':
        return await fs.writeFile(safePath, content);
      case 'list':
        return await fs.readdir(safePath);
      case 'exists':
        return await fs.pathExists(safePath);
      default:
        throw new Error(`Unknown file operation: ${operation}`);
    }
  }

  private static async executeShellCommand(tool: BotTool, params: Record<string, any>): Promise<any> {
    const { command, cwd, timeout = 30000 } = tool.config;
    const interpolatedCommand = this.interpolateParams(command || '', params);

    // Security: Only allow safe commands
    const safeCommands = [
      'ls', 'cat', 'echo', 'date', 'whoami', 'pwd',
      'ping', 'curl', 'wget', 'dig', 'nslookup',
      'ps', 'top', 'free', 'df', 'du',
      'grep', 'find', 'head', 'tail', 'sort', 'uniq',
      'wc', 'cut', 'tr', 'sed', 'awk'
    ];
    const commandName = interpolatedCommand.split(' ')[0];

    if (!commandName || !safeCommands.includes(commandName)) {
      throw new Error(`Command not allowed: ${commandName}`);
    }

    const { stdout, stderr } = await execAsync(interpolatedCommand, {
      cwd: cwd || '/app',
      timeout
    });

    return {
      stdout,
      stderr,
      success: !stderr
    };
  }

  private static async executeCustomScript(tool: BotTool, params: Record<string, any>): Promise<any> {
    const { script } = tool.config;

    // Create a safe execution environment
    const sandbox = {
      params,
      console: {
        log: (...args: any[]) => console.log('[Bot Tool]:', ...args)
      },
      // Add safe math functions
      Math: Math,
      // Add safe string functions
      String: String,
      Number: Number,
      Boolean: Boolean,
      Array: Array,
      Object: Object,
      JSON: JSON,
      Date: Date
    };

    try {
      const result = new Function('params', 'console', 'Math', 'String', 'Number', 'Boolean', 'Array', 'Object', 'JSON', 'Date', script);
      return result.call(sandbox, params, sandbox.console, Math, String, Number, Boolean, Array, Object, JSON, Date);
    } catch (error) {
      throw new Error(`Script execution failed: ${error}`);
    }
  }

  private static async executeWorkflowAction(tool: BotTool, params: Record<string, any>): Promise<any> {
    const { workflowActionId } = tool.config;

    // This would integrate with your existing WorkflowAction system
    // For now, return a placeholder
    return {
      message: 'Workflow action execution not yet implemented',
      workflowActionId,
      params
    };
  }

  private static interpolateParams(template: string, params: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] || match;
    });
  }
}
