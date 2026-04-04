import express from "express";
import {
  createCourse,
  deleteCourse,
  listCourses,
  myCourses,
  updateCourse,
} from "../controllers/courseController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", listCourses);

router.post("/", protect, authorizeRoles("organizer"), createCourse);

router.get("/my", protect, authorizeRoles("organizer"), myCourses);

router.put("/:id", protect, authorizeRoles("organizer"), updateCourse);

router.delete("/:id", protect, authorizeRoles("organizer"), deleteCourse);

export default router;
