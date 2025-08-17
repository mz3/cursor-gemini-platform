#!/usr/bin/env node

import 'reflect-metadata';
import dotenv from 'dotenv';
import { initializeDatabase } from '../config/database.js';
import { AppDataSource } from '../config/database.js';

// Load environment variables
dotenv.config();

async function addBotTools() {
  try {
    console.log('🔌 Initializing database connection...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    // Get the Meta Platform Support Bot
    const metaBot = await AppDataSource.query(`
      SELECT id, name, displayName
      FROM bots
      WHERE name = 'meta-platform-support'
    `);

    if (metaBot.length === 0) {
      console.log('❌ Meta Platform Support Bot not found!');
      return;
    }

    const bot = metaBot[0];
    console.log(`✅ Found bot: ${bot.displayName} (${bot.id})`);

    // Define tools for the Meta Platform Support Bot
    const tools = [
      {
        name: 'platform-api-sdk',
        displayName: 'Platform API SDK',
        description: 'Comprehensive API SDK for accessing all platform features - schemas, applications, bots, prompts, tools, etc.',
        type: 'mcp_tool',
        config: {
          platformEndpoint: 'http://api:4000/api',
          userId: 'system',
          permissions: ['read', 'write', 'execute'],
          operations: [
            'list_schemas', 'get_schema', 'create_schema', 'update_schema', 'delete_schema',
            'list_applications', 'get_application', 'create_application', 'update_application', 'delete_application',
            'list_bots', 'get_bot', 'create_bot', 'update_bot', 'delete_bot',
            'list_prompts', 'get_prompt', 'create_prompt', 'update_prompt', 'delete_prompt',
            'list_tools', 'get_tool', 'create_tool', 'update_tool', 'delete_tool',
            'list_features', 'get_feature', 'create_feature', 'update_feature', 'delete_feature',
            'list_workflows', 'get_workflow', 'create_workflow', 'update_workflow', 'delete_workflow',
            'execute_bot', 'start_bot_instance', 'stop_bot_instance', 'get_bot_instance',
            'get_user_info', 'list_user_data', 'search_platform'
          ]
        },
        isActive: true,
        requiresAuth: true
      },
      {
        name: 'list-user-schemas',
        displayName: 'List User Schemas',
        description: 'Lists all data schemas created by a user',
        type: 'http_request',
        config: {
          url: 'http://api:4000/api/schemas',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          params: {
            userId: '${userId}'
          }
        },
        isActive: true,
        requiresAuth: true
      },
      {
        name: 'list-user-applications',
        displayName: 'List User Applications',
        description: 'Lists all applications created by a user',
        type: 'http_request',
        config: {
          url: 'http://api:4000/api/applications',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          params: {
            userId: '${userId}'
          }
        },
        isActive: true,
        requiresAuth: true
      },
      {
        name: 'list-user-bots',
        displayName: 'List User Bots',
        description: 'Lists all bots created by a user',
        type: 'http_request',
        config: {
          url: 'http://api:4000/api/bots',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          params: {
            userId: '${userId}'
          }
        },
        isActive: true,
        requiresAuth: true
      },
      {
        name: 'user-account-lookup',
        displayName: 'User Account Lookup',
        description: 'Looks up user account information and subscription status',
        type: 'database_query',
        config: {
          query: 'SELECT id, email, firstName, lastName, role, isActive, createdAt FROM users WHERE email = "${email}" OR id = "${userId}"',
          type: 'select'
        },
        isActive: true,
        requiresAuth: true
      }
    ];

    console.log('\n🔄 **Adding Tools to Meta Platform Support Bot...**');

    for (const toolData of tools) {
      // Check if tool already exists
      const existingTool = await AppDataSource.query(`
        SELECT id FROM bot_tools WHERE name = $1
      `, [toolData.name]);

      if (existingTool.length > 0) {
        console.log(`⚠️  Tool already exists: ${toolData.name}`);
        continue;
      }

      // Insert the tool
      await AppDataSource.query(`
        INSERT INTO bot_tools (id, name, "displayName", description, type, config, "isActive", "requiresAuth", "botId", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [
        toolData.name,
        toolData.displayName,
        toolData.description,
        toolData.type,
        JSON.stringify(toolData.config),
        toolData.isActive,
        toolData.requiresAuth,
        bot.id
      ]);

      console.log(`✅ Added tool: ${toolData.name}`);
    }

    // Verify the tools were added
    console.log('\n🔍 **Verifying Tools...**');
    const botTools = await AppDataSource.query(`
      SELECT t.name, t.displayName, t.type
      FROM bot_tools t
      WHERE t."botId" = $1
      ORDER BY t.name
    `, [bot.id]);

    if (botTools.length === 0) {
      console.log('❌ No tools found for the bot!');
    } else {
      console.log(`\n🤖 **Tools for ${bot.displayName}:**`);
      botTools.forEach((tool: any) => {
        console.log(`  - ${tool.displayName} (${tool.type})`);
      });
    }

    console.log('\n✅ Bot tools added successfully!');

    process.exit(0);
  } catch (error) {
    console.error('💥 Failed to add bot tools:', error);
    process.exit(1);
  }
}

addBotTools();
