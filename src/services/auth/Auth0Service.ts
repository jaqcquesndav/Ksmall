import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import * as Random from 'expo-random';
import { jwtDecode } from 'jwt-decode';
import {
  AUTH0_DOMAIN,
  AUTH0_CLIENT_ID,
  AUTH0_REDIRECT_URI,
  AUTH0_AUDIENCE,
  AUTH0_SCOPE,
  AUTH_API_ENDPOINT
} from '../../config/auth0';
import {
  saveAccessToken,
  saveRefreshToken,
  saveIdToken,
  saveUserInfo,
  saveTokenExpiry,
  getAccessToken,
  getRefreshToken,
  clearTokens
} from './TokenStorage';
import { User } from '../../types/auth';

// Define available social login providers
export enum SocialProvider {
  GOOGLE = 'google-oauth2',
  FACEBOOK = 'facebook',
}

// Register the AuthSession redirect URI for the Auth0 provider
WebBrowser.maybeCompleteAuthSession();

/**
 * Generate a cryptographically secure random string
 */
const generateRandomString = async (): Promise<string> => {
  const randomBytes = await Random.getRandomBytesAsync(32);
  return Array.from(randomBytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Generate a code verifier (for PKCE)
 */
const generateCodeVerifier = (): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let verifier = '';
  for (let i = 0; i < 64; i++) {
    verifier += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return verifier;
};

/**
 * Generate a code challenge from a verifier (for PKCE)
 */
const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier
  );
  return btoa(digest)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Auth0 authentication service
 */
class Auth0Service {
  private authEndpoint: string;
  private tokenEndpoint: string;
  private userInfoEndpoint: string;

  constructor() {
    this.authEndpoint = `https://${AUTH0_DOMAIN}/authorize`;
    this.tokenEndpoint = `https://${AUTH0_DOMAIN}/oauth/token`;
    this.userInfoEndpoint = `https://${AUTH0_DOMAIN}/userinfo`;
  }

  /**
   * Login with Auth0
   * @param useSignUpFlow - Whether to use the sign up flow
   * @param socialProvider - Optional social provider to use for login
   */
  async login(useSignUpFlow = false, socialProvider?: SocialProvider): Promise<User | null> {
    try {
      // Generate the PKCE challenge verifier
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Create the AuthRequest
      const request = new AuthSession.AuthRequest({
        clientId: AUTH0_CLIENT_ID,
        redirectUri: AUTH0_REDIRECT_URI,
        responseType: AuthSession.ResponseType.Code,
        codeChallenge,
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
        scopes: AUTH0_SCOPE.split(' '),
        extraParams: {
          audience: AUTH0_AUDIENCE
        }
      });

      // If we're using signup flow, add screen_hint
      if (useSignUpFlow) {
        request.extraParams.screen_hint = 'signup';
      }

      // If a social provider is specified, add connection parameter
      if (socialProvider) {
        request.extraParams.connection = socialProvider;
      }

      // Start the auth flow and wait for a response
      const result = await request.promptAsync({
        authorizationEndpoint: this.authEndpoint
      });

      if (result.type === 'success') {
        // Exchange the code for tokens
        const { code } = result.params;
        const exchangeResult = await this.exchangeCodeForTokens(code, codeVerifier);
        
        // Decode the ID token to get user information
        const decodedIdToken = jwtDecode<any>(exchangeResult.id_token);
        
        // Get additional user info if needed
        const userInfoResponse = await fetch(this.userInfoEndpoint, {
          headers: {
            Authorization: `Bearer ${exchangeResult.access_token}`
          }
        });
        
        const userInfo = await userInfoResponse.json();
        
        // Add provider info to user info
        const provider = this.determineProvider(userInfo);

        // Create user object that matches our application's user model
        const user: User = {
          uid: decodedIdToken.sub,
          email: userInfo.email,
          displayName: userInfo.name,
          photoURL: userInfo.picture,
          phoneNumber: userInfo.phone_number,
          emailVerified: userInfo.email_verified,
          isDemo: false,
          provider: provider
        };

        // Save tokens and user info securely
        await saveAccessToken(exchangeResult.access_token);
        await saveRefreshToken(exchangeResult.refresh_token);
        await saveIdToken(exchangeResult.id_token);
        await saveUserInfo(userInfo);
        
        // Calculate token expiry time
        const expiresAt = Date.now() + exchangeResult.expires_in * 1000;
        await saveTokenExpiry(expiresAt);

        return user;
      }
      
      return null;
    } catch (error) {
      console.error('Auth0 login error:', error);
      throw error;
    }
  }

  /**
   * Login with Google
   */
  async loginWithGoogle(): Promise<User | null> {
    return this.login(false, SocialProvider.GOOGLE);
  }

  /**
   * Register with Google
   */
  async registerWithGoogle(): Promise<User | null> {
    return this.login(true, SocialProvider.GOOGLE);
  }

  /**
   * Login with Facebook
   */
  async loginWithFacebook(): Promise<User | null> {
    return this.login(false, SocialProvider.FACEBOOK);
  }

  /**
   * Register with Facebook
   */
  async registerWithFacebook(): Promise<User | null> {
    return this.login(true, SocialProvider.FACEBOOK);
  }
  
  /**
   * Determine the provider from user info
   */
  private determineProvider(userInfo: any): string {
    if (userInfo.sub) {
      // Check if sub contains provider information
      if (userInfo.sub.includes('google')) {
        return 'google';
      } else if (userInfo.sub.includes('facebook')) {
        return 'facebook';
      } else if (userInfo.sub.includes('auth0')) {
        return 'auth0';
      }
    }
    
    // Check identity providers list if available
    if (userInfo.identities && userInfo.identities.length > 0) {
      return userInfo.identities[0].provider;
    }
    
    return 'email'; // Default to email/password
  }

  /**
   * Exchange auth code for tokens
   */
  private async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<any> {
    try {
      const tokenResponse = await fetch(this.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: AUTH0_CLIENT_ID,
          code_verifier: codeVerifier,
          code,
          redirect_uri: AUTH0_REDIRECT_URI
        })
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${tokenResponse.status}`);
      }

      return await tokenResponse.json();
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        console.error('No refresh token available');
        return null;
      }

      const response = await fetch(this.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: AUTH0_CLIENT_ID,
          refresh_token: refreshToken
        })
      });

      if (!response.ok) {
        throw new Error(`Refresh token failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Save the new access token
      await saveAccessToken(data.access_token);
      
      // Update the expiry time
      const expiresAt = Date.now() + data.expires_in * 1000;
      await saveTokenExpiry(expiresAt);

      // If a new refresh token was provided, save it
      if (data.refresh_token) {
        await saveRefreshToken(data.refresh_token);
      }

      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Logout from Auth0
   */
  async logout(): Promise<void> {
    try {
      // Clear tokens from secure storage
      await clearTokens();

      // Optionally perform federated logout by opening a browser
      // This is necessary for certain identity providers that use sessions
      const returnTo = encodeURIComponent(AUTH0_REDIRECT_URI);
      const logoutUrl = `https://${AUTH0_DOMAIN}/v2/logout?client_id=${AUTH0_CLIENT_ID}&returnTo=${returnTo}`;
      
      await WebBrowser.openAuthSessionAsync(logoutUrl, 'ksmall://');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }

  /**
   * Send a forgot password email
   */
  async forgotPassword(email: string): Promise<boolean> {
    try {
      const response = await fetch(`https://${AUTH0_DOMAIN}/dbconnections/change_password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: AUTH0_CLIENT_ID,
          email,
          connection: 'Username-Password-Authentication' // Adjust this to your actual connection name
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Register a new user with Auth0 directly (alternative to using screen_hint)
   * This method can be used if your Auth0 customization needs specific registration handling
   */
  async registerDirectly(email: string, password: string, displayName: string): Promise<User | null> {
    try {
      // Contact your Auth microservice endpoint to register the user
      const response = await fetch(`${AUTH_API_ENDPOINT}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: AUTH0_CLIENT_ID,
          email,
          password,
          name: displayName,
          connection: 'Username-Password-Authentication'
        })
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.status}`);
      }

      // After successful registration, login automatically
      return this.login(false);
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  }
}

export default new Auth0Service();