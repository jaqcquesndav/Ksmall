/**
 * Utility functions for generating and validating UUIDs
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a new UUID v4
 * @returns {string} A new UUID v4 string
 */
export const generateUUID = (): string => {
  return uuidv4();
};

/**
 * Validates if a string is a valid UUID
 * @param {string} uuid - The UUID string to validate
 * @returns {boolean} True if the string is a valid UUID, false otherwise
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Generates a short UUID (first 8 characters)
 * @returns {string} A shortened UUID
 */
export const generateShortUUID = (): string => {
  return uuidv4().substring(0, 8);
};