import { Router } from 'express';
import { protect, admin } from '../middleware/auth';
import { openDb } from '../db';
import { Feedback } from '../types';

const router = Router();

// GET /api/feedbacks (Admin)
// Supports filtering: ?formId=... & ?rating=... & ?search=...
router.get('/', protect, admin, async (req, res, next) => {
  try {
    const db = await openDb();
    const { formId, rating, search } = req.query;

    let query = 'SELECT * FROM Feedback';
    const params: any[] = [];
    const conditions: string[] = [];

    if (formId && formId !== 'all') {
      conditions.push('formId = ?');
      params.push(formId);
    }
    if (rating) {
      conditions.push('rating = ?');
      params.push(Number(rating));
    }
    if (search) {
      const searchLike = `%${search}%`;
      conditions.push('(name LIKE ? OR email LIKE ? OR message LIKE ?)');
      params.push(searchLike, searchLike, searchLike);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY createdAt DESC';

    const feedbacks = await db.all(query, params);
    res.json(feedbacks.map(parseFeedback));
  } catch (err) {
    next(err);
  }
});

// POST /api/feedbacks (Public)
router.post('/', async (req, res, next) => {
  try {
    const { formId, name, email, message, rating, responses } = req.body;
    const db = await openDb();

    // Check if form exists and is active
    const form = await db.get(
      'SELECT isActive FROM FeedbackForm WHERE id = ?',
      formId
    );
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    if (!form.isActive) {
      return res.status(400).json({ message: 'This form is no longer accepting responses' });
    }

    const newFeedback: Omit<Feedback, 'id' | 'createdAt'> = {
      formId,
      name,
      email,
      message,
      rating,
      responses,
    };

    const id = `feedback-${Date.now()}`;
    const createdAt = new Date().toISOString();

    await db.run(
      `INSERT INTO Feedback (id, formId, name, email, message, rating, createdAt, responses)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      newFeedback.formId,
      newFeedback.name,
      newFeedback.email,
      newFeedback.message,
      newFeedback.rating,
      createdAt,
      JSON.stringify(newFeedback.responses)
    );

    const createdFeedback = await db.get('SELECT * FROM Feedback WHERE id = ?', id);
    res.status(201).json(parseFeedback(createdFeedback));
  } catch (err) {
    next(err);
  }
});

// Helper to parse JSON fields
const parseFeedback = (feedback: any): Feedback => {
  return {
    ...feedback,
    responses: JSON.parse(feedback.responses),
  };
};

export default router;
