import express from 'express';
import { AppDataSource } from '../config/database.js';
import { BotTool, ToolType } from '../entities/BotTool.js';
import { Bot } from '../entities/Bot.js';

const router = express.Router();
const botToolRepository = AppDataSource.getRepository(BotTool);
const botRepository = AppDataSource.getRepository(Bot);

// Get bot tools
router.get('/bots/:botId/tools', async (req, res) => {
  try {
    const { botId } = req.params;
    const { userId } = req.query;

    // Verify bot ownership
    const bot = await botRepository.findOne({
      where: { id: botId, userId: userId as string }
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found or unauthorized' });
    }

    const tools = await botToolRepository.find({
      where: { botId, isActive: true },
      order: { createdAt: 'ASC' }
    });

    return res.json(tools);
  } catch (error) {
    console.error('Failed to fetch bot tools:', error);
    return res.status(500).json({ error: 'Failed to fetch tools' });
  }
});

// Add tool to bot
router.post('/bots/:botId/tools', async (req, res) => {
  try {
    const { botId } = req.params;
    const { userId } = req.body;
    const toolData = req.body;

    // Verify bot ownership
    const bot = await botRepository.findOne({
      where: { id: botId, userId }
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found or unauthorized' });
    }

    // Validate tool data
    if (!toolData.name || !toolData.displayName || !toolData.type) {
      return res.status(400).json({ error: 'Missing required tool fields' });
    }

    // Validate tool type
    if (!Object.values(ToolType).includes(toolData.type)) {
      return res.status(400).json({ error: 'Invalid tool type' });
    }

    const tool = botToolRepository.create({
      ...toolData,
      botId
    });

    await botToolRepository.save(tool);
    return res.json(tool);
  } catch (error) {
    console.error('Failed to add tool:', error);
    return res.status(500).json({ error: 'Failed to add tool' });
  }
});

// Update tool
router.put('/bots/:botId/tools/:toolId', async (req, res) => {
  try {
    const { botId, toolId } = req.params;
    const { userId } = req.body;
    const updateData = req.body;

    // Verify bot ownership
    const bot = await botRepository.findOne({
      where: { id: botId, userId }
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found or unauthorized' });
    }

    const tool = await botToolRepository.findOne({
      where: { id: toolId, botId }
    });

    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    // Update tool
    Object.assign(tool, updateData);
    await botToolRepository.save(tool);

    return res.json(tool);
  } catch (error) {
    console.error('Failed to update tool:', error);
    return res.status(500).json({ error: 'Failed to update tool' });
  }
});

// Delete tool
router.delete('/bots/:botId/tools/:toolId', async (req, res) => {
  try {
    const { botId, toolId } = req.params;
    const { userId } = req.query;

    // Verify bot ownership
    const bot = await botRepository.findOne({
      where: { id: botId, userId: userId as string }
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found or unauthorized' });
    }

    const tool = await botToolRepository.findOne({
      where: { id: toolId, botId }
    });

    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    await botToolRepository.remove(tool);
    return res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete tool:', error);
    return res.status(500).json({ error: 'Failed to delete tool' });
  }
});

// Test tool execution
router.post('/bots/:botId/tools/:toolId/test', async (req, res) => {
  try {
    const { botId, toolId } = req.params;
    const { userId, params = {} } = req.body;

    // Verify bot ownership
    const bot = await botRepository.findOne({
      where: { id: botId, userId }
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found or unauthorized' });
    }

    const tool = await botToolRepository.findOne({
      where: { id: toolId, botId }
    });

    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    // Provide default test parameters based on tool type
    let testParams = { ...params };
    if (tool.type === 'shell_command') {
      if (tool.name.includes('ping') || tool.config.command?.includes('ping')) {
        testParams.host = 'localhost';
      }
      if (tool.name.includes('curl') || tool.config.command?.includes('curl')) {
        testParams.url = 'https://httpbin.org/get';
      }
    } else if (tool.type === 'http_request') {
      testParams.url = 'https://httpbin.org/get';
    } else if (tool.type === 'file_operation') {
      testParams.path = '/tmp/test.txt';
    } else if (tool.type === 'mcp_tool') {
      testParams.operation = 'list_bots';
    }

    // Import and execute tool
    const { ToolExecutionService } = await import('../services/toolExecutionService.js');
    const result = await ToolExecutionService.executeTool(tool, testParams);

    return res.json({ success: true, result });
  } catch (error) {
    console.error('Failed to test tool:', error);
    return res.status(500).json({
      error: 'Failed to test tool',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all tools (standalone)
router.get('/tools', async (req, res) => {
  try {
    const { userId } = req.query;

    const tools = await botToolRepository.find({
      where: { isActive: true },
      relations: ['bot'],
      order: { createdAt: 'ASC' }
    });

    return res.json(tools);
  } catch (error) {
    console.error('Failed to fetch tools:', error);
    return res.status(500).json({ error: 'Failed to fetch tools' });
  }
});

// Get system tools
router.get('/system-tools', async (req, res) => {
  try {
    const tools = await botToolRepository.find({
      where: { isActive: true },
      relations: ['bot'],
      order: { createdAt: 'ASC' }
    });

    // Filter for system tools (tools belonging to system bots)
    const systemTools = tools.filter(tool => 
      tool.bot && tool.bot.userId === 'system'
    );

    return res.json(systemTools);
  } catch (error) {
    console.error('Failed to fetch system tools:', error);
    return res.status(500).json({ error: 'Failed to fetch system tools' });
  }
});

// Add standalone tool
router.post('/tools', async (req, res) => {
  try {
    const { userId } = req.body;
    const toolData = req.body;

    // Validate tool data
    if (!toolData.name || !toolData.displayName || !toolData.type) {
      return res.status(400).json({ error: 'Missing required tool fields' });
    }

    // Validate tool type
    if (!Object.values(ToolType).includes(toolData.type)) {
      return res.status(400).json({ error: 'Invalid tool type' });
    }

    const tool = botToolRepository.create(toolData);
    await botToolRepository.save(tool);
    return res.json(tool);
  } catch (error) {
    console.error('Failed to add tool:', error);
    return res.status(500).json({ error: 'Failed to add tool' });
  }
});

// Update standalone tool
router.put('/tools/:toolId', async (req, res) => {
  try {
    const { toolId } = req.params;
    const { userId } = req.body;
    const updateData = req.body;

    const tool = await botToolRepository.findOne({
      where: { id: toolId }
    });

    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    // Update tool
    Object.assign(tool, updateData);
    await botToolRepository.save(tool);

    return res.json(tool);
  } catch (error) {
    console.error('Failed to update tool:', error);
    return res.status(500).json({ error: 'Failed to update tool' });
  }
});

// Delete standalone tool
router.delete('/tools/:toolId', async (req, res) => {
  try {
    const { toolId } = req.params;
    const { userId } = req.query;

    const tool = await botToolRepository.findOne({
      where: { id: toolId }
    });

    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    await botToolRepository.remove(tool);
    return res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete tool:', error);
    return res.status(500).json({ error: 'Failed to delete tool' });
  }
});

// Test standalone tool execution
router.post('/tools/:toolId/test', async (req, res) => {
  try {
    const { toolId } = req.params;
    const { userId, params = {} } = req.body;

    const tool = await botToolRepository.findOne({
      where: { id: toolId }
    });

    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    // Provide default test parameters based on tool type
    let testParams = { ...params };
    if (tool.type === 'shell_command') {
      if (tool.name.includes('ping') || tool.config.command?.includes('ping')) {
        testParams.host = 'localhost';
      }
      if (tool.name.includes('curl') || tool.config.command?.includes('curl')) {
        testParams.url = 'https://httpbin.org/get';
      }
    } else if (tool.type === 'http_request') {
      testParams.url = 'https://httpbin.org/get';
    } else if (tool.type === 'file_operation') {
      testParams.path = '/tmp/test.txt';
    } else if (tool.type === 'mcp_tool') {
      testParams.operation = 'list_bots';
    }

    // Import and execute tool
    const { ToolExecutionService } = await import('../services/toolExecutionService.js');
    const result = await ToolExecutionService.executeTool(tool, testParams);

    return res.json({ success: true, result });
  } catch (error) {
    console.error('Failed to test tool:', error);
    return res.status(500).json({
      error: 'Failed to test tool',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
