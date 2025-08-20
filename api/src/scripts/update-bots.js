#!/usr/bin/env node

import { AppDataSource } from '../config/database.js';
import { Bot } from '../entities/Bot.js';
import { AIModel } from '../entities/AIModel.js';

async function main() {
  await AppDataSource.initialize();

  const botRepo = AppDataSource.getRepository(Bot);
  const aiModelRepo = AppDataSource.getRepository(AIModel);

  // Get the Gemini 2.5 Flash model
  const geminiModel = await aiModelRepo.findOne({
    where: { name: 'gemini-flash' }
  });

  if (!geminiModel) {
    console.log('Gemini model not found');
    return;
  }

  console.log('Found Gemini model:', geminiModel.id);

  // Update all bots to use this AI model
  const bots = await botRepo.find();

  for (const bot of bots) {
    bot.aiModel = geminiModel;
    bot.aiModelId = geminiModel.id;
    await botRepo.save(bot);
    console.log(`Updated bot ${bot.name} to use AI model ${geminiModel.displayName}`);
  }

  console.log('All bots updated successfully');
  await AppDataSource.destroy();
}

main().catch(console.error);
