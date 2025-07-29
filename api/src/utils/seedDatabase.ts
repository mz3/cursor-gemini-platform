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
    const templateRepository = AppDataSource.getRepository(Template);
    const relationshipRepository = AppDataSource.getRepository(Relationship);
    const userSettingsRepository = AppDataSource.getRepository(UserSettings);

    // Check if data already exists
    const existingFeatures = await featureRepository.find();
    if (existingFeatures.length > 0) {
      console.log('Database already seeded with features, skipping...');
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
      });
      const savedUsers = await userRepository.save(defaultUser);
      const newUser = Array.isArray(savedUsers) ? savedUsers[0] : savedUsers;
      if (!newUser) {
        throw new Error('Failed to save user');
      }
      savedUser = newUser;
    }

    if (!savedUser) {
      throw new Error('Failed to create or find user for seeding');
    }

    console.log('Creating system models...');
    // Create system models from fixtures
    if (fixtures.models) {
      for (const modelData of fixtures.models) {
        const model = modelRepository.create({
          ...modelData,
          userId: savedUser!.id
        });
        await modelRepository.save(model);
      }
    }

    console.log('Creating applications...');
    // Create applications from fixtures
    if (fixtures.applications) {
      for (const appData of fixtures.applications) {
        const application = applicationRepository.create({
          ...appData,
          userId: savedUser!.id
        });
        await applicationRepository.save(application);
      }
    }

    console.log('Creating features...');
    // Create features from fixtures
    if (fixtures.features) {
      console.log('Number of features in fixtures:', fixtures.features.length);
      for (const featureData of fixtures.features) {
        const feature = featureRepository.create({
          ...featureData,
          userId: savedUser!.id
        });
        await featureRepository.save(feature);
        console.log('Inserted feature:', JSON.stringify(feature, null, 2));
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
          const component = componentRepository.create({
            ...componentData,
            applicationId: defaultApp.id
          });
          await componentRepository.save(component);
        }
      }
    }

    console.log('Creating prompts...');
    // Create prompts from fixtures
    if (fixtures.prompts) {
      for (const promptData of fixtures.prompts) {
        const prompt = promptRepository.create({
          ...promptData,
          userId: savedUser!.id
        });
        await promptRepository.save(prompt);
      }
    }

    console.log('Creating bots...');
    // Create bots from fixtures
    if (fixtures.bots) {
      for (const botData of fixtures.bots) {
        const bot = botRepository.create({
          ...botData,
          userId: savedUser!.id
        });
        await botRepository.save(bot);
      }
    }

    console.log('Creating workflows...');
    // Create workflows from fixtures
    if (fixtures.workflows) {
      for (const workflowData of fixtures.workflows) {
        const workflow = workflowRepository.create(workflowData);
        await workflowRepository.save(workflow);
      }
    }

    console.log('Creating workflow actions...');
    // Create workflow actions from fixtures
    if (fixtures.workflowActions) {
      for (const actionData of fixtures.workflowActions) {
        const action = workflowActionRepository.create({
          ...actionData,
          workflowId: savedUser!.id // Use user ID as placeholder for now
        });
      await workflowActionRepository.save(action);
      }
    }

    console.log('Creating templates...');
    // Create templates from fixtures
    if (fixtures.templates) {
      for (const templateData of fixtures.templates) {
        const template = templateRepository.create(templateData);
        await templateRepository.save(template);
      }
    }

    console.log('Creating code templates...');
    // Create code templates from fixtures
    if (fixtures.codeTemplates) {
      for (const codeTemplateData of fixtures.codeTemplates) {
        const codeTemplate = codeTemplateRepository.create(codeTemplateData);
        await codeTemplateRepository.save(codeTemplate);
      }
    }

    console.log('Creating relationships...');
    // Create relationships from fixtures
    if (fixtures.relationships) {
      for (const relationshipData of fixtures.relationships) {
        const relationship = relationshipRepository.create({
          ...relationshipData,
          userId: savedUser!.id
        });
        await relationshipRepository.save(relationship);
      }
    }

    console.log('Creating user settings...');
    // Create user settings from fixtures
    if (fixtures.userSettings) {
      for (const settingsData of fixtures.userSettings) {
        const userSettings = userSettingsRepository.create({
          ...settingsData,
          user: savedUser
        });
        await userSettingsRepository.save(userSettings);
      }
    }

    console.log('Database seeded successfully with JSON fixtures');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

AppDataSource.initialize()
  .then(async () => {
    await seedDatabase();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
    process.exit(1);
  });
