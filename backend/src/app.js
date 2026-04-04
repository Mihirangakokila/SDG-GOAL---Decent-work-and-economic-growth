import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";

const requireMongo = (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();
  res.status(503).json({
    message:
      "Database is not connected. If the server just restarted, wait a moment and retry; otherwise check MONGO_URI and that MongoDB is reachable.",
  });
};

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("Skill Development API is running...");
  });

  app.get("/health", (req, res) => {
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    res.json({
      ok: true,
      mongo: states[mongoose.connection.readyState] || "unknown",
      apiReady: mongoose.connection.readyState === 1,
    });
  });

  app.use("/api", requireMongo);
  app.use("/api/auth", authRoutes);
  app.use("/api/courses", courseRoutes);
  app.use("/api/applications", applicationRoutes);

  app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      message: "An error occurred",
      error: err.message,
    });
  });

  return app;
}
