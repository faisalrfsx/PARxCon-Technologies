import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { Role, User } from '../db/types.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'parxcon-ops-super-secure-jwt-secret-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  // 1. Check HTTP-only cookie
  if (req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  }

  // 2. Check Authorization Bearer header
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No session or token found.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = db.getUserById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User account is inactive or no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

// Role-based Access Control (RBAC)
export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (req.user.role === 'ADMIN') {
      // Admin always has full access
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
    }

    next();
  };
}
