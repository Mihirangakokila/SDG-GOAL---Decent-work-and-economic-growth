/**
 * Load first: .env from backend root, then disable Mongoose query buffering
 * before any mongoose.model() runs.
 */
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

mongoose.set("bufferCommands", false);
