import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./src/routes/auth.js";
import profileRoutes from "./src/routes/profile.js";
import organizationRoutes from "./src/routes/organizationRoutes.js";

import internshipRoutes from "./src/routes/internshipRoute.js";


//load environment variables
dotenv.config();

// Create express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

//define a simple route
/*app.get("/", (req,res ) => {
  res.send("API is running...");
})*/

// Use internship routes
app.use("/api/internships", internshipRoutes);


// Organization profile routes
app.use("/", organizationRoutes);

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

