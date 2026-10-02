import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/clients
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const search = req.query.search as string | undefined;
  const clients = db.getClients(search);
  return res.json({ clients });
});

// GET /api/clients/:id
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const client = db.getClientById(req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found.' });
  return res.json({ client });
});

// GET /api/clients/:id/summary (Consolidated 360-degree client view)
router.get('/:id/summary', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const summary = db.getClientSummary(req.params.id);
  if (!summary) return res.status(404).json({ error: 'Client not found.' });
  return res.json(summary);
});

// POST /api/clients
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { companyName, contactPerson, email } = req.body;
  if (!companyName || !contactPerson || !email) {
    return res.status(400).json({ error: 'Company Name, Contact Person, and Email are required.' });
  }

  const client = db.createClient({
    ...req.body,
    createdBy: req.user!.name,
  });

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'CREATE',
    entityType: 'Client',
    entityId: client.id,
    entityName: client.companyName,
    details: `Added new client "${client.companyName}"`,
    ipAddress: req.ip,
  });

  return res.status(201).json({ client });
});

// PUT /api/clients/:id
router.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateClient(req.params.id, {
    ...req.body,
    updatedBy: req.user!.name,
  });

  if (!updated) return res.status(404).json({ error: 'Client not found.' });

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'UPDATE',
    entityType: 'Client',
    entityId: updated.id,
    entityName: updated.companyName,
    details: `Updated client "${updated.companyName}"`,
    ipAddress: req.ip,
  });

  return res.json({ client: updated });
});

// DELETE /api/clients/:id
router.delete('/:id', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const client = db.getClientById(req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found.' });

  const success = db.deleteClient(req.params.id);
  if (success) {
    db.logActivity({
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'DELETE',
      entityType: 'Client',
      entityId: client.id,
      entityName: client.companyName,
      details: `Deleted client "${client.companyName}"`,
      ipAddress: req.ip,
    });
  }
  return res.json({ success });
});

export default router;
