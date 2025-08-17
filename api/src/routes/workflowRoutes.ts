import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database.js';
import { Workflow } from '../entities/Workflow.js';
import { WorkflowAction } from '../entities/WorkflowAction.js';

const router = Router();
const workflowRepository = AppDataSource.getRepository(Workflow);
const workflowActionRepository = AppDataSource.getRepository(WorkflowAction);

// GET /api/workflows - Get all workflows
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workflows = await workflowRepository.find({
      relations: ['actions'],
      order: { createdAt: 'DESC' }
    });
    return res.json(workflows);
  } catch (error) {
    return next(error);
  }
});

// GET /api/workflows/:id - Get workflow by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workflow = await workflowRepository.findOne({
      where: { id: req.params.id },
      relations: ['actions']
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    return res.json(workflow);
  } catch (error) {
    return next(error);
  }
});

// POST /api/workflows - Create new workflow
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, displayName, description, config, actions } = req.body;

    if (!name || !displayName) {
      return res.status(400).json({ error: 'Name and displayName are required' });
    }

    const workflow = workflowRepository.create({
      name,
      displayName,
      description: description || '',
      config: config || {},
      isActive: true
    });

    const savedWorkflow = await workflowRepository.save(workflow);

    // Create workflow actions if provided
    if (actions && Array.isArray(actions)) {
      for (const actionData of actions) {
        const action = workflowActionRepository.create({
          ...actionData,
          workflowId: savedWorkflow.id
        });
        await workflowActionRepository.save(action);
      }
    }

    const workflowWithActions = await workflowRepository.findOne({
      where: { id: savedWorkflow.id },
      relations: ['actions']
    });

    return res.status(201).json(workflowWithActions);
  } catch (error) {
    return next(error);
  }
});

// PUT /api/workflows/:id - Update workflow
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workflow = await workflowRepository.findOne({
      where: { id: req.params.id, isActive: true }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const { name, displayName, description, config } = req.body;

    if (name) workflow.name = name;
    if (displayName) workflow.displayName = displayName;
    if (description !== undefined) workflow.description = description;
    if (config) workflow.config = config;

    const updatedWorkflow = await workflowRepository.save(workflow);
    return res.json(updatedWorkflow);
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/workflows/:id - Partially update workflow (e.g., toggle active status)
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workflow = await workflowRepository.findOne({
      where: { id: req.params.id }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const { isActive, ...otherUpdates } = req.body;

    // Update only provided fields
    Object.keys(otherUpdates).forEach(key => {
      if (workflow.hasOwnProperty(key)) {
        (workflow as any)[key] = otherUpdates[key];
      }
    });

    if (isActive !== undefined) {
      workflow.isActive = isActive;
    }

    const updatedWorkflow = await workflowRepository.save(workflow);
    return res.json(updatedWorkflow);
  } catch (error) {
    return next(error);
  }
});

// POST /api/workflows/:id/execute - Execute workflow
router.post('/:id/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workflow = await workflowRepository.findOne({
      where: { id: req.params.id, isActive: true },
      relations: ['actions']
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found or inactive' });
    }

    // Enhanced workflow execution logic
    console.log(`🚀 Executing workflow: ${workflow.name}`);
    console.log('📋 Workflow config:', JSON.stringify(workflow.config, null, 2));
    console.log('⚡ Workflow actions:', workflow.actions);

    // Validate workflow configuration
    const triggers = workflow.config.triggers || [];
    const actions = workflow.config.actions || [];
    const settings = workflow.config.settings || {};

    if (triggers.length === 0) {
      return res.status(400).json({ error: 'Workflow must have at least one trigger' });
    }

    console.log(`🎯 Found ${triggers.length} triggers and ${actions.length} actions`);
    console.log(`⚙️ Settings: timeout=${settings.timeout}ms, retries=${settings.retries}, parallel=${settings.parallel}`);

    // TODO: Implement actual execution engine
    // This would include:
    // 1. Process triggers (webhook, schedule, manual, chatbot)
    // 2. Execute actions in sequence or parallel
    // 3. Handle bot interactions with proper data flow
    // 4. Make webhook calls with configured parameters
    // 5. Apply conditional logic and routing
    // 6. Handle delays and error conditions

    // Simulate execution
    const executionId = `exec_${Date.now()}`;
    const executionResult = {
      id: executionId,
      workflowId: workflow.id,
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      results: {
        nodesExecuted: workflow.config.nodes?.length || 0,
        success: true,
        message: 'Workflow executed successfully (simulated)'
      }
    };

    return res.json(executionResult);
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/workflows/:id - Delete workflow
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workflow = await workflowRepository.findOne({
      where: { id: req.params.id }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    workflow.isActive = false;
    await workflowRepository.save(workflow);

    return res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    return next(error);
  }
});

export { router as workflowRoutes };
