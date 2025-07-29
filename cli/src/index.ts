#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { getConfig } from './config';
import { NotionClient } from './notion-client';
import { TaskCreateOptions } from './types';

const program = new Command();

program
  .name('notion')
  .description('CLI tool for managing Notion tasks')
  .version('1.0.0');

program
  .command('create')
  .description('Create a new task')
  .option('-t, --title <title>', 'Task title')
  .option('-s, --status <status>', 'Task status (Backlog, In Progress, Review, Done)')
  .option('-p, --priority <priority>', 'Task priority (Low, Medium, High)')
  .option('--tags <tags>', 'Comma-separated tags')
  .action(async (options) => {
    try {
      const config = getConfig();
      const client = new NotionClient(config.token, config.databaseId);

      let taskOptions: TaskCreateOptions;

      if (options.title) {
        // Use command line options
        taskOptions = {
          title: options.title,
          status: options.status as any,
          priority: options.priority as any,
          tags: options.tags ? options.tags.split(',').map((tag: string) => tag.trim()) : undefined
        };
      } else {
        // Interactive mode
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'title',
            message: 'Task title:',
            validate: (input: string) => input.trim() ? true : 'Title is required'
          },
          {
            type: 'list',
            name: 'status',
            message: 'Task status:',
            choices: ['Backlog', 'In Progress', 'Review', 'Done'],
            default: config.defaultStatus
          },
          {
            type: 'list',
            name: 'priority',
            message: 'Task priority:',
            choices: ['Low', 'Medium', 'High'],
            default: config.defaultPriority
          },
          {
            type: 'input',
            name: 'tags',
            message: 'Tags (comma-separated, optional):'
          }
        ]);

        taskOptions = {
          title: answers.title,
          status: answers.status,
          priority: answers.priority,
          tags: answers.tags ? answers.tags.split(',').map((tag: string) => tag.trim()) : undefined
        };
      }

      console.log(chalk.blue('Creating task...'));
      const task = await client.createTask(taskOptions);

      console.log(chalk.green('✅ Task created successfully!'));
      console.log(chalk.cyan(`📝 Title: ${task.title}`));
      console.log(chalk.cyan(`🏷️  Status: ${task.status}`));
      console.log(chalk.cyan(`⚡ Priority: ${task.priority}`));
      if (task.tags.length > 0) {
        console.log(chalk.cyan(`🏷️  Tags: ${task.tags.join(', ')}`));
      }
      console.log(chalk.cyan(`🆔 ID: ${task.id}`));

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all tasks')
  .action(async () => {
    try {
      const config = getConfig();
      const client = new NotionClient(config.token, config.databaseId);

      console.log(chalk.blue('Fetching tasks...'));
      const tasks = await client.listTasks();

      console.log(chalk.green(`✅ Found ${tasks.length} tasks:`));
      console.log('');

      // Group tasks by status
      const groupedTasks = tasks.reduce((acc: any, task) => {
        const status = task.status;
        if (!acc[status]) {
          acc[status] = [];
        }
        acc[status].push(task);
        return acc;
      }, {});

      Object.keys(groupedTasks).forEach(status => {
        console.log(chalk.yellow(`📋 ${status}:`));
        groupedTasks[status].forEach((task: any) => {
          const sprintInfo = task.sprint && task.sprint !== 'No Sprint' ? ` [${task.sprint}]` : '';
          const priorityInfo = task.priority && task.priority !== 'No Priority' ? ` (${task.priority})` : '';
          console.log(chalk.cyan(`  • ${task.title}${sprintInfo}${priorityInfo} [ID: ${task.id}]`));
        });
        console.log('');
      });

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('info')
  .description('Show database information')
  .action(async () => {
    try {
      const config = getConfig();
      const client = new NotionClient(config.token, config.databaseId);

      console.log(chalk.blue('Fetching database information...'));
      const database = await client.getDatabase();

      console.log(chalk.green('✅ Database Information:'));
      console.log(chalk.cyan(`📋 Title: ${database.title[0]?.plain_text || 'Untitled'}`));
      console.log(chalk.cyan(`🆔 ID: ${database.id}`));
      console.log(chalk.cyan(`📅 Created: ${new Date(database.created_time).toLocaleString()}`));
      console.log(chalk.cyan(`✏️  Last Edited: ${new Date(database.last_edited_time).toLocaleString()}`));

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('properties')
  .description('Show database properties')
  .action(async () => {
    try {
      const config = getConfig();
      const client = new NotionClient(config.token, config.databaseId);

      console.log(chalk.blue('Fetching database properties...'));
      const properties = await client.getDatabaseProperties();

      console.log(chalk.green('✅ Database Properties:'));
      Object.keys(properties).forEach(propertyName => {
        const property = properties[propertyName];
        console.log(chalk.cyan(`📋 ${propertyName}: ${property.type}`));
        if (property.type === 'select' && property.select?.options) {
          console.log(chalk.yellow(`   Options: ${property.select.options.map((opt: any) => opt.name).join(', ')}`));
        }
      });

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('update')
  .description('Update an existing task')
  .option('-i, --id <id>', 'Task ID (required)')
  .option('-t, --title <title>', 'New task title')
  .option('-s, --status <status>', 'New task status (Backlog, In Progress, Review, Done)')
  .option('-p, --priority <priority>', 'New task priority (Low, Medium, High)')
  .option('--tags <tags>', 'New comma-separated tags')
  .action(async (options) => {
    try {
      if (!options.id) {
        console.error(chalk.red('❌ Error: Task ID is required. Use -i or --id to specify the task ID.'));
        process.exit(1);
      }

      const config = getConfig();
      const client = new NotionClient(config.token, config.databaseId);

      const updateOptions: Partial<TaskCreateOptions> = {};

      if (options.title) updateOptions.title = options.title;
      if (options.status) updateOptions.status = options.status as any;
      if (options.priority) updateOptions.priority = options.priority as any;
      if (options.tags) updateOptions.tags = options.tags.split(',').map((tag: string) => tag.trim());

      console.log(chalk.blue('Updating task...'));
      const task = await client.updateTask(options.id, updateOptions);

      console.log(chalk.green('✅ Task updated successfully!'));
      console.log(chalk.cyan(`📝 Title: ${task.title}`));
      console.log(chalk.cyan(`🏷️  Status: ${task.status}`));
      console.log(chalk.cyan(`⚡ Priority: ${task.priority}`));
      if (task.tags.length > 0) {
        console.log(chalk.cyan(`🏷️  Tags: ${task.tags.join(', ')}`));
      }
      console.log(chalk.cyan(`🆔 ID: ${task.id}`));

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program.parse();
