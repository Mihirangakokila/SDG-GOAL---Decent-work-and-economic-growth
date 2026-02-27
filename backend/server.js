import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import trainingRoutes from './routes/trainingRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Youth Internship Support System API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/trainings', trainingRoutes);
app.use('/api/enrollments', enrollmentRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bridgerural_training';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

