/**
 * API configuration
 */
export const API_BASE_URL = 'https://api.ksmall.com/v1';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT: '/auth/logout',
  UPDATE_PROFILE: '/auth/profile',
  FORGOT_PASSWORD: '/auth/forgot-password',
  TWO_FACTOR_AUTH: '/auth/2fa',
  
  // Financial data
  ACCOUNTS: '/financial/accounts',
  JOURNAL_ENTRIES: '/financial/journal-entries',
  TRANSACTIONS: '/financial/transactions',
  
  // AI
  AI_PROCESS_MESSAGE: '/ai/process',
  AI_VALIDATE_ENTRY: '/ai/validate',
  AI_GENERATE_REPORT: '/ai/report',
};

/**
 * Storage keys for AsyncStorage
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'ksmall_auth_token',
  REFRESH_TOKEN: 'ksmall_refresh_token',
  USER_INFO: 'ksmall_user_info',
  DEMO_MODE: 'ksmall_demo_mode',
  LANGUAGE: 'ksmall_language',
  THEME: 'ksmall_theme',
  NOTIFICATIONS_ENABLED: 'ksmall_notifications_enabled',
  OFFLINE_MODE: 'ksmall_offline_mode',
  LOW_DATA_MODE: 'ksmall_low_data_mode',
  ONBOARDING_COMPLETED: 'ksmall_onboarding_completed'
};

/**
 * App constants
 */
export const APP_CONSTANTS = {
  MAX_ATTACHMENTS: 5,
  MAX_FILE_SIZE_MB: 10,
  SUPPORTED_LANGUAGES: ['en', 'fr', 'es'],
  DEFAULT_LANGUAGE: 'fr',
  TOKEN_EXPIRY_DAYS: 7,
  PASSWORD_MIN_LENGTH: 8,
  MAX_LOGIN_ATTEMPTS: 5,
  MAX_PIN_ATTEMPTS: 3,
  AUTH_LOCK_DURATION_MINS: 30,
};
