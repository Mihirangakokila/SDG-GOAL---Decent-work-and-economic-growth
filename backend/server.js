import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// Load env FIRST
dotenv.config();

const app = express();

// ✅ Headers
app.use((req, res, next) => {
  res.setHeader("X-InternHub-API", "1");
  next();
});

// ✅ CORS (keep advanced config)
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ FIX: payload limit (VERY IMPORTANT)
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// ================= IMPORTS =================
import applicationRoutes from "./src/routes/applicationRoutes.js";
import authRoutes from "./src/routes/auth.js";
import profileRoutes from "./src/routes/profile.js";
import organizationRoutes from "./src/routes/organizationRoutes.js";
import internshipRoutes from "./src/routes/internshipRoute.js";
import courseRoutes from "./src/routes/courseRoutes.js";

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

// ================= ROUTES =================

// Fix register/login conflicts
app.use((req, res, next) => {
  const path = (req.originalUrl || "").split("?")[0];

  if (req.method === "POST" && (path === "/api/register" || path === "/api/auth/register")) {
    return register(req, res, next);
  }

  if (req.method === "POST" && (path === "/api/login" || path === "/api/auth/login")) {
    return login(req, res, next);
  }

  next();
});

app.get("/", (req, res) => res.send("API is running..."));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ================= AI / CHAT =================

app.get("/api/advisor/status", (req, res) => {
  res.json({
    enabled: isOpenAIConfigured(),
  });
});

app.post("/api/advisor/chat", chatCompletionMinInterval, advisorChat);

app.get("/api/career-guidance/status", careerGuidanceStatus);
app.post("/api/career-guidance/chat", chatCompletionMinInterval, careerGuidanceChat);

// ================= AUTH =================

app.use("/api/auth", authRoutes);

// ================= COURSES =================

// ⚠️ ORDER MATTERS
app.get("/api/courses", listCourses);
app.get("/api/courses/my", protect, authorizeRoles("organization"), myCourses);
app.use("/api/courses", courseRoutes);

// ================= MAIN =================

app.use("/api/internships", internshipRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api", profileRoutes);
app.use("/api", organizationRoutes);

// ================= EMAIL TEST =================

if (process.env.NODE_ENV !== "production") {
  app.use("/api/email/test", emailTestRoutes);
}

// ================= DB =================

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

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);

    if (isOpenAIConfigured()) {
      console.log("✅ AI features enabled");
    } else {
      console.log("⚠️ AI features disabled (no OPENAI_API_KEY)");
    }
  });
}

start();