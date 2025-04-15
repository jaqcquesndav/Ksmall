/**
 * Color constants for light and dark themes
 */

export const lightThemeColors = {
  primary: '#0066CC',
  secondary: '#0099FF',
  background: '#FFFFFF',
  card: '#F5F5F5',
  text: '#212121',
  border: '#E0E0E0',
  notification: '#FF4081',
  error: '#D32F2F',
  success: '#388E3C',
  warning: '#F57C00',
};

export const darkThemeColors = {
  primary: '#0099FF',
  secondary: '#00CCFF',
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  border: '#333333',
  notification: '#FF4081',
  error: '#F44336',
  success: '#4CAF50',
  warning: '#FFA000',
};

// Export a combined Colors object that can be imported as { Colors }
// Also export a default Colors object that matches the current theme (light for now)
export const Colors = {
  ...lightThemeColors, // Use light theme as default
  light: lightThemeColors,
  dark: darkThemeColors,
  // Additional colors for specific use cases
  successLight: '#C8E6C9',
  successDark: '#2E7D32',
  warningLight: '#FFECB3',
  warningDark: '#F57F17',
  errorLight: '#FFCDD2',
  errorDark: '#B71C1C',
};

// Default export for direct import
export default Colors;
