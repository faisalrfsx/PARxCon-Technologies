import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { authenticate, generateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.getUserByEmail(email);
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = generateToken(user);

  // Set HTTP-only secure cookie
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  db.logActivity({
    userId: user.id,
    userName: user.name,
    action: 'AUTH',
    entityType: 'User',
    entityId: user.id,
    entityName: user.email,
    details: `User ${user.email} (${user.role}) logged in successfully`,
    ipAddress: req.ip,
  });

  const { passwordHash, ...safeUser } = user;
  return res.json({
    user: safeUser,
    token,
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res: Response) => {
  res.clearCookie('auth_token');
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { passwordHash, ...safeUser } = req.user!;
  return res.json({ user: safeUser });
});

// GET /api/auth/users (for assigning tasks/leads)
router.get('/users', authenticate, (req, res: Response) => {
  const users = db.getUsers();
  return res.json({ users });
});

export default router;
