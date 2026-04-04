import express from "express";
import { applyToCourse, myApplications } from "../controllers/applicationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, authorizeRoles("user"), applyToCourse);

router.get("/my", protect, authorizeRoles("user"), myApplications);

export default router;
