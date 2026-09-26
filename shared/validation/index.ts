/**
 * Shared Validation Rules and Schemas
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isValidPassword(password: string): boolean {
  // Minimum 8 characters
  return typeof password === 'string' && password.length >= 8;
}

export function sanitizeText(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
