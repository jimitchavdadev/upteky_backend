import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { openDb } from './db';

import authRoutes from './routes/auth';
import formRoutes from './routes/forms';
import feedbackRoutes from './routes/feedbacks';
import analyticsRoutes from './routes/analytics';
// This was the broken line. It's now fixed.
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'Feedback API is running' });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await openDb();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();