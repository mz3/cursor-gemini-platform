#!/usr/bin/env node

import 'reflect-metadata';
import dotenv from 'dotenv';
import { initializeDatabase } from '../config/database.js';
import { AppDataSource } from '../config/database.js';

// Load environment variables
dotenv.config();

async function fixBotTools() {
  try {
    console.log('🔌 Initializing database connection...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    // Get all bots
    const bots = await AppDataSource.query(`
      SELECT id, name, displayName
      FROM bots
      ORDER BY name
    `);

    console.log('\n📋 **Available Bots:**');
    bots.forEach((bot: any) => {
      console.log(`- ${bot.name} (${bot.id})`);
    });

    // Get all tools
    const tools = await AppDataSource.query(`
      SELECT id, name, displayName, "botId"
      FROM bot_tools
      ORDER BY name
    `);

    console.log('\n🔧 **Current Tools:**');
    tools.forEach((tool: any) => {
      console.log(`- ${tool.name} (${tool.id}) - botId: ${tool.botId}`);
    });

    // Check which tools need to be associated with bots
    const toolsNeedingAssociation = tools.filter((tool: any) => {
      // Check if botId is a bot name (not a UUID)
      return !tool.botId || !tool.botId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    if (toolsNeedingAssociation.length === 0) {
      console.log('\n✅ All tools are properly associated with bots!');
      return;
    }

    console.log('\n🔧 **Tools Needing Association:**');
    toolsNeedingAssociation.forEach((tool: any) => {
      console.log(`- ${tool.name} (${tool.id}) - current botId: ${tool.botId}`);
    });

    // Load fixtures to get the correct bot associations
    const { FixtureLoader } = await import('../utils/fixtureLoader.js');
    const fixtureLoader = new FixtureLoader();
    const fixtures = fixtureLoader.loadAllFixtures();

    if (!fixtures.botTools) {
      console.log('❌ No bot tools fixture found!');
      return;
    }

    console.log('\n🔄 **Fixing Bot Tool Associations...**');

    for (const fixtureTool of fixtures.botTools) {
      // Find the tool in the database
      const existingTool = await AppDataSource.query(`
        SELECT id, name, "botId"
        FROM bot_tools
        WHERE name = $1
      `, [fixtureTool.name]);

      if (existingTool.length === 0) {
        console.log(`⚠️  Tool not found in database: ${fixtureTool.name}`);
        continue;
      }

      const tool = existingTool[0];

      // Find the bot by name
      const bot = bots.find((b: any) => b.name === fixtureTool.botId);
      if (!bot) {
        console.log(`⚠️  Bot not found for tool ${fixtureTool.name}: ${fixtureTool.botId}`);
        continue;
      }

      // Update the tool's botId
      await AppDataSource.query(`
        UPDATE bot_tools
        SET "botId" = $1
        WHERE id = $2
      `, [bot.id, tool.id]);

      console.log(`✅ Associated tool "${tool.name}" with bot "${bot.name}" (${bot.id})`);
    }

    // Verify the associations
    console.log('\n🔍 **Verifying Associations...**');
    const updatedTools = await AppDataSource.query(`
      SELECT t.id, t.name, t.displayName, t."botId", b.name as bot_name
      FROM bot_tools t
      LEFT JOIN bots b ON t."botId" = b.id
      ORDER BY b.name, t.name
    `);

    const groupedByBot = updatedTools.reduce((acc: any, tool: any) => {
      const botName = tool.bot_name || 'Unassigned';
      if (!acc[botName]) {
        acc[botName] = [];
      }
      acc[botName].push(tool.name);
      return acc;
    }, {});

    Object.entries(groupedByBot).forEach(([botName, tools]: [string, any]) => {
      console.log(`\n🤖 ${botName}:`);
      tools.forEach((tool: string) => {
        console.log(`  - ${tool}`);
      });
    });

    console.log('\n✅ Bot tool associations fixed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('💥 Failed to fix bot tools:', error);
    process.exit(1);
  }
}

fixBotTools();
