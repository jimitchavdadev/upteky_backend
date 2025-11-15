import { Router } from 'express';
import { protect, admin, AuthRequest } from '../middleware/auth';
import { openDb } from '../db';
import { FeedbackForm } from '../types';

const router = Router();

// GET /api/forms (Admin)
router.get('/', protect, admin, async (req, res, next) => {
  try {
    const db = await openDb();
    const forms = await db.all('SELECT * FROM FeedbackForm ORDER BY createdAt DESC');
    res.json(forms.map(parseForm));
  } catch (err) {
    next(err);
  }
});

// POST /api/forms (Admin)
router.post('/', protect, admin, async (req: AuthRequest, res, next) => {
  try {
    const { title, description, fields, isActive } = req.body;
    const db = await openDb();

    const newForm: Omit<FeedbackForm, 'id' | 'createdAt'> = {
      title,
      description,
      fields,
      isActive,
      createdBy: req.user!.id,
    };

    const id = `form-${Date.now()}`;
    const createdAt = new Date().toISOString();
    
    await db.run(
      `INSERT INTO FeedbackForm (id, title, description, createdBy, createdAt, isActive, fields)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id,
      newForm.title,
      newForm.description,
      newForm.createdBy,
      createdAt,
      newForm.isActive,
      JSON.stringify(newForm.fields)
    );

    const createdForm = await db.get('SELECT * FROM FeedbackForm WHERE id = ?', id);
    res.status(201).json(parseForm(createdForm));
  } catch (err) {
    next(err);
  }
});

// GET /api/forms/:id (Public)
router.get('/:id', async (req, res, next) => {
  try {
    const db = await openDb();
    const form = await db.get('SELECT * FROM FeedbackForm WHERE id = ?', req.params.id);
    
    if (form) {
      res.json(parseForm(form));
    } else {
      res.status(404).json({ message: 'Form not found' });
    }
  } catch (err) {
    next(err);
  }
});

// PATCH /api/forms/:id (Admin)
router.patch('/:id', protect, admin, async (req, res, next) => {
  try {
    const { title, description, fields, isActive } = req.body;
    const db = await openDb();
    const form = await db.get('SELECT * FROM FeedbackForm WHERE id = ?', req.params.id);

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // Build query dynamically
    const updates: { [key: string]: any } = { ...form, ...req.body };
    if (fields) updates.fields = JSON.stringify(fields);

    await db.run(
      `UPDATE FeedbackForm SET
         title = ?, description = ?, isActive = ?, fields = ?
       WHERE id = ?`,
      updates.title,
      updates.description,
      updates.isActive,
      updates.fields,
      req.params.id
    );

    const updatedForm = await db.get('SELECT * FROM FeedbackForm WHERE id = ?', req.params.id);
    res.json(parseForm(updatedForm));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/forms/:id (Admin)
router.delete('/:id', protect, admin, async (req, res, next) => {
  try {
    const db = await openDb();
    const form = await db.get('SELECT * FROM FeedbackForm WHERE id = ?', req.params.id);

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // Note: You might want to delete related feedbacks as well, or handle it with FK constraints
    await db.run('DELETE FROM Feedback WHERE formId = ?', req.params.id);
    await db.run('DELETE FROM FeedbackForm WHERE id = ?', req.params.id);
    
    res.status(200).json({ message: 'Form deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// Helper to parse JSON fields
const parseForm = (form: any): FeedbackForm => {
  return {
    ...form,
    fields: JSON.parse(form.fields),
  };
};

export default router;
