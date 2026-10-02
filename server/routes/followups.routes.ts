import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/followups
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const filter = req.query.filter as 'today' | 'overdue' | 'upcoming' | 'all' | undefined;
  const followups = db.getFollowups(filter || 'all');
  return res.json({ followups });
});

// POST /api/followups
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { followupDate, notes } = req.body;
  if (!followupDate || !notes) {
    return res.status(400).json({ error: 'Follow-up Date and Notes are required.' });
  }

  const followup = db.createFollowup({
    ...req.body,
    createdBy: req.user!.name,
  });

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'CREATE',
    entityType: 'Followup',
    entityId: followup.id,
    entityName: followup.clientName || followup.leadName || 'Follow-up',
    details: `Scheduled ${followup.followupType} follow-up for ${followup.followupDate}`,
    ipAddress: req.ip,
  });

  return res.status(201).json({ followup });
});

// PUT /api/followups/:id
router.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateFollowup(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Follow-up not found.' });

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'UPDATE',
    entityType: 'Followup',
    entityId: updated.id,
    entityName: updated.clientName || updated.leadName || 'Follow-up',
    details: `Updated follow-up status to ${updated.status} (Outcome: ${updated.outcome || 'None'})`,
    ipAddress: req.ip,
  });

  return res.json({ followup: updated });
});

// DELETE /api/followups/:id
router.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteFollowup(req.params.id);
  return res.json({ success });
});

export default router;
