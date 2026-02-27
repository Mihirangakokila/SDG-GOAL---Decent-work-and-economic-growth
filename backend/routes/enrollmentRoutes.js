import express from 'express';
import {
  enrollInTraining,
  getMyEnrollments,
  markEnrollmentCompleted,
} from '../controllers/enrollmentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Enroll youth in a training
router.post('/', protect, authorizeRoles('youth'), enrollInTraining);

// Get current youth enrollments
router.get('/my', protect, authorizeRoles('youth'), getMyEnrollments);

// Mark enrollment as completed
router.put(
  '/:id/complete',
  protect,
  authorizeRoles('youth', 'admin', 'organization'),
  markEnrollmentCompleted
);

export default router;

