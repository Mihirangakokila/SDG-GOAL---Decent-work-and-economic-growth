<<<<<<< HEAD
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes         from "./src/routes/auth.js";
import profileRoutes      from "./src/routes/profile.js";
import organizationRoutes from "./src/routes/organizationRoutes.js";
import internshipRoutes   from "./src/routes/internshipRoute.js";
import { verifyEmailConnection } from "./src/utils/emailService.js";  
import { startWeeklyCron }       from "./src/jobs/weeklyCron.js";      
import emailTestRoutes           from "./src/routes/emailTestRoute.js"; 
=======
import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import trainingRoutes from './routes/trainingRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
>>>>>>> 97afa7c (Added backend modules and updated server)

dotenv.config();

const app = express();
<<<<<<< HEAD
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

if (process.env.NODE_ENV !== "production") {   
  app.use("/api/email/test", emailTestRoutes);  
}                                               

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
=======

// Middleware
app.use(cors());
app.use(express.json()); // important for req.body

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Youth Internship Support System API' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trainings', trainingRoutes);
app.use('/api/enrollments', enrollmentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'An error occurred',
    error: err.message,
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bridgerural_training';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
<<<<<<< HEAD
  });

>>>>>>> 97afa7c (Added backend modules and updated server)
=======
  });
>>>>>>> 05d99a0 (Add gitignore and remove node_modules)
