#!/usr/bin/env node

import 'reflect-metadata';
import dotenv from 'dotenv';
import { initializeDatabase } from '../config/database.js';
import { AppDataSource } from '../config/database.js';

// Load environment variables
dotenv.config();

async function checkBotTools() {
  try {
    console.log('🔌 Initializing database connection...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    // Get all bots
    const bots = await AppDataSource.query(`
      SELECT b.id, b.name, b.description, u.email as owner_email
      FROM bots b
      LEFT JOIN users u ON b."userId" = u.id
      ORDER BY b.name
    `);

    console.log('\n📋 **All Bots:**');
    bots.forEach((bot: any) => {
      console.log(`- ${bot.name} (${bot.id})`);
      console.log(`  Description: ${bot.description}`);
      console.log(`  Owner: ${bot.owner_email}`);
    });

    // Get all tools
    const tools = await AppDataSource.query(`
      SELECT id, name, description, type
      FROM bot_tools
      ORDER BY name
    `);

    console.log('\n🔧 **All Available Tools:**');
    tools.forEach((tool: any) => {
      console.log(`- ${tool.name} (${tool.id})`);
      console.log(`  Type: ${tool.type}`);
      console.log(`  Description: ${tool.description}`);
    });

    // Get bot-tool associations
    const botTools = await AppDataSource.query(`
      SELECT
        bt."botId",
        bt."toolId",
        b.name as bot_name,
        t.name as tool_name
      FROM bot_tools_bots bt
      LEFT JOIN bots b ON bt."botId" = b.id
      LEFT JOIN bot_tools t ON bt."toolId" = t.id
      ORDER BY b.name, t.name
    `);

    console.log('\n🔗 **Bot-Tool Associations:**');
    if (botTools.length === 0) {
      console.log('❌ No bot-tool associations found!');
    } else {
      const groupedByBot = botTools.reduce((acc: any, bt: any) => {
        if (!acc[bt.bot_name]) {
          acc[bt.bot_name] = [];
        }
        acc[bt.bot_name].push(bt.tool_name);
        return acc;
      }, {});

      Object.entries(groupedByBot).forEach(([botName, tools]: [string, any]) => {
        console.log(`\n🤖 ${botName}:`);
        tools.forEach((tool: string) => {
          console.log(`  - ${tool}`);
        });
      });
    }

    // Check specifically for Meta Platform Support Bot
    const metaBot = await AppDataSource.query(`
      SELECT b.id, b.name, b.description
      FROM bots b
      WHERE b.name ILIKE '%platform%support%' OR b.name ILIKE '%meta%platform%'
    `);

    if (metaBot.length > 0) {
      console.log('\n🎯 **Meta Platform Support Bot Details:**');
      metaBot.forEach((bot: any) => {
        console.log(`- ${bot.name} (${bot.id})`);
        console.log(`  Description: ${bot.description}`);

        // Check its tools
        const botTools = botTools.filter((bt: any) => bt.botId === bot.id);
        if (botTools.length === 0) {
          console.log(`  ❌ No tools assigned!`);
        } else {
          console.log(`  ✅ Tools assigned:`);
          botTools.forEach((bt: any) => {
            console.log(`    - ${bt.tool_name}`);
          });
        }
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('💥 Failed to check bot tools:', error);
    process.exit(1);
  }
}

checkBotTools();
