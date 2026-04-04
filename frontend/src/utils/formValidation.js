const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email) => {
  if (!email?.trim()) return 'Email is required';
  if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email';
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'At least 8 characters';
  if (!/[a-zA-Z]/.test(password)) return 'Include at least one letter';
  if (!/[0-9]/.test(password)) return 'Include at least one number';
  return '';
};

export const validateConfirm = (password, confirm) => {
  if (!confirm) return 'Confirm your password';
  if (password !== confirm) return 'Passwords do not match';
  return '';
};

export const validateName = (name, label) => {
  if (!name?.trim()) return `${label} is required`;
  if (name.trim().length < 2) return `${label} must be at least 2 characters`;
  return '';
};
