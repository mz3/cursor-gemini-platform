import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Model } from '../entities/Model';
import { Workflow } from '../entities/Workflow';
import { WorkflowAction } from '../entities/WorkflowAction';
import { CodeTemplate } from '../entities/CodeTemplate';
import bcrypt from 'bcryptjs';

export const seedDatabase = async (): Promise<void> => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const modelRepository = AppDataSource.getRepository(Model);
    const workflowRepository = AppDataSource.getRepository(Workflow);
    const workflowActionRepository = AppDataSource.getRepository(WorkflowAction);
    const codeTemplateRepository = AppDataSource.getRepository(CodeTemplate);

    // Check if data already exists
    const existingUser = await userRepository.findOne({ where: { email: 'admin@platform.com' } });
    if (existingUser) {
      console.log('Database already seeded, skipping...');
      return;
    }

    // Create default user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const defaultUser = userRepository.create({
      email: 'admin@platform.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });
    await userRepository.save(defaultUser);

    // Create system models
    const systemModels = [
      {
        name: 'User',
        displayName: 'Users',
        schema: {
          fields: [
            { name: 'email', type: 'string', required: true },
            { name: 'firstName', type: 'string', required: true },
            { name: 'lastName', type: 'string', required: true },
            { name: 'role', type: 'string', required: true }
          ]
        },
        isSystem: true,
        userId: defaultUser.id
      },
      {
        name: 'Model',
        displayName: 'Models',
        schema: {
          fields: [
            { name: 'name', type: 'string', required: true },
            { name: 'displayName', type: 'string', required: true },
            { name: 'schema', type: 'json', required: true }
          ]
        },
        isSystem: true,
        userId: defaultUser.id
      },
      {
        name: 'Application',
        displayName: 'Applications',
        schema: {
          fields: [
            { name: 'name', type: 'string', required: true },
            { name: 'displayName', type: 'string', required: true },
            { name: 'description', type: 'text', required: false },
            { name: 'status', type: 'string', required: true }
          ]
        },
        isSystem: true,
        userId: defaultUser.id
      }
    ];

    for (const modelData of systemModels) {
      const model = modelRepository.create(modelData);
      await modelRepository.save(model);
    }

    // Create default workflow
    const buildWorkflow = workflowRepository.create({
      name: 'build_application',
      displayName: 'Build Application',
      description: 'Build and deploy an application',
      config: { queue: 'app_builds' }
    });
    await workflowRepository.save(buildWorkflow);

    // Create workflow actions
    const actions = [
      {
        name: 'publish_event',
        type: 'publish_event',
        config: { queue: 'app_builds' },
        order: 0,
        workflowId: buildWorkflow.id
      }
    ];

    for (const actionData of actions) {
      const action = workflowActionRepository.create(actionData);
      await workflowActionRepository.save(action);
    }

    // Create code templates
    const templates = [
      {
        name: 'react_app_package_json',
        type: 'package.json',
        content: `{
  "name": "<%= appName %>",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}`,
        variables: ['appName'],
        isSystem: true
      }
    ];

    for (const templateData of templates) {
      const template = codeTemplateRepository.create(templateData);
      await codeTemplateRepository.save(template);
    }

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};
