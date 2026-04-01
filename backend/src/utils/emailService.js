import nodemailer from "nodemailer";

// ─── Transporter (configured once, reused everywhere) ────────────────────────
const getTransporter = () => nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Verify connection on startup (optional but useful for debugging) ─────────
export const verifyEmailConnection = async () => {
  try {
    await getTransporter().verify();   // ← was: transporter.verify()
    console.log("✅ Email service ready");
  } catch (error) {
    console.error("❌ Email service error:", error.message);
  }
};

// ─── Shared HTML wrapper (keeps all emails visually consistent) ───────────────
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
    .pill-draft    { background:#f3f4f6; color:#374151; }
    .pill-accepted { background:#d1fae5; color:#065f46; }
    .pill-rejected { background:#fee2e2; color:#991b1b; }
    .pill-pending  { background:#fef3c7; color:#92400e; }
    .info-box { background:#f0f9ff; border-left:4px solid #1d4ed8; border-radius:4px; padding:14px 18px; margin:18px 0; }
    .info-box p { margin:4px 0; font-size:14px; color:#1e3a5f; }
    .info-box strong { color:#1d4ed8; }
    .btn { display:inline-block; padding:12px 28px; background:#1d4ed8; color:#ffffff !important; text-decoration:none; border-radius:6px; font-size:15px; font-weight:600; margin:18px 0 8px; }
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

// ─── Core send helper ─────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await getTransporter().sendMail({  // ← was: transporter.sendMail()
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

// ════════════════════════════════════════════════════════════════════════════════
// EMAIL TRIGGER 1: Organization posts a new internship (status → Active)
// Called in: createInternship service when status is "Active"
// ════════════════════════════════════════════════════════════════════════════════
export const sendInternshipPostedEmail = async (orgEmail, orgName, internship) => {
  const html = wrapHtml(
    "Your internship is now live!",
    `
    <p>Hi <strong>${orgName}</strong>,</p>
    <p>Your internship listing has been successfully published on InternHub.</p>
    <div class="info-box">
      <p><strong>Title:</strong> ${internship.tittle}</p>
      <p><strong>Location:</strong> ${internship.location || "Remote / Not specified"}</p>
      <p><strong>Duration:</strong> ${internship.duration || "Not specified"}</p>
      <p><strong>Status:</strong> <span class="pill pill-active">Active</span></p>
      <p><strong>Skills:</strong> ${(internship.requiredSkills || []).join(", ") || "Not specified"}</p>
    </div>
    <p>Students can now find and apply to this listing. You will be notified when applications arrive.</p>
    <hr class="divider"/>
    <p style="font-size:13px;color:#6b7280;">Manage your listings from your organization dashboard.</p>
    `
  );

  return sendEmail({
    to: orgEmail,
    subject: `✅ Internship Published — ${internship.tittle}`,
    html,
  });
};

// ════════════════════════════════════════════════════════════════════════════════
// EMAIL TRIGGER 2: Organization closes an internship (status → Closed)
// Called in: updateInternship service when new status is "Closed"
// ════════════════════════════════════════════════════════════════════════════════
export const sendInternshipClosedEmail = async (orgEmail, orgName, internship) => {
  const html = wrapHtml(
    "Internship listing closed",
    `
    <p>Hi <strong>${orgName}</strong>,</p>
    <p>Your internship listing has been closed and is no longer accepting applications.</p>
    <div class="info-box">
      <p><strong>Title:</strong> ${internship.tittle}</p>
      <p><strong>Status:</strong> <span class="pill pill-closed">Closed</span></p>
      <p><strong>Total Applicants:</strong> ${internship.totalApplicants ?? 0}</p>
      <p><strong>Accepted:</strong> ${internship.acceptedCount ?? 0}</p>
    </div>
    <p>You can reactivate this listing at any time from your dashboard.</p>
    `
  );

  return sendEmail({
    to: orgEmail,
    subject: `🔒 Internship Closed — ${internship.tittle}`,
    html,
  });
};

// ════════════════════════════════════════════════════════════════════════════════
// EMAIL TRIGGER 3: Internship details updated
// Called in: updateInternship service (for significant field changes)
// ════════════════════════════════════════════════════════════════════════════════
export const sendInternshipUpdatedEmail = async (orgEmail, orgName, internship, changedFields) => {
  const fieldList = changedFields
    .map((f) => `<li>${f}</li>`)
    .join("");

  const html = wrapHtml(
    "Internship listing updated",
    `
    <p>Hi <strong>${orgName}</strong>,</p>
    <p>Your internship listing <strong>${internship.tittle}</strong> has been updated successfully.</p>
    <div class="info-box">
      <p><strong>Updated fields:</strong></p>
      <ul style="margin:8px 0 0 0;padding-left:18px;font-size:14px;">${fieldList}</ul>
    </div>
    <p>The changes are now live for all job seekers.</p>
    `
  );

  return sendEmail({
    to: orgEmail,
    subject: `📝 Internship Updated — ${internship.tittle}`,
    html,
  });
};

// ════════════════════════════════════════════════════════════════════════════════
// EMAIL TRIGGER 4: New application received (notify organization)
// Called in: Applications component → application create service
// Exported here so your teammate (Component 3) can import it from this util
// ════════════════════════════════════════════════════════════════════════════════
export const sendNewApplicationNotification = async (
  orgEmail,
  orgName,
  internshipTitle,
  applicantName,
  applicantEmail
) => {
  const html = wrapHtml(
    "New application received",
    `
    <p>Hi <strong>${orgName}</strong>,</p>
    <p>A new student has applied to your internship listing.</p>
    <div class="info-box">
      <p><strong>Internship:</strong> ${internshipTitle}</p>
      <p><strong>Applicant:</strong> ${applicantName}</p>
      <p><strong>Email:</strong> ${applicantEmail}</p>
      <p><strong>Applied at:</strong> ${new Date().toLocaleString()}</p>
    </div>
    <p>Log in to your dashboard to review and respond to this application.</p>
    `
  );

  return sendEmail({
    to: orgEmail,
    subject: `👤 New Application — ${internshipTitle}`,
    html,
  });
};

// ════════════════════════════════════════════════════════════════════════════════
// EMAIL TRIGGER 5: Weekly summary digest for organizations
// Called in: a scheduled cron job (see notes below)
// ════════════════════════════════════════════════════════════════════════════════
export const sendWeeklySummaryEmail = async (orgEmail, orgName, stats) => {
  const {
    activeListings    = 0,
    newApplications   = 0,
    totalViews        = 0,
    acceptanceRate    = 0,
  } = stats;

  const html = wrapHtml(
    "Your weekly internship summary",
    `
    <p>Hi <strong>${orgName}</strong>,</p>
    <p>Here is a quick summary of your InternHub activity this week:</p>
    <div class="info-box">
      <p><strong>Active Listings:</strong> ${activeListings}</p>
      <p><strong>New Applications this week:</strong> ${newApplications}</p>
      <p><strong>Total Views this week:</strong> ${totalViews}</p>
      <p><strong>Overall Acceptance Rate:</strong> ${acceptanceRate}%</p>
    </div>
    <p>Log in to your dashboard for detailed analytics and to manage applications.</p>
    `
  );

  return sendEmail({
    to: orgEmail,
    subject: `📊 Your Weekly InternHub Summary`,
    html,
  });
};
