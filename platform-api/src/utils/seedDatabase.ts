import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';
import { Model } from '../entities/Model.js';
import { Workflow } from '../entities/Workflow.js';
import { WorkflowAction } from '../entities/WorkflowAction.js';
import { CodeTemplate } from '../entities/CodeTemplate.js';
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
            { name: 'email', type: 'string', required: true, label: 'Email Address' },
            { name: 'firstName', type: 'string', required: true, label: 'First Name' },
            { name: 'lastName', type: 'string', required: true, label: 'Last Name' },
            { name: 'role', type: 'string', required: true, label: 'Role', options: ['admin', 'user'] }
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
            { name: 'name', type: 'string', required: true, label: 'Model Name' },
            { name: 'displayName', type: 'string', required: true, label: 'Display Name' },
            { name: 'description', type: 'text', required: false, label: 'Description' },
            { name: 'schema', type: 'json', required: true, label: 'Schema Definition' },
            { name: 'isSystem', type: 'boolean', required: true, label: 'System Model', default: false }
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
            { name: 'name', type: 'string', required: true, label: 'Application Name' },
            { name: 'displayName', type: 'string', required: true, label: 'Display Name' },
            { name: 'description', type: 'text', required: false, label: 'Description' },
            { name: 'status', type: 'string', required: true, label: 'Status', options: ['draft', 'building', 'built', 'failed'] },
            { name: 'modelId', type: 'uuid', required: true, label: 'Model' }
          ]
        },
        isSystem: true,
        userId: defaultUser.id
      },
      {
        name: 'Property',
        displayName: 'Properties',
        schema: {
          fields: [
            { name: 'name', type: 'string', required: true, label: 'Property Name' },
            { name: 'displayName', type: 'string', required: true, label: 'Display Name' },
            { name: 'type', type: 'string', required: true, label: 'Data Type', options: ['string', 'number', 'boolean', 'date', 'email', 'url', 'text', 'json', 'uuid'] },
            { name: 'required', type: 'boolean', required: true, label: 'Required', default: false },
            { name: 'unique', type: 'boolean', required: true, label: 'Unique', default: false },
            { name: 'defaultValue', type: 'string', required: false, label: 'Default Value' },
            { name: 'validation', type: 'json', required: false, label: 'Validation Rules' },
            { name: 'options', type: 'json', required: false, label: 'Options (for select/enum)' },
            { name: 'description', type: 'text', required: false, label: 'Description' },
            { name: 'order', type: 'number', required: true, label: 'Display Order', default: 0 }
          ]
        },
        isSystem: true,
        userId: defaultUser.id
      },
      {
        name: 'Relationship',
        displayName: 'Relationships',
        schema: {
          fields: [
            { name: 'name', type: 'string', required: true, label: 'Relationship Name' },
            { name: 'displayName', type: 'string', required: true, label: 'Display Name' },
            { name: 'type', type: 'string', required: true, label: 'Relationship Type', options: ['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many'] },
            { name: 'sourceModelId', type: 'uuid', required: true, label: 'Source Model' },
            { name: 'targetModelId', type: 'uuid', required: true, label: 'Target Model' },
            { name: 'sourceField', type: 'string', required: true, label: 'Source Field' },
            { name: 'targetField', type: 'string', required: true, label: 'Target Field' },
            { name: 'cascade', type: 'boolean', required: true, label: 'Cascade Delete', default: false },
            { name: 'nullable', type: 'boolean', required: true, label: 'Nullable', default: true },
            { name: 'description', type: 'text', required: false, label: 'Description' }
          ]
        },
        isSystem: true,
        userId: defaultUser.id
      },
      {
        name: 'Component',
        displayName: 'Components',
        schema: {
          fields: [
            { name: 'name', type: 'string', required: true, label: 'Component Name' },
            { name: 'displayName', type: 'string', required: true, label: 'Display Name' },
            { name: 'type', type: 'string', required: true, label: 'Component Type', options: ['form', 'table', 'card', 'chart', 'custom'] },
            { name: 'config', type: 'json', required: true, label: 'Configuration' },
            { name: 'modelId', type: 'uuid', required: true, label: 'Associated Model' },
            { name: 'isActive', type: 'boolean', required: true, label: 'Active', default: true }
          ]
        },
        isSystem: true,
        userId: defaultUser.id
      },
      {
        name: 'Template',
        displayName: 'Templates',
        schema: {
          fields: [
            { name: 'name', type: 'string', required: true, label: 'Template Name' },
            { name: 'displayName', type: 'string', required: true, label: 'Display Name' },
            { name: 'type', type: 'string', required: true, label: 'Template Type', options: ['page', 'component', 'layout', 'email'] },
            { name: 'content', type: 'text', required: true, label: 'Template Content' },
            { name: 'variables', type: 'json', required: false, label: 'Template Variables' },
            { name: 'isSystem', type: 'boolean', required: true, label: 'System Template', default: false }
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
