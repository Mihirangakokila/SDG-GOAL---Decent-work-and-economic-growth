// Temporary auth middleware for development
// This will be replaced with the actual auth middleware from the login team

export const protect = async (req, res, next) => {
  try {
    // For testing purposes, we'll use a hardcoded user ID
    // In production, this will be replaced with actual JWT verification
    
    // UPDATE THIS ID to match your actual youth user from MongoDB
    req.user = {
      _id: "6999fbd03185008b98e558e6", // ← CHANGE THIS to your actual youth ID
      role: "youth"
    };
    
    console.log('Auth middleware set user:', req.user); // Debug log
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Not authorized' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};