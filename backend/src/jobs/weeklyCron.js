import cron from "node-cron";
import User from "../models/User.js";
import Internship from "../models/internship.js";
import { sendWeeklySummaryEmail } from "../utils/emailService.js";

/**
 * Weekly digest — runs every Monday at 8:00 AM
 * Sends each organization a summary of their activity.
 *
 * Setup: import and call startWeeklyCron() once in server.js
 *   import { startWeeklyCron } from "./jobs/weeklyCron.js";
 *   startWeeklyCron();
 */
export const startWeeklyCron = () => {
  // Cron syntax: minute hour day month weekday
  // "0 8 * * 1"  = 08:00 every Monday
  cron.schedule("0 8 * * 1", async () => {
    console.log("⏰ Running weekly email digest...");

    try {
      // Find all organization accounts
      const organizations = await User.find({ role: "organization" }).select("_id email organizationName name");

      for (const org of organizations) {
        const orgId = org._id;

        // Gather stats for this org
        const internships = await Internship.find({ organizationId: orgId });

        const activeListings = internships.filter((i) => i.status === "Active").length;

        const totalViews = internships.reduce((sum, i) => sum + (i.viewCount ?? 0), 0);

        const totalApplicants = internships.reduce((sum, i) => sum + (i.totalApplicants ?? 0), 0);
        const acceptedCount   = internships.reduce((sum, i) => sum + (i.acceptedCount   ?? 0), 0);
        const acceptanceRate  = totalApplicants > 0
          ? ((acceptedCount / totalApplicants) * 100).toFixed(1)
          : 0;

        // New applications in the last 7 days — requires Applications model
        // (from your teammate's Component 3 — import and enable when ready)
        // const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        // const newApplications = await Application.countDocuments({
        //   internshipId: { $in: internships.map((i) => i._id) },
        //   createdAt: { $gte: oneWeekAgo },
        // });

        await sendWeeklySummaryEmail(
          org.email,
          org.organizationName ?? org.name,
          {
            activeListings,
            totalViews,
            acceptanceRate,
            newApplications: 0, // replace with actual count once Application model is available
          }
        );
      }

      console.log(`✅ Weekly digest sent to ${organizations.length} organizations.`);
    } catch (error) {
      console.error("❌ Weekly cron error:", error.message);
    }
  });

  console.log("📅 Weekly email cron scheduled (Mondays 08:00)");
};
