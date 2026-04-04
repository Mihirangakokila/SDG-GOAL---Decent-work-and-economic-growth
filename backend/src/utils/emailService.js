import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

// 2. Transporter Configuration (Optimized for Port 587 / TLS)
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use false for 587, true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Helps bypass local network restrictions
  },
});

// 3. Verify connection on startup
export const verifyEmailConnection = async () => {
  try {
    // Debug checks
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Email Error: Credentials missing in .env file");
      return;
    }

    await transporter.verify();
    console.log("✅ Email service ready and connected");
  } catch (error) {
    console.error("❌ Email service error:", error.message);
    
    // Specific advice for the 535 error
    if (error.message.includes("535")) {
      console.log("----------------------------------------------------------");
      console.log("🛠️  TROUBLESHOOTING THE 535 ERROR:");
      console.log("1. Go to: https://myaccount.google.com/apppasswords");
      console.log("2. Generate a NEW 16-character App Password.");
      console.log("3. Remove all spaces when pasting into .env (e.g., abcdelfghijkmnop)");
      console.log("4. Ensure 2-Step Verification is ON in your Google Account.");
      console.log("----------------------------------------------------------");
    }
  }
};

// 4. Shared HTML wrapper
const wrapHtml = (title, bodyHtml) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { margin:0; padding:0; background:#f4f4f5; font-family: Arial, sans-serif; }
    .container { max-width:580px; margin:32px auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08); }
    .header { background:#1d4ed8; padding:28px 32px; }
    .header h1 { color:#ffffff; margin:0; font-size:20px; font-weight:600; }
    .header p  { color:#bfdbfe; margin:6px 0 0; font-size:13px; }
    .body { padding:28px 32px; color:#374151; font-size:15px; line-height:1.7; }
    .body h2 { font-size:18px; color:#111827; margin:0 0 12px; }
    .pill { display:inline-block; padding:4px 12px; border-radius:20px; font-size:13px; font-weight:600; }
    .pill-active   { background:#d1fae5; color:#065f46; }
    .pill-closed   { background:#fee2e2; color:#991b1b; }
    .info-box { background:#f0f9ff; border-left:4px solid #1d4ed8; border-radius:4px; padding:14px 18px; margin:18px 0; }
    .info-box p { margin:4px 0; font-size:14px; color:#1e3a5f; }
    .info-box strong { color:#1d4ed8; }
    .divider { border:none; border-top:1px solid #e5e7eb; margin:20px 0; }
    .footer { background:#f9fafb; padding:18px 32px; font-size:12px; color:#9ca3af; text-align:center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>InternHub</h1>
      <p>Internship Management Platform</p>
    </div>
    <div class="body">
      <h2>${title}</h2>
      ${bodyHtml}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} InternHub &nbsp;|&nbsp; This is an automated message, please do not reply.
    </div>
  </div>
</body>
</html>
`;

// 5. Core send helper
const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"InternHub" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent → ${to} | MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email failed → ${to} | ${error.message}`);
    return { success: false, error: error.message };
  }
};

// 6. Trigger Functions

export const sendInternshipPostedEmail = async (orgEmail, orgName, internship) => {
  const html = wrapHtml(
    "Your internship is now live!",
    `
    <p>Hi <strong>${orgName}</strong>,</p>
    <p>Your internship listing has been successfully published on InternHub.</p>
    <div class="info-box">
      <p><strong>Title:</strong> ${internship.tittle}</p>
      <p><strong>Location:</strong> ${internship.location || "Remote / Not specified"}</p>
      <p><strong>Status:</strong> <span class="pill pill-active">Active</span></p>
    </div>
    <p>Students can now find and apply to this listing.</p>
    `
  );
  return sendEmail({ to: orgEmail, subject: `✅ Internship Published — ${internship.tittle}`, html });
};

export const sendInternshipClosedEmail = async (orgEmail, orgName, internship) => {
  const html = wrapHtml(
    "Internship listing closed",
    `
    <p>Hi <strong>${orgName}</strong>,</p>
    <p>Your internship listing <strong>${internship.tittle}</strong> has been closed.</p>
    <div class="info-box">
      <p><strong>Status:</strong> <span class="pill pill-closed">Closed</span></p>
    </div>
    `
  );
  return sendEmail({ to: orgEmail, subject: `🔒 Internship Closed — ${internship.tittle}`, html });
};

export const sendInternshipUpdatedEmail = async (orgEmail, orgName, internship, changedFields) => {
  const fieldList = changedFields.map((f) => `<li>${f}</li>`).join("");
  const html = wrapHtml(
    "Internship listing updated",
    `
    <p>Hi <strong>${orgName}</strong>,</p>
    <p>The following fields were updated for <strong>${internship.tittle}</strong>:</p>
    <ul>${fieldList}</ul>
    `
  );
  return sendEmail({ to: orgEmail, subject: `📝 Internship Updated — ${internship.tittle}`, html });
};

export const sendNewApplicationNotification = async (orgEmail, orgName, internshipTitle, applicantName, applicantEmail) => {
  const html = wrapHtml(
    "New application received",
    `
    <p>Hi <strong>${orgName}</strong>,</p>
    <p>A new student has applied to <strong>${internshipTitle}</strong>.</p>
    <div class="info-box">
      <p><strong>Applicant:</strong> ${applicantName}</p>
      <p><strong>Email:</strong> ${applicantEmail}</p>
    </div>
    `
  );
  return sendEmail({ to: orgEmail, subject: `👤 New Application — ${internshipTitle}`, html });
};

export const sendWeeklySummaryEmail = async (orgEmail, orgName, stats) => {
  const html = wrapHtml(
    "Your weekly internship summary",
    `
    <p>Hi <strong>${orgName}</strong>,</p>
    <div class="info-box">
      <p><strong>Active Listings:</strong> ${stats.activeListings || 0}</p>
      <p><strong>New Applications:</strong> ${stats.newApplications || 0}</p>
      <p><strong>Total Views:</strong> ${stats.totalViews || 0}</p>
    </div>
    `
  );
  return sendEmail({ to: orgEmail, subject: `📊 Your Weekly InternHub Summary`, html });
};