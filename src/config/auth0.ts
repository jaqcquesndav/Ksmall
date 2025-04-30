/**
 * Auth0 configuration pour l'application KSmall
 * Ces valeurs sont maintenant chargées depuis le fichier .env
 */
import { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_AUDIENCE, AUTH_API_ENDPOINT } from '@env';

// L'URI de redirection pour votre application React Native
export const AUTH0_REDIRECT_URI = 'ksmall://auth0/callback';

// Scopes Auth0 - quelles permissions demander
export const AUTH0_SCOPE = 'openid profile email offline_access';

// Schéma d'application pour le deep linking
export const APP_SCHEME = 'ksmall';