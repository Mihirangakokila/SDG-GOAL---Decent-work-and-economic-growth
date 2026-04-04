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

// Import authentication middleware - now in same backend/src folder
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route to create a new internship (protected, only for organizations)
router.post("/", 
  protect, 
  authorizeRoles("organization"),
  createInternshipController
);

// Route to update an existing internship (protected, only for organizations)
router.put("/:id", 
  protect, 
  authorizeRoles("organization"),
  updateInternshipController
);

// Route to delete an internship (protected, only for organizations)
router.delete("/:id",
  protect,
  authorizeRoles("organization"),
  deleteInternshipController
);  

// Route to get all internships for the logged-in organization (protected, only for organizations)
router.get("/my-internships", 
  protect, 
  authorizeRoles("organization"),
  getMyInternships
);

// Dashboard (must be before :id routes to avoid matching)
router.get(
  "/dashboard/stats",
  protect,
  authorizeRoles("organization"),
  getDashboardStats
);

// Search internships
router.get("/search", searchInternshipsController);

// Route to get a single internship by ID (public)
router.get("/:id", getInternshipByIdController);

// Route to increment view count of an internship (public)
router.put("/view/:id", incrementViewCountController);

export default router;