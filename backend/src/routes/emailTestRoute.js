import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { verifyEmailConnection } from "../utils/emailService.js";
import {
  sendInternshipPostedEmail,
  sendInternshipClosedEmail,
  sendWeeklySummaryEmail,
} from "../utils/emailService.js";

const router = express.Router();

/**
 * DEV-ONLY routes for testing email templates.
 * Remove or gate behind NODE_ENV check before deploying to production.
 *
 * Usage:
 *   POST /api/email/test/posted   { "to": "you@gmail.com" }
 *   POST /api/email/test/closed   { "to": "you@gmail.com" }
 *   POST /api/email/test/weekly   { "to": "you@gmail.com" }
 *   GET  /api/email/test/ping
 */

// Verify SMTP connection
router.get("/ping", async (req, res) => {
  await verifyEmailConnection();
  res.json({ message: "Email ping done — check server console." });
});

// Test: internship posted email
router.post("/posted", async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ message: "Provide 'to' email in body." });

  const fakeInternship = {
    tittle:          "Frontend Developer Intern",
    location:        "Colombo, Sri Lanka",
    duration:        "3 months",
    requiredSkills:  ["React", "Node.js", "MongoDB"],
    status:          "Active",
    totalApplicants: 0,
    acceptedCount:   0,
  };

  const result = await sendInternshipPostedEmail(to, "Tech Corp", fakeInternship);
  res.json({ message: "Test email triggered", result });
});

// Test: internship closed email
router.post("/closed", async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ message: "Provide 'to' email in body." });

  const fakeInternship = {
    tittle:          "Backend Developer Intern",
    status:          "Closed",
    totalApplicants: 12,
    acceptedCount:   3,
  };

  const result = await sendInternshipClosedEmail(to, "Tech Corp", fakeInternship);
  res.json({ message: "Test email triggered", result });
});

// Test: weekly digest email
router.post("/weekly", async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ message: "Provide 'to' email in body." });

  const result = await sendWeeklySummaryEmail(to, "Tech Corp", {
    activeListings:  3,
    newApplications: 7,
    totalViews:      142,
    acceptanceRate:  25.5,
  });
  res.json({ message: "Test email triggered", result });
});

export default router;
