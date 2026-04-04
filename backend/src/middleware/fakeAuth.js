import User from "../models/User.js";

export const fakeProtect = async (req, res, next) => {
  try {
    // Hardcode organization email for now
    const user = await User.findOne({
      email: "org@bridgerural.com",
    });

    console.log("logged in user:", user); // Debugging statement
    console.log("User role:", user?.role); // Debugging statement

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};