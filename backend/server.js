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

//create express app
const app = express();

//middleware to parse JSON bodies
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected ✅'))
    .catch((err) => console.log('Error connecting to MongoDB:', err));

try {
  verifyEmailConnection();  
  startWeeklyCron();        
} catch (error) {
  console.log('Error initializing email service/cron:', error);
}

//define a simple route
app.get("/", (req, res) => res.send("API is running..."));

// Use routes
app.use('/api/applications', applicationRoutes);
app.use("/api/auth",        authRoutes);
app.use("/api",             profileRoutes);
app.use("/api",             organizationRoutes);
app.use("/api/internships", internshipRoutes);

if (process.env.NODE_ENV !== "production") {   
  app.use("/api/email/test", emailTestRoutes);  
}

//start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});