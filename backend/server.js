import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// Load environment variables FIRST, before importing other modules
dotenv.config();

// Import routes
import applicationRoutes from './src/routes/applicationRoutes.js';

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
    

//define a simple route
app.get("/", (req,res ) => {
  res.send("API is running...");
})

// Use routes
app.use('/api/applications', applicationRoutes);

//start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT,() => {
  console.log(`Server is running on port ${PORT}`);
});