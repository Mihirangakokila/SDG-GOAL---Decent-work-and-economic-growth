import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// Load environment variables FIRST, before importing other modules
dotenv.config();

// Import routes
import applicationRoutes  from './src/routes/applicationRoutes.js';
import authRoutes         from "./src/routes/auth.js";
import profileRoutes      from "./src/routes/profile.js";
import organizationRoutes from "./src/routes/organizationRoutes.js";
import internshipRoutes   from "./src/routes/internshipRoute.js";
import { verifyEmailConnection } from "./src/utils/emailService.js";  
import { startWeeklyCron }       from "./src/jobs/weeklyCron.js";      
import emailTestRoutes           from "./src/routes/emailTestRoute.js"; 

dotenv.config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected ✅'))
    .catch((err) => console.log('Error connecting to MongoDB:', err));

verifyEmailConnection();  
startWeeklyCron();        

app.get("/", (req, res) => res.send("API is running..."));

app.use("/api/auth",        authRoutes);
app.use("/api",             profileRoutes);
app.use("/api",             organizationRoutes);
app.use("/api/internships", internshipRoutes);
app.use("/api/applications", applicationRoutes);

if (process.env.NODE_ENV !== "production") {   
  app.use("/api/email/test", emailTestRoutes);  
}

//start the serve                                              

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});