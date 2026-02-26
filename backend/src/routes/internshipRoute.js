import express from "express";
import { 
  createInternshipController,
  updateInternshipController,
  deleteInternshipController,
  getInternshipByIdController,
  getMyInternships,
  incrementViewCountController,
  getDashboardStats,
  searchInternshipsController

} from "../controllers/internshipController.js";

import { fakeProtect } from "../middleware/fakeAuth.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Route to create a new internship (protected, only for organizations)
router.post("/", 
  fakeProtect, 
  authorizeRoles("Organization"),
  createInternshipController
);

// Route to update an existing internship (protected, only for organizations)
router.put("/:id", 
  fakeProtect, 
  authorizeRoles("Organization"),
  updateInternshipController
);

// Route to delete an internship (protected, only for organizations)
router.delete("/:id",
  fakeProtect,
  authorizeRoles("Organization"),
  deleteInternshipController
);  

// Route to get all internships for the logged-in organization (protected, only for organizations)
router.get("/my-internships", 
  fakeProtect, 
  authorizeRoles("Organization"),
  getMyInternships
);


// Route to get a single internship by ID (public)
router.get("/:id", getInternshipByIdController);

// Route to increment view count of an internship (public)
router.put("/view/:id", incrementViewCountController);

// Dashboard
router.get(
  "/dashboard/stats",
  fakeProtect,
  authorizeRoles("Organization"),
  getDashboardStats
);

// Search internships
router.get("/search", searchInternshipsController);
export default router;