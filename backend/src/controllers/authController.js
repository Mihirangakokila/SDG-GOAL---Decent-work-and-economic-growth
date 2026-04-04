import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import {
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
} from "../utils/validateAuth.js";

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || "dev-secret-change-me",
    { expiresIn: "7d" }
  );

export const registerUser = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    const nameErr = validateName(username, "Username");
    if (nameErr) return res.status(400).json({ message: nameErr });

    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ message: emailErr });

    const passErr = validatePassword(password);
    if (passErr) return res.status(400).json({ message: passErr });

    const matchErr = validateConfirmPassword(password, confirmPassword);
    if (matchErr) return res.status(400).json({ message: matchErr });

    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists)
      return res.status(400).json({ message: "Email is already registered" });

    const user = await User.create({
      name: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: "user",
    });

    res.status(201).json({
      token: signToken(user),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message || "Registration failed" });
  }
};

export const registerOrganizer = async (req, res) => {
  try {
    const { businessName, email, password, confirmPassword } = req.body;

    const nameErr = validateName(businessName, "Business name");
    if (nameErr) return res.status(400).json({ message: nameErr });

    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ message: emailErr });

    const passErr = validatePassword(password);
    if (passErr) return res.status(400).json({ message: passErr });

    const matchErr = validateConfirmPassword(password, confirmPassword);
    if (matchErr) return res.status(400).json({ message: matchErr });

    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists)
      return res.status(400).json({ message: "Email is already registered" });

    const user = await User.create({
      name: businessName.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: "organizer",
    });

    res.status(201).json({
      token: signToken(user),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message || "Registration failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ message: emailErr });

    if (!password)
      return res.status(400).json({ message: "Password is required" });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    const ok = await user.matchPassword(password);
    if (!ok)
      return res.status(401).json({ message: "Invalid email or password" });

    res.json({
      token: signToken(user),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message || "Login failed" });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      res.status(401).json({ message: "Not authorized, user not found" });
      return;
    }
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to load profile" });
  }
};
