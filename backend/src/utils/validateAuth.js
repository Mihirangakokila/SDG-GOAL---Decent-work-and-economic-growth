const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email) => {
  if (!email || typeof email !== "string") return "Email is required";
  if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address";
  return null;
};

export const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[a-zA-Z]/.test(password)) return "Password must contain at least one letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  return null;
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (
    confirmPassword === undefined ||
    confirmPassword === null ||
    confirmPassword === ""
  ) {
    return "Please confirm your password";
  }
  if (password !== confirmPassword) return "Passwords do not match";
  return null;
};

export const validateName = (name, label = "Name") => {
  if (!name || typeof name !== "string" || !name.trim()) {
    return `${label} is required`;
  }
  if (name.trim().length < 2) return `${label} must be at least 2 characters`;
  return null;
};
