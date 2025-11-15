import { Router } from 'express';
import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { openDb } from '../db';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const db = await openDb();
    const user = await db.get('SELECT * FROM User WHERE email = ?', email);

    if (user && (await compare(password, user.passwordHash))) {
      const token = jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req: AuthRequest, res, next) => {
  try {
    // req.user is populated by the 'protect' middleware
    res.json(req.user);
  } catch (err) {
    next(err);
  }
});

export default router;
