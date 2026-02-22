import express from "express";
import { createInternshipController } from "../controllers/internshipController.js";

import { fakeProtect } from "../middleware/fakeAuth.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Route to create a new internship (protected, only for organizations)
router.post("/", 
  fakeProtect, 
  authorizeRoles("Organization"),
  createInternshipController
);

export default router;