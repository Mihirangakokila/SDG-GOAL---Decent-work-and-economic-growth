/**
 * server.js  –  UPDATED VERSION with Socket.IO real-time messaging
 *
 * Changes from original:
 *  1. Use http.createServer so Socket.IO can share the same port.
 *  2. Call initSocket() and store io on app.locals.
 *  3. Mount /api/messages routes.
 *  4. applicationController can import pushApplicationUpdate from socketServer.
 */

import express from "express";
import http from "http";                        // ← NEW
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const httpServer = http.createServer(app);      // ← NEW

// ── Socket.IO ──────────────────────────────────────────────
import { initSocket } from "./src/socket/socketServer.js"; // ← NEW
const io = initSocket(httpServer);               // ← NEW
app.locals.io = io;                              // ← NEW (so controllers can access it)

// ── Headers ────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("X-InternHub-API", "1");
  next();
});

// ── CORS ───────────────────────────────────────────────────
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Body parsing ───────────────────────────────────────────
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// ── Route imports ──────────────────────────────────────────
import applicationRoutes from "./src/routes/applicationRoutes.js";
import authRoutes from "./src/routes/auth.js";
import profileRoutes from "./src/routes/profile.js";
import organizationRoutes from "./src/routes/organizationRoutes.js";
import internshipRoutes from "./src/routes/internshipRoute.js";
import courseRoutes from "./src/routes/courseRoutes.js";
import messageRoutes from "./src/routes/messageRoutes.js";   // ← NEW

import { listCourses, myCourses } from "./src/controllers/courseController.js";
import { register, login } from "./src/controllers/authController.js";
import { protect } from "./src/middleware/authMiddleware.js";
import { authorizeRoles } from "./src/middleware/roleMiddleware.js";
import { verifyEmailConnection } from "./src/utils/emailService.js";
import { startWeeklyCron } from "./src/jobs/weeklyCron.js";
import emailTestRoutes from "./src/routes/emailTestRoute.js";
import { advisorChat } from "./src/controllers/advisorController.js";
import {
  careerGuidanceChat,
  careerGuidanceStatus,
} from "./src/controllers/careerGuidanceController.js";
import { isOpenAIConfigured } from "./src/utils/openaiConfig.js";
import { chatCompletionMinInterval } from "./src/middleware/chatThrottleMiddleware.js";

// ── Auth shortcut ───────────────────────────────────────────
app.use((req, res, next) => {
  const path = (req.originalUrl || "").split("?")[0];
  if (req.method === "POST" && (path === "/api/register" || path === "/api/auth/register"))
    return register(req, res, next);
  if (req.method === "POST" && (path === "/api/login" || path === "/api/auth/login"))
    return login(req, res, next);
  next();
});

// ── Basic routes ────────────────────────────────────────────
app.get("/", (req, res) => res.send("API is running..."));
app.get("/api/health", (req, res) =>
  res.json({
    ok: true,
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  })
);

// ── AI / Chat ───────────────────────────────────────────────
app.get("/api/advisor/status", (req, res) =>
  res.json({ enabled: isOpenAIConfigured() })
);
app.post("/api/advisor/chat", chatCompletionMinInterval, advisorChat);
app.get("/api/career-guidance/status", careerGuidanceStatus);
app.post("/api/career-guidance/chat", chatCompletionMinInterval, careerGuidanceChat);

// ── Main routes ─────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.get("/api/courses", listCourses);
app.get("/api/courses/my", protect, authorizeRoles("organization"), myCourses);
app.use("/api/courses", courseRoutes);
app.use("/api/internships", internshipRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api", profileRoutes);
app.use("/api", organizationRoutes);
app.use("/api/messages", messageRoutes);          // ← NEW

if (process.env.NODE_ENV !== "production") {
  app.use("/api/email/test", emailTestRoutes);
}

// ── DB & start ──────────────────────────────────────────────
const mongoUri =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL;

async function start() {
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected ✅");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }

  verifyEmailConnection();
  startWeeklyCron();

  const PORT = process.env.PORT || 5000;

  // ← Use httpServer.listen instead of app.listen
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Socket.IO real-time messaging enabled ✅`);     // ← NEW
    if (isOpenAIConfigured()) {
      console.log("✅ AI features enabled");
    } else {
      console.log("⚠️  AI features disabled (no OPENAI_API_KEY)");
    }
  });
}

start();
