/**
 * Utility functions for form validation
 */

/**
 * Validates email format
 * @param email - Email to validate
 * @returns Whether the email is valid
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param password - Password to validate
 * @param minLength - Minimum length (default: 6)
 * @returns Whether the password is valid
 */
export const validatePassword = (password: string, minLength = 6): boolean => {
  return password.length >= minLength;
};

/**
 * Validates phone number format
 * @param phoneNumber - Phone number to validate
 * @returns Whether the phone number is valid
 */
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Basic validation - adjust for specific country format if needed
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phoneNumber);
};

/**
 * Validates required field
 * @param value - Field value
 * @returns Whether the field is not empty
 */
export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Validates numeric value
 * @param value - Value to validate
 * @returns Whether the value is numeric
 */
export const validateNumeric = (value: string): boolean => {
  const numericRegex = /^-?\d*(\.\d+)?$/;
  return numericRegex.test(value);
};

/**
 * Validates date format (YYYY-MM-DD)
 * @param date - Date string to validate
 * @returns Whether the date format is valid
 */
export const validateDateFormat = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const dateObj = new Date(date);
  return dateObj.toString() !== 'Invalid Date';
};
