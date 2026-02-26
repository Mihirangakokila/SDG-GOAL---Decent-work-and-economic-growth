import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const seedUsers = async () => {
  try {
    await User.deleteMany();

    await User.insertMany([
      {
        name: "BridgeRural Org",
        email: "org@bridgerural.com",
        password: "123456",
        role: "Organization",
      },
      {
        name: "Youth User",
        email: "youth@bridgerural.com",
        password: "123456",
        role: "Youth",
      },
      {
        name: "Admin User",
        email: "admin@bridgerural.com",
        password: "123456",
        role: "Admin",
      },
    ]);

    console.log("Seed users inserted 🌱");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedUsers();