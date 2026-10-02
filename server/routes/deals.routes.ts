import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/deals
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const stage = req.query.stage as string | undefined;
  const deals = db.getDeals(stage);
  return res.json({ deals });
});

// GET /api/deals/pipeline
router.get('/pipeline', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const pipeline = db.getPipeline();
  return res.json(pipeline);
});

// GET /api/deals/:id
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const deal = db.getDealById(req.params.id);
  if (!deal) return res.status(404).json({ error: 'Deal not found.' });
  return res.json({ deal });
});

// POST /api/deals
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { dealName, service, dealValue, clientId } = req.body;
  if (!dealName || !service || dealValue === undefined || !clientId) {
    return res.status(400).json({ error: 'Deal Name, Service, Deal Value, and Client are required.' });
  }

  const deal = db.createDeal({
    ...req.body,
    createdBy: req.user!.name,
  });

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'CREATE',
    entityType: 'Deal',
    entityId: deal.id,
    entityName: deal.dealName,
    details: `Created deal "${deal.dealName}" for ${deal.clientName} (₹${deal.dealValue.toLocaleString()})`,
    ipAddress: req.ip,
  });

  return res.status(201).json({ deal });
});

// PUT /api/deals/:id
router.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const current = db.getDealById(req.params.id);
  if (!current) return res.status(404).json({ error: 'Deal not found.' });

  const updated = db.updateDeal(req.params.id, {
    ...req.body,
    updatedBy: req.user!.name,
  });

  let detailMsg = `Updated deal "${updated!.dealName}"`;
  if (req.body.dealValue && req.body.dealValue !== current.dealValue) {
    detailMsg = `Updated deal value for ${updated!.dealName}: ₹${current.dealValue.toLocaleString()} → ₹${Number(req.body.dealValue).toLocaleString()}`;
  } else if (req.body.stage && req.body.stage !== current.stage) {
    detailMsg = `Changed deal stage for ${updated!.dealName}: ${current.stage} → ${req.body.stage}`;
  }

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'UPDATE',
    entityType: 'Deal',
    entityId: updated!.id,
    entityName: updated!.dealName,
    details: detailMsg,
    ipAddress: req.ip,
  });

  return res.json({ deal: updated });
});

// DELETE /api/deals/:id
router.delete('/:id', authenticate, requireRole('ADMIN', 'MANAGER'), (req: AuthenticatedRequest, res: Response) => {
  const deal = db.getDealById(req.params.id);
  if (!deal) return res.status(404).json({ error: 'Deal not found.' });

  const success = db.deleteDeal(req.params.id);
  if (success) {
    db.logActivity({
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'DELETE',
      entityType: 'Deal',
      entityId: deal.id,
      entityName: deal.dealName,
      details: `Deleted deal "${deal.dealName}"`,
      ipAddress: req.ip,
    });
  }
  return res.json({ success });
});

export default router;
