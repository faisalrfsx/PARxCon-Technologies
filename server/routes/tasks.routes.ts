import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/tasks
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const status = req.query.status as string | undefined;
  const assigned = req.user?.role === 'EMPLOYEE' ? req.user.id : undefined;
  const tasks = db.getTasks(status, assigned);
  return res.json({ tasks });
});

// POST /api/tasks
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Task title is required.' });
  }

  const task = db.createTask({
    ...req.body,
    createdBy: req.user!.name,
  });

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'CREATE',
    entityType: 'Task',
    entityId: task.id,
    entityName: task.title,
    details: `Created task "${task.title}" (Priority: ${task.priority})`,
    ipAddress: req.ip,
  });

  return res.status(201).json({ task });
});

// PUT /api/tasks/:id
router.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateTask(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Task not found.' });

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'UPDATE',
    entityType: 'Task',
    entityId: updated.id,
    entityName: updated.title,
    details: `Updated task "${updated.title}" status to ${updated.status}`,
    ipAddress: req.ip,
  });

  return res.json({ task: updated });
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteTask(req.params.id);
  return res.json({ success });
});

export default router;
