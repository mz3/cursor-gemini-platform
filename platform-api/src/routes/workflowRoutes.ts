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
      where: { isActive: true },
      relations: ['actions'],
      order: { createdAt: 'ASC' }
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
      where: { id: req.params.id, isActive: true },
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

// DELETE /api/workflows/:id - Delete workflow
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workflow = await workflowRepository.findOne({
      where: { id: req.params.id, isActive: true }
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
