// trainingRoutes.js
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

// ================================
// Admin / Organization only routes
// ================================

// Create a new training
router.post(
  '/',
  protect,
  authorizeRoles('admin', 'organization'),
  createTraining
);

// Get all trainings (Admin/Organization)
router.get(
  '/all',
  protect,
  authorizeRoles('admin', 'organization'),
  getAllTrainings
);

// Update training by ID
router.put(
  '/:id',
  protect,
  authorizeRoles('admin', 'organization'),
  updateTraining
);

// Soft delete training by ID
router.delete(
  '/:id',
  protect,
  authorizeRoles('admin', 'organization'),
  softDeleteTraining
);

// ================================
// Youth routes
// ================================

// Get active trainings with optional filters
router.get('/', protect, authorizeRoles('youth', 'admin', 'organization'), getActiveTrainings);

// Get recommended trainings for youth
router.get(
  '/recommendations',
  protect,
  authorizeRoles('youth'),
  getRecommendations
);

// Get single training details
router.get('/:id', protect, authorizeRoles('youth', 'admin', 'organization'), getTrainingById);

// Export router
export default router;