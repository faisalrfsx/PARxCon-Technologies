import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/settings
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const settings = db.getSettings();
  return res.json({ settings });
});

// POST /api/settings
router.post('/', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateSettings(req.body);

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'UPDATE',
    entityType: 'System',
    details: `Updated system operational settings`,
    ipAddress: req.ip,
  });

  return res.json({ settings: updated });
});

// GET /api/settings/logs (Audit Log)
router.get('/logs', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const logs = db.getActivityLogs(limit);
  return res.json({ logs });
});

// GET /api/settings/notifications
router.get('/notifications', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const notifications = db.getNotifications();
  return res.json({ notifications });
});

// POST /api/settings/notifications/:id/read
router.post('/notifications/:id/read', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const success = db.markNotificationRead(req.params.id);
  return res.json({ success });
});

// POST /api/settings/notifications/read-all
router.post('/notifications/read-all', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const success = db.markAllNotificationsRead();
  return res.json({ success });
});

export default router;
