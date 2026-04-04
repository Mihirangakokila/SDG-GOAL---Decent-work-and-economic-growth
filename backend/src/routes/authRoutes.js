import express from "express";
import {
  getMe,
  login,
  registerOrganizer,
  registerUser,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register/user", registerUser);
router.post("/register/organizer", registerOrganizer);
router.post("/login", login);
router.get("/me", protect, getMe);

export default router;
