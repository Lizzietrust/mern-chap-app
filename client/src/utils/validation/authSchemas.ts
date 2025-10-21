export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateEmail = (email: string): string | null => {
  if (!email.trim()) {
    return "Email is required";
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return "Please enter a valid email address";
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return "Password is required";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }
  return null;
};

export const validateLoginForm = (formData: {
  email: string;
  password: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export interface RegisterFormData {
  name?: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const validateName = (name: string): string | null => {
  if (name && name.trim().length < 2) {
    return "Name must be at least 2 characters";
  }
  return null;
};

export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): string | null => {
  if (!confirmPassword) {
    return "Please confirm your password";
  }
  if (password !== confirmPassword) {
    return "Passwords do not match";
  }
  return null;
};

export const validateRegisterForm = (
  formData: RegisterFormData
): ValidationResult => {
  const errors: Record<string, string> = {};

  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;

  const confirmPasswordError = validateConfirmPassword(
    formData.password,
    formData.confirmPassword
  );
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

  if (formData.name) {
    const nameError = validateName(formData.name);
    if (nameError) errors.name = nameError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
