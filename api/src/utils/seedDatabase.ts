import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';
import { Schema } from '../entities/Schema.js';
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
import { Role } from '../entities/Role.js';
import { Permission, PermissionResource } from '../entities/Permission.js';
import { FeatureFlag } from '../entities/FeatureFlag.js';
import { Secret } from '../entities/Secret.js';
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
    const schemaRepository = AppDataSource.getRepository(Schema);
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
    const roleRepository = AppDataSource.getRepository(Role);
    const permissionRepository = AppDataSource.getRepository(Permission);
    const featureFlagRepository = AppDataSource.getRepository(FeatureFlag);
    const secretRepository = AppDataSource.getRepository(Secret);

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.error('Seeding process timed out after 30 seconds');
      process.exit(1);
    }, 30000);

    // Check if data already exists - check all tables
    const existingUsers = await userRepository.find();
    const existingFeatures = await featureRepository.find();
    const existingApplications = await applicationRepository.find();
    const existingSchemas = await schemaRepository.find();
    const existingPrompts = await promptRepository.find();
    const existingBots = await botRepository.find();
    const existingWorkflows = await workflowRepository.find();

    if (existingUsers.length > 0 || existingFeatures.length > 0 || existingApplications.length > 0 ||
        existingSchemas.length > 0 || existingPrompts.length > 0 || existingBots.length > 0 || existingWorkflows.length > 0) {
      console.log('Database already seeded with data, skipping...');
      clearTimeout(timeout);
      return;
    }

    console.log('Creating roles and permissions...');

    // Create roles first
    if (fixtures.roles) {
      for (const roleData of fixtures.roles) {
        const existingRole = await roleRepository.findOne({ where: { name: roleData.name } });
        if (!existingRole) {
          const role = roleRepository.create(roleData);
          await roleRepository.save(role);
          console.log(`✅ Created role: ${roleData.name}`);
        }
      }
    }

    // Create permissions
    if (fixtures.permissions) {
      for (const permissionData of fixtures.permissions) {
        const existingPermission = await permissionRepository.findOne({ where: { name: permissionData.name } });
        if (!existingPermission) {
          const permission = permissionRepository.create(permissionData);
          await permissionRepository.save(permission);
          console.log(`✅ Created permission: ${permissionData.name}`);
        }
      }
    }

    // Assign permissions to roles
    console.log('Assigning permissions to roles...');

    // Admin gets all permissions
    const adminRole = await roleRepository.findOne({
      where: { name: 'admin' },
      relations: ['permissions']
    });
    if (adminRole) {
      const allPermissions = await permissionRepository.find();
      adminRole.permissions = allPermissions;
      await roleRepository.save(adminRole);
      console.log(`✅ Assigned ${allPermissions.length} permissions to admin role`);
    }

    // User gets basic permissions
    const userRole = await roleRepository.findOne({
      where: { name: 'user' },
      relations: ['permissions']
    });
    if (userRole) {
      const basicPermissions = await permissionRepository.find({
        where: [
          { name: 'schema:read' },
          { name: 'schema:create' },
          { name: 'schema:update' },
          { name: 'entity:read' },
          { name: 'entity:create' },
          { name: 'entity:update' },
          { name: 'application:read' },
          { name: 'application:create' },
          { name: 'application:update' },
          { name: 'bot:read' },
          { name: 'bot:create' },
          { name: 'bot:execute' },
          { name: 'feature:read' },
          { name: 'workflow:read' },
          { name: 'workflow:create' },
          { name: 'workflow:execute' },
          { name: 'prompt:read' },
          { name: 'prompt:create' },
          { name: 'template:read' }
        ]
      });
      userRole.permissions = basicPermissions;
      await roleRepository.save(userRole);
      console.log(`✅ Assigned ${basicPermissions.length} permissions to user role`);
    }

    // System gets system permissions
    const systemRole = await roleRepository.findOne({
      where: { name: 'system' },
      relations: ['permissions']
    });
    if (systemRole) {
      const systemPermissions = await permissionRepository.find({
        where: [
          { resource: PermissionResource.SYSTEM },
          { resource: PermissionResource.BOT },
          { resource: PermissionResource.WORKFLOW }
        ]
      });
      systemRole.permissions = systemPermissions;
      await roleRepository.save(systemRole);
      console.log(`✅ Assigned ${systemPermissions.length} permissions to system role`);
    }

    // Create feature flags
    console.log('Creating feature flags...');
    if (fixtures.featureFlags) {
      for (const flagData of fixtures.featureFlags) {
        const existingFlag = await featureFlagRepository.findOne({ where: { key: flagData.key } });
        if (!existingFlag) {
          const flag = featureFlagRepository.create(flagData);
          await featureFlagRepository.save(flag);
          console.log(`✅ Created feature flag: ${flagData.key}`);
        }
      }
    }

    // Assign role-based feature flags
    console.log('Assigning role-based feature flags...');
    const adminDashboardFlag = await featureFlagRepository.findOne({
      where: { key: 'admin_dashboard' },
      relations: ['roles']
    });
    if (adminDashboardFlag && adminRole) {
      adminDashboardFlag.roles = [adminRole];
      await featureFlagRepository.save(adminDashboardFlag);
      console.log('✅ Assigned admin_dashboard flag to admin role');
    }

    const seedFlag = await featureFlagRepository.findOne({
      where: { key: 'admin_database_seed' },
      relations: ['roles']
    });
    if (seedFlag && adminRole) {
      seedFlag.roles = [adminRole];
      await featureFlagRepository.save(seedFlag);
      console.log('✅ Assigned admin_database_seed flag to admin role');
    }

    console.log('Creating users...');
    // Create users from fixtures and assign roles
    const createdUsers: User[] = [];
    if (fixtures.users) {
      for (const userData of fixtures.users) {
        const existingUser = await userRepository.findOne({ where: { email: userData.email } });
        if (!existingUser) {
          const hashedPassword = await bcrypt.hash('admin123', 10);
          const role = await roleRepository.findOne({ where: { name: userData.role } });

          const user = userRepository.create({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            password: hashedPassword,
            isActive: userData.isActive,
            roleId: role?.id,
            legacyRole: userData.role
          });

          const savedUser = await userRepository.save(user);
          createdUsers.push(savedUser);
          console.log(`✅ Created user: ${userData.email} with role: ${userData.role}`);
        }
      }
    }

    console.log('Using created user for seeding...');
    // Use first created user or fallback
    let savedUser = createdUsers[0];

        if (!savedUser) {
      // Fallback to existing user if none were created
      const foundUser = await userRepository.findOne({
        where: { email: 'michael@tunnel.ninja' },
        relations: ['role']
      });
      savedUser = foundUser || undefined;
    }

    if (!savedUser) {
      throw new Error('Failed to find user for seeding');
    }

    console.log('Creating system schemas...');
    // Create system schemas from fixtures
    if (fixtures.schemas) {
      for (const schemaData of fixtures.schemas) {
        try {
          const schema = schemaRepository.create({
            ...schemaData,
            userId: savedUser!.id
          });
          await schemaRepository.save(schema);
        } catch (error) {
          console.error('Error creating schema:', error);
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
      // Find the system user for system bots
      const systemUser = await userRepository.findOne({
        where: { email: 'system@platform.com' }
      });

      for (const botData of fixtures.bots) {
        try {
          // Handle system bots - use system user ID if userId is "system"
          const botUserId = botData.userId === 'system' && systemUser
            ? systemUser.id
            : savedUser!.id;

          const bot = botRepository.create({
            ...botData,
            userId: botUserId
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
      { botName: 'schema-assistant', promptName: 'schema-creation' },
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

    console.log('Creating secrets...');
    // Create secrets from fixtures
    if (fixtures.secrets) {
      for (const secretData of fixtures.secrets) {
        try {
          // Create secret with encrypted dummy values
          const secret = secretRepository.create({
            id: secretData.id,
            name: secretData.name,
            description: secretData.description,
            key: secretData.key,
            type: secretData.type,
            provider: secretData.provider,
            isActive: secretData.isActive,
            userId: secretData.userId,
            createdAt: new Date(secretData.createdAt),
            updatedAt: new Date(secretData.updatedAt)
          });

          // Set the encrypted value using the entity method
          secret.setEncryptedValue('dummy_secret_value_for_development');

          await secretRepository.save(secret);
          console.log(`✅ Created secret: ${secretData.name}`);
        } catch (error) {
          console.error('Error creating secret:', error);
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
