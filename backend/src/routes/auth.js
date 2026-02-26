import express from "express";
import {
  register,
  login,
  getMe,
  updateMe,
  deleteUser,
} from "../controllers/authController.js";
import { protect, authorizeRoles } from "../middlewear/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", protect, getMe);

// Any authenticated user can update their own email/password
router.put("/update", protect, authorizeRoles("youth", "organization", "admin"), updateMe);

// A user can delete their own account; admin can delete any account
router.delete(
  "/:id",
  protect,
  authorizeRoles("youth", "organization", "admin"),
  deleteUser
);

export default router;

