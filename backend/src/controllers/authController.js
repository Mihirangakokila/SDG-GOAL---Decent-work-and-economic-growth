import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { USER_ROLES } from "../models/User.js";
import YouthProfile from "../models/YouthProfile.js";
import OrganizationProfile from "../models/OrganizationProfile.js";

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const JWT_EXPIRES_IN = "7d";

// Helper to generate a signed JWT for a user
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Helper to shape user data returned to the client (never include password)
const sanitizeUser = (user) => {
  if (!user) return null;
  const { _id, name, email, role, createdAt, updatedAt } = user;
  return { id: _id, name, email, role, createdAt, updatedAt };
};

// POST /auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    let assignedRole = "youth";
    if (role) {
      const normalizedRole = String(role).toLowerCase();
      if (!USER_ROLES.includes(normalizedRole)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      assignedRole = normalizedRole;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
    });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      message: "User registered successfully",
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    console.error("Error in register:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      message: "Logged in successfully",
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /auth/me
export const getMe = async (req, res) => {
  try {
    // req.user is populated by the auth middleware
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    return res.status(200).json({
      user: sanitizeUser(req.user),
    });
  } catch (error) {
    console.error("Error in getMe:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /auth/update
export const updateMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { email, password } = req.body;

    if (!email && !password) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const updates = {};

    if (email) {
      updates.email = email.toLowerCase();
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    console.error("Error in updateMe:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE /auth/:id
export const deleteUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const targetUserId = req.params.id;

    const isAdmin = req.user.role === "admin";
    const isSelf = String(req.user._id) === String(targetUserId);

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: "Not authorized to delete this account" });
    }

    await YouthProfile.findOneAndDelete({ user: targetUserId });
    await OrganizationProfile.findOneAndDelete({ user: targetUserId });
    await User.findByIdAndDelete(targetUserId);

    return res.status(200).json({ message: "User and related profiles deleted successfully" });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
