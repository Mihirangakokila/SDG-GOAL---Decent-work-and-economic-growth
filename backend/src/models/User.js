import mongoose from "mongoose";

const ROLES = ["youth", "organization", "admin"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ROLES,
      default: "youth",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const USER_ROLES = ROLES;

const User = mongoose.model("User", userSchema);

export default User;