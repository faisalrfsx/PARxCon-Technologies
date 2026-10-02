import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/renewals
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const renewals = db.getRenewals();
  return res.json({ renewals });
});

// POST /api/renewals
router.post('/', authenticate, requireRole('ADMIN', 'MANAGER'), (req: AuthenticatedRequest, res: Response) => {
  const { service, provider, renewalDate, cost } = req.body;
  if (!service || !provider || !renewalDate || cost === undefined) {
    return res.status(400).json({ error: 'Service, Provider, Renewal Date, and Cost are required.' });
  }

  const renewal = db.createRenewal(req.body);

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'CREATE',
    entityType: 'Renewal',
    entityId: renewal.id,
    entityName: renewal.service,
    details: `Added renewal tracking for ${renewal.service} (${renewal.provider}) due ${renewal.renewalDate}`,
    ipAddress: req.ip,
  });

  return res.status(201).json({ renewal });
});

// PUT /api/renewals/:id
router.put('/:id', authenticate, requireRole('ADMIN', 'MANAGER'), (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateRenewal(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Renewal not found.' });

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'UPDATE',
    entityType: 'Renewal',
    entityId: updated.id,
    entityName: updated.service,
    details: `Updated renewal for ${updated.service}`,
    ipAddress: req.ip,
  });

  return res.json({ renewal: updated });
});

// DELETE /api/renewals/:id
router.delete('/:id', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteRenewal(req.params.id);
  return res.json({ success });
});

export default router;
