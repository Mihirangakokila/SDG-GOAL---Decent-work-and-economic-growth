import express from 'express';
import {
  applyForInternship,
  getMyApplications,
  getApplicationById,
  withdrawApplication,
  checkApplicationStatus,
  updateApplication,
  getApplicationsByInternship,
  updateApplicationStatus,        // ← NEW
} from '../controllers/applicationController.js';
import uploadCV, { flexibleUpload } from '../middleware/uploadCV.js';
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.post('/apply/:internshipId', flexibleUpload, applyForInternship);
router.get('/my-applications', getMyApplications);
router.get('/check/:internshipId', checkApplicationStatus);
router.get('/:id', getApplicationById);
router.put('/:id', flexibleUpload, updateApplication);
router.delete('/:id', withdrawApplication);

// PATCH /api/applications/:id/status  (org or admin only) ← NEW
router.patch(
  '/:id/status',
  authorizeRoles('organization', 'admin'),
  updateApplicationStatus
);

// GET /api/applications/internship/:internshipId  (org only)
router.get(
  '/internship/:internshipId',
  authorizeRoles('organization'),
  getApplicationsByInternship
);

export default router;
