import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./src/routes/auth.js";
import profileRoutes from "./src/routes/profile.js";
import organizationRoutes from "./src/routes/organizationRoutes.js";
import internshipRoutes from "./src/routes/internshipRoute.js";


//load environment variables
dotenv.config();

//create express app
const app = express();

//middleware to parse JSON bodies
app.use(express.json());

//connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected ✅'))
    .catch((err) => console.log('Error connecting to MongoDB:', err));

//define a simple route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Auth routes
app.use("/api/auth", authRoutes);

// Youth profile routes
app.use("/api", profileRoutes);

// Organization profile routes
app.use("/api", organizationRoutes);

// Internship routes
app.use("/api/internships", internshipRoutes);


//start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT,() => {
  console.log(`Server is running on port ${PORT}`);
});