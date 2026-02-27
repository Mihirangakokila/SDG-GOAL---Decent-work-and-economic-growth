import express from 'express';
import {
  createTraining,
  getActiveTrainings,
  getAllTrainings,
  getTrainingById,
  softDeleteTraining,
  updateTraining,
  getRecommendations,
} from '../controllers/trainingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Admin / Organization only
router.post(
  '/',
  protect,
  authorizeRoles('admin', 'organization'),
  createTraining
);

// Youth: view active trainings with filters
router.get('/', protect, getActiveTrainings);

// Admin / Organization: view all trainings
router.get(
  '/all',
  protect,
  authorizeRoles('admin', 'organization'),
  getAllTrainings
);

// Recommendations based on youth skills
router.get(
  '/recommendations',
  protect,
  authorizeRoles('youth'),
  getRecommendations
);

// Get single training details
router.get('/:id', protect, getTrainingById);

// Update training
router.put(
  '/:id',
  protect,
  authorizeRoles('admin', 'organization'),
  updateTraining
);

// Soft delete training (set status = Inactive)
router.delete(
  '/:id',
  protect,
  authorizeRoles('admin', 'organization'),
  softDeleteTraining
);

export default router;

