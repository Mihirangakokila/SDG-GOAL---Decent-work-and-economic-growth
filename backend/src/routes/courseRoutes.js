import express from "express";
import {
  createCourse,
  deleteCourse,
  myCourses,
  updateCourse,
} from "../controllers/courseController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public list is registered on app in server.js (GET /api/courses) so Express 5 always matches.
// This router only handles mutations and /my.

router.post("/", protect, authorizeRoles("organization"), createCourse);

router.get("/my", protect, authorizeRoles("organization"), myCourses);

router.put("/:id", protect, authorizeRoles("organization"), updateCourse);

router.delete("/:id", protect, authorizeRoles("organization"), deleteCourse);

export default router;
