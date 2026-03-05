import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  createProfile,
  getProfileByUserId,
  getProfiles,
  updateProfile,
  uploadCv,
  deleteProfile,
} from "../controllers/profileController.js";

const router = express.Router();

// Create youth profile - only youth users
router.post(
  "/profile",
  protect,
  authorizeRoles("youth"),
  createProfile
);

// Get profile by userId
router.get(
  "/profile/:userId",
  protect,
  authorizeRoles("youth", "organization", "admin"),
  getProfileByUserId
);

// Get profiles list (behaviour depends on role)
router.get(
  "/profiles",
  protect,
  authorizeRoles("youth", "organization", "admin"),
  getProfiles
);

// Update profile
router.put(
  "/profile/:userId",
  protect,
  authorizeRoles("youth", "admin"),
  updateProfile
);

// Upload CV / documents metadata
router.post(
  "/profile/:userId/upload-cv",
  protect,
  authorizeRoles("youth", "admin"),
  uploadCv
);

// Delete profile
router.delete(
  "/profile/:userId",
  protect,
  authorizeRoles("youth", "admin"),
  deleteProfile
);

export default router;
