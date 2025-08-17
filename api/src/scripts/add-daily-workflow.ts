#!/usr/bin/env node

import 'reflect-metadata';
import dotenv from 'dotenv';
import { initializeDatabase } from '../config/database.js';
import { Workflow } from '../entities/Workflow.js';
import { WorkflowAction } from '../entities/WorkflowAction.js';
import { AppDataSource } from '../config/database.js';

// Load environment variables
dotenv.config();

async function addDailyWorkflow() {
  try {
    console.log('🔌 Initializing database connection...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    const workflowRepository = AppDataSource.getRepository(Workflow);
    const workflowActionRepository = AppDataSource.getRepository(WorkflowAction);

    // Check if workflow already exists
    const existingWorkflow = await workflowRepository.findOne({
      where: { name: 'daily_github_report' }
    });

    if (existingWorkflow) {
      console.log('✅ Daily GitHub report workflow already exists');
      console.log(`Workflow ID: ${existingWorkflow.id}`);
      return;
    }

    // Create the workflow
    const workflow = workflowRepository.create({
      name: 'daily_github_report',
      displayName: 'Daily GitHub Issue Report',
      description: 'Creates a daily GitHub issue report every day at 9am EST using the CI/CD GitHub bot',
      config: {
        queue: 'github_reports',
        steps: ['schedule', 'collect_data', 'generate_report', 'create_issue'],
        schedule: {
          cron: '0 14 * * *',
          timezone: 'America/New_York',
          description: 'Daily at 9:00 AM EST'
        },
        bot: 'cicd-github-manager'
      },
      isActive: true
    });

    const savedWorkflow = await workflowRepository.save(workflow);
    console.log(`✅ Created workflow: ${savedWorkflow.id}`);

    // Create workflow actions
    const actions = [
      {
        name: 'schedule_daily_report',
        type: 'scheduler',
        config: {
          cron: '0 14 * * *',
          timezone: 'America/New_York',
          trigger: 'daily_github_report'
        },
        order: 0
      },
      {
        name: 'collect_github_data',
        type: 'github_data_collection',
        config: {
          bot: 'cicd-github-manager',
          data_sources: ['issues', 'pull_requests', 'workflows', 'deployments'],
          timeframe: 'last_24_hours'
        },
        order: 1
      },
      {
        name: 'generate_daily_report',
        type: 'report_generation',
        config: {
          format: 'markdown',
          template: 'daily_github_summary',
          include_metrics: ['new_issues', 'closed_issues', 'active_prs', 'failed_workflows', 'deployments']
        },
        order: 2
      },
      {
        name: 'create_github_issue',
        type: 'github_issue_creation',
        config: {
          bot: 'cicd-github-manager',
          repository: 'cursor-gemini-platform',
          title_template: 'Daily Report - {date}',
          labels: ['automated', 'daily-report'],
          assignees: ['system']
        },
        order: 3
      }
    ];

    for (const actionData of actions) {
      const action = workflowActionRepository.create({
        ...actionData,
        workflowId: savedWorkflow.id,
        isActive: true
      });
      await workflowActionRepository.save(action);
      console.log(`✅ Created action: ${actionData.name}`);
    }

    console.log('🎉 Daily GitHub report workflow created successfully!');
    console.log(`Workflow ID: ${savedWorkflow.id}`);
    console.log('Localhost URLs:');
    console.log(`- View workflow: http://localhost:3000/workflows/${savedWorkflow.id}`);
    console.log(`- API endpoint: http://localhost:3000/api/workflows/${savedWorkflow.id}`);
    console.log(`- Execute workflow: http://localhost:3000/api/workflows/${savedWorkflow.id}/execute`);

    process.exit(0);
  } catch (error) {
    console.error('💥 Failed to add daily workflow:', error);
    process.exit(1);
  }
}

addDailyWorkflow();
