/**
 * Auth0 configuration for the Ksmall application
 * These values should be moved to environment variables in production
 */

// Auth0 domain - replace with your actual Auth0 domain
export const AUTH0_DOMAIN = 'ksmall-dev.auth0.com';

// Auth0 client ID - replace with your actual client ID
export const AUTH0_CLIENT_ID = 'YOUR_AUTH0_CLIENT_ID';

// The redirect URI for your Expo app
export const AUTH0_REDIRECT_URI = 'ksmall://auth';

// Your API audience (identifier) - replace if needed
export const AUTH0_AUDIENCE = 'https://kiota-microservices-api';

// Auth0 scopes - what permissions to request
export const AUTH0_SCOPE = 'openid profile email offline_access';

// Application scheme for deep linking
export const APP_SCHEME = 'ksmall';

// Your microservice auth endpoint
export const AUTH_API_ENDPOINT = 'https://auth-api.kiota-suite.com';