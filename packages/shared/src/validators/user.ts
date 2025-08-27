
// Shared validation functions for both frontend and backend
export function validatePassword(password: string) {
  const errors: string[] = [];
  if (password.length < 12) {
    errors.push('validation.password.min_length');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('validation.password.special_char');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('validation.password.uppercase');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('validation.password.lowercase');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('validation.password.number');
  }
  return errors;
}

export function validateEmail(email: string) {
  const errors: string[] = [];
  if (!email.includes('@')) {
    errors.push('validation.email.invalid');
  }
  return errors;
}

export function validateUsername(username: string) {
  const errors: string[] = [];
  if (username.length < 3) {
    errors.push('validation.username.min_length');
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('validation.username.invalid_chars');
  }
  return errors;
}

export function validateFirstName(firstName: string) {
  const errors: string[] = [];
  if (firstName.length > 0 && firstName.length < 2) {
    errors.push('validation.firstName.min_length');
  }
  if (firstName.length > 64) {
    errors.push('validation.firstName.max_length');
  }
  return errors;
}

export function validateLastName(lastName: string) {
  const errors: string[] = [];
  if (lastName.length > 0 && lastName.length < 2) {
    errors.push('validation.lastName.min_length');
  }
  if (lastName.length > 64) {
    errors.push('validation.lastName.max_length');
  }
  return errors;
}

// Helper function to translate validation error keys
export function translateValidationErrors(
  errors: string[],
  translator: (key: string) => string
): string[] {
  return errors.map((key) => translator(key));
}






