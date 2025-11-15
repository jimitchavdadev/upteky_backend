import { Router } from 'express';
import { protect, admin } from '../middleware/auth';
import { openDb } from '../db';
import { AnalyticsData } from '../types';

const router = Router();

// GET /api/analytics (Admin)
// Supports filtering: ?formId=...
router.get('/', protect, admin, async (req, res, next) => {
  try {
    const db = await openDb();
    const { formId } = req.query;

    let whereClause = '';
    const params: any[] = [];

    if (formId && formId !== 'all') {
      whereClause = 'WHERE formId = ?';
      params.push(formId);
    }

    const stats = await db.get(
      `SELECT
         COUNT(*) as totalFeedbacks,
         AVG(rating) as averageRating,
         SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as positiveCount,
         SUM(CASE WHEN rating < 3 THEN 1 ELSE 0 END) as negativeCount,
         SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as neutralCount
       FROM Feedback
       ${whereClause}`,
      params
    );

    const analytics: AnalyticsData = {
      totalFeedbacks: stats.totalFeedbacks || 0,
      averageRating: Math.round((stats.averageRating || 0) * 10) / 10,
      positiveCount: stats.positiveCount || 0,
      negativeCount: stats.negativeCount || 0,
      neutralCount: stats.neutralCount || 0,
    };

    res.json(analytics);
  } catch (err) {
    next(err);
  }
});

export default router;
