import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';
import { Model } from '../entities/Model.js';
import { Workflow } from '../entities/Workflow.js';
import { WorkflowAction } from '../entities/WorkflowAction.js';
import { CodeTemplate } from '../entities/CodeTemplate.js';
import { Application } from '../entities/Application.js';
import { Feature } from '../entities/Feature.js';
import { Component } from '../entities/Component.js';
import { Prompt } from '../entities/Prompt.js';
import { Bot } from '../entities/Bot.js';
import { BotTool } from '../entities/BotTool.js';
import { PromptVersion } from '../entities/PromptVersion.js';
import { Template } from '../entities/Template.js';
import { Relationship } from '../entities/Relationship.js';
import { UserSettings } from '../entities/UserSettings.js';
import { FixtureLoader } from './fixtureLoader.js';
import bcrypt from 'bcryptjs';

export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('Loading fixtures...');
    const fixtureLoader = new FixtureLoader();
    const fixtures = fixtureLoader.loadAllFixtures();
    console.log('Loaded fixture keys:', Object.keys(fixtures));
    if (fixtures.features) {
      console.log('Loaded features fixture length:', fixtures.features.length);
    }

    // Initialize repositories
    const userRepository = AppDataSource.getRepository(User);
    const modelRepository = AppDataSource.getRepository(Model);
    const workflowRepository = AppDataSource.getRepository(Workflow);
    const workflowActionRepository = AppDataSource.getRepository(WorkflowAction);
    const codeTemplateRepository = AppDataSource.getRepository(CodeTemplate);
    const applicationRepository = AppDataSource.getRepository(Application);
    const featureRepository = AppDataSource.getRepository(Feature);
    const componentRepository = AppDataSource.getRepository(Component);
    const promptRepository = AppDataSource.getRepository(Prompt);
    const botRepository = AppDataSource.getRepository(Bot);
    const botToolRepository = AppDataSource.getRepository(BotTool);
    const promptVersionRepository = AppDataSource.getRepository(PromptVersion);
    const templateRepository = AppDataSource.getRepository(Template);
    const relationshipRepository = AppDataSource.getRepository(Relationship);
    const userSettingsRepository = AppDataSource.getRepository(UserSettings);

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.error('Seeding process timed out after 30 seconds');
      process.exit(1);
    }, 30000);

    // Check if data already exists - check all tables
    const existingUsers = await userRepository.find();
    const existingFeatures = await featureRepository.find();
    const existingApplications = await applicationRepository.find();
    const existingModels = await modelRepository.find();
    const existingPrompts = await promptRepository.find();
    const existingBots = await botRepository.find();
    const existingWorkflows = await workflowRepository.find();

    if (existingUsers.length > 0 || existingFeatures.length > 0 || existingApplications.length > 0 ||
        existingModels.length > 0 || existingPrompts.length > 0 || existingBots.length > 0 || existingWorkflows.length > 0) {
      console.log('Database already seeded with data, skipping...');
      clearTimeout(timeout);
      return;
    }

    console.log('Creating default user...');
    // Create default user from fixtures or use existing
    const userData = fixtures.users?.[0];
    if (!userData) {
      throw new Error('No user data found in fixtures');
    }

    // Check if user already exists
    let savedUser: User | null = await userRepository.findOne({ where: { email: userData.email } });
    if (!savedUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const defaultUser = userRepository.create({
        ...userData,
        password: hashedPassword
      } as any);
      await userRepository.save(defaultUser);
      // Fetch the user again after creation
      savedUser = await userRepository.findOne({ where: { email: userData.email } });
    }

    if (!savedUser) {
      throw new Error('Failed to create or find user for seeding');
    }

    console.log('Creating system models...');
    // Create system models from fixtures
    if (fixtures.models) {
      for (const modelData of fixtures.models) {
        try {
          const model = modelRepository.create({
            ...modelData,
            userId: savedUser!.id
          });
          await modelRepository.save(model);
        } catch (error) {
          console.error('Error creating model:', error);
        }
      }
    }

    console.log('Creating applications...');
    // Create applications from fixtures
    if (fixtures.applications) {
      for (const appData of fixtures.applications) {
        try {
          const application = applicationRepository.create({
            ...appData,
            userId: savedUser!.id
          });
          await applicationRepository.save(application);
        } catch (error) {
          console.error('Error creating application:', error);
        }
      }
    }

    console.log('Creating features...');
    // Create features from fixtures
    if (fixtures.features) {
      console.log('Number of features in fixtures:', fixtures.features.length);
      for (const featureData of fixtures.features) {
        try {
          const feature = featureRepository.create({
            ...featureData,
            userId: savedUser!.id
          });
          await featureRepository.save(feature);
          console.log('Inserted feature:', JSON.stringify(feature, null, 2));
        } catch (error) {
          console.error('Error creating feature:', error);
        }
      }
    }

    console.log('Creating components...');
    // Create components from fixtures
    if (fixtures.components) {
      // Get the first application to use as default applicationId
      const defaultApp = await applicationRepository.findOne({ where: { name: 'api' } });
      if (!defaultApp) {
        console.log('No default application found, skipping components...');
      } else {
        for (const componentData of fixtures.components) {
          try {
            const component = componentRepository.create({
              ...componentData,
              applicationId: defaultApp.id
            });
            await componentRepository.save(component);
          } catch (error) {
            console.error('Error creating component:', error);
          }
        }
      }
    }

    console.log('Creating prompts...');
    // Create prompts from fixtures
    if (fixtures.prompts) {
      for (const promptData of fixtures.prompts) {
        try {
          const prompt = promptRepository.create({
            ...promptData,
            userId: savedUser!.id
          });
          await promptRepository.save(prompt);
        } catch (error) {
          console.error('Error creating prompt:', error);
        }
      }
    }

    console.log('Creating prompt versions...');
    // Create prompt versions from fixtures
    if (fixtures.promptVersions) {
      for (const versionData of fixtures.promptVersions) {
        try {
          // Find the prompt by name
          const prompt = await promptRepository.findOne({ 
            where: { name: versionData.promptId } 
          });
          
          if (prompt) {
            const version = promptVersionRepository.create({
              ...versionData,
              promptId: prompt.id
            });
            await promptVersionRepository.save(version);
          } else {
            console.warn(`Prompt not found for version ${versionData.name}: ${versionData.promptId}`);
          }
        } catch (error) {
          console.error('Error creating prompt version:', error);
        }
      }
    }

    console.log('Creating bots...');
    // Create bots from fixtures
    if (fixtures.bots) {
      for (const botData of fixtures.bots) {
        try {
          const bot = botRepository.create({
            ...botData,
            userId: savedUser!.id
          });
          await botRepository.save(bot);
        } catch (error) {
          console.error('Error creating bot:', error);
        }
      }
    }

    console.log('Linking bots to prompts...');
    // Link bots to their appropriate prompts
    const botPromptMappings = [
      { botName: 'meta-platform-support', promptName: 'platform-support' },
      { botName: 'code-builder', promptName: 'code-builder' },
      { botName: 'sysadmin', promptName: 'sysadmin' },
      { botName: 'code-generator', promptName: 'code-generation' },
      { botName: 'model-assistant', promptName: 'model-creation' },
      { botName: 'workflow-assistant', promptName: 'workflow-generation' },
      { botName: 'deployment-bot', promptName: 'code-builder' }
    ];

    for (const mapping of botPromptMappings) {
      try {
        const bot = await botRepository.findOne({ where: { name: mapping.botName } });
        const prompt = await promptRepository.findOne({ where: { name: mapping.promptName } });
        
        if (bot && prompt) {
          // Add the prompt to the bot's prompts
          bot.prompts = [prompt];
          await botRepository.save(bot);
        } else {
          console.warn(`Bot or prompt not found for mapping: ${mapping.botName} -> ${mapping.promptName}`);
        }
      } catch (error) {
        console.error('Error linking bot to prompt:', error);
      }
    }

    console.log('Creating bot tools...');
    // Create bot tools from fixtures
    if (fixtures.botTools) {
      for (const toolData of fixtures.botTools) {
        try {
          // Find the bot by name for system bots
          const bot = await botRepository.findOne({ 
            where: { name: toolData.botId } 
          });
          
          if (bot) {
            const tool = botToolRepository.create({
              ...toolData,
              botId: bot.id
            });
            await botToolRepository.save(tool);
          } else {
            console.warn(`Bot not found for tool ${toolData.name}: ${toolData.botId}`);
          }
        } catch (error) {
          console.error('Error creating bot tool:', error);
        }
      }
    }

    console.log('Creating workflows...');
    // Create workflows from fixtures
    if (fixtures.workflows) {
      for (const workflowData of fixtures.workflows) {
        try {
          const workflow = workflowRepository.create(workflowData);
          await workflowRepository.save(workflow);
        } catch (error) {
          console.error('Error creating workflow:', error);
        }
      }
    }

    console.log('Creating workflow actions...');
    // Create workflow actions from fixtures
    if (fixtures.workflowActions) {
      // Get the first workflow to use as default workflowId
      const workflows = await workflowRepository.find();
      if (workflows.length === 0) {
        console.log('No workflows found, skipping workflow actions...');
      } else {
        const defaultWorkflow = workflows[0];
        if (!defaultWorkflow) {
          console.log('No workflows found, skipping workflow actions...');
        } else {
          for (const actionData of fixtures.workflowActions) {
            try {
              const action = workflowActionRepository.create({
                ...actionData,
                workflowId: defaultWorkflow.id
              });
              await workflowActionRepository.save(action);
            } catch (error) {
              console.error('Error creating workflow action:', error);
            }
          }
        }
      }
    }

    console.log('Creating templates...');
    // Create templates from fixtures
    if (fixtures.templates) {
      for (const templateData of fixtures.templates) {
        try {
          const template = templateRepository.create(templateData);
          await templateRepository.save(template);
        } catch (error) {
          console.error('Error creating template:', error);
        }
      }
    }

    console.log('Creating code templates...');
    // Create code templates from fixtures
    if (fixtures.codeTemplates) {
      for (const codeTemplateData of fixtures.codeTemplates) {
        try {
          const codeTemplate = codeTemplateRepository.create(codeTemplateData);
          await codeTemplateRepository.save(codeTemplate);
        } catch (error) {
          console.error('Error creating code template:', error);
        }
      }
    }

    console.log('Creating relationships...');
    // Create relationships from fixtures
    if (fixtures.relationships) {
      for (const relationshipData of fixtures.relationships) {
        try {
          const relationship = relationshipRepository.create({
            ...relationshipData,
            userId: savedUser!.id
          });
          await relationshipRepository.save(relationship);
        } catch (error) {
          console.error('Error creating relationship:', error);
        }
      }
    }

    console.log('Creating user settings...');
    // Create user settings from fixtures
    if (fixtures.userSettings) {
      for (const settingsData of fixtures.userSettings) {
        try {
          const userSettings = userSettingsRepository.create({
            ...settingsData,
            user: savedUser
          });
          await userSettingsRepository.save(userSettings);
        } catch (error) {
          console.error('Error creating user settings:', error);
        }
      }
    }

    clearTimeout(timeout);
    console.log('Database seeded successfully with JSON fixtures');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};
