import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/search?q=query
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const q = req.query.q as string || '';
  const results = db.globalSearch(q);
  return res.json(results);
});

export default router;
