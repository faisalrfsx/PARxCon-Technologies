import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/accounts
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const accounts = db.getAccounts();
  return res.json({ accounts });
});

// POST /api/accounts
router.post('/', authenticate, requireRole('ADMIN', 'MANAGER'), (req: AuthenticatedRequest, res: Response) => {
  const { serviceName, credentialReference } = req.body;
  if (!serviceName || !credentialReference) {
    return res.status(400).json({
      error: 'Service Name and Credential Reference (e.g. Bitwarden/1Password vault path) are required.',
    });
  }

  // Strictly sanitize & forbid plaintext password
  if (req.body.password) {
    delete req.body.password;
  }

  const account = db.createAccount({
    ...req.body,
    createdBy: req.user!.name,
  });

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'CREATE',
    entityType: 'Account',
    entityId: account.id,
    entityName: account.serviceName,
    details: `Added account registry reference: ${account.serviceName} (${account.credentialManager}: ${account.credentialReference})`,
    ipAddress: req.ip,
  });

  return res.status(201).json({ account });
});

// PUT /api/accounts/:id
router.put('/:id', authenticate, requireRole('ADMIN', 'MANAGER'), (req: AuthenticatedRequest, res: Response) => {
  if (req.body.password) {
    delete req.body.password;
  }

  const updated = db.updateAccount(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Account reference not found.' });

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'UPDATE',
    entityType: 'Account',
    entityId: updated.id,
    entityName: updated.serviceName,
    details: `Updated account reference for ${updated.serviceName}`,
    ipAddress: req.ip,
  });

  return res.json({ account: updated });
});

// DELETE /api/accounts/:id
router.delete('/:id', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const account = db.getAccounts().find((a) => a.id === req.params.id);
  if (!account) return res.status(404).json({ error: 'Account reference not found.' });

  const success = db.deleteAccount(req.params.id);
  if (success) {
    db.logActivity({
      userId: req.user!.id,
      userName: req.user!.name,
      action: 'DELETE',
      entityType: 'Account',
      entityId: account.id,
      entityName: account.serviceName,
      details: `Removed account reference ${account.serviceName}`,
      ipAddress: req.ip,
    });
  }
  return res.json({ success });
});

export default router;
