import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { openDb } from '../db';
import { User } from '../types';

export interface AuthRequest extends Request {
  user?: User;
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in .env');
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

      const db = await openDb();
      const user = await db.get(
        'SELECT id, name, email, role FROM User WHERE id = ?',
        decoded.id
      );

      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};
