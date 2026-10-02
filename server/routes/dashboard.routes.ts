import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/dashboard
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const summary = db.getDashboardSummary();
  return res.json(summary);
});

export default router;
