import "./src/config/mongooseInit.js";
import mongoose from "mongoose";
import { createApp } from "./src/app.js";
import { verifyEmailConnection } from "./src/utils/emailService.js";

const app = createApp();

const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI =
  process.env.MONGO_URI?.trim() || "mongodb://127.0.0.1:27017/bridgerural";

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
    family: 4,
    bufferCommands: false,
    maxPoolSize: 10,
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 10000,
  })
  .then(() => {
    console.log("MongoDB connected ✅");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} 🚀`);
    });
    void verifyEmailConnection();
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  });

mongoose.connection.on("connected", () => console.log("Mongoose connected"));
mongoose.connection.on("error", (err) => console.error("Mongoose error:", err));
mongoose.connection.on("disconnected", (reason) => {
  console.error("Mongoose disconnected:", new Date().toISOString(), reason);
});
