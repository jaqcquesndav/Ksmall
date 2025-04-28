import { authHttp } from '../HttpInterceptor';
import { User } from '../../../types/auth';
import { 
  saveAccessToken,
  saveRefreshToken,
  saveIdToken,
  saveUserInfo,
  saveTokenExpiry,
  clearTokens
} from '../../auth/TokenStorage';
import logger from '../../../utils/logger';

/**
 * Interface for the login request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Interface for the registration request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  phoneNumber?: string;
}

/**
 * Interface for the authentication response
 */
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  idToken?: string;
  expiresAt: number;
  // Ajout d'une signature d'index pour satisfaire la contrainte Record<string, unknown>
  [key: string]: unknown;
}

/**
 * Authentication API Service
 * Handles authentication operations with the Auth microservice
 */
class AuthApiService {
  /**
   * Login to the API
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await authHttp.post<AuthResponse>('/login', credentials, { requiresAuth: false });
      
      // Store tokens securely
      if (response?.token) {
        await saveAccessToken(response.token);
        await saveRefreshToken(response.refreshToken);
        if (response.idToken) {
          await saveIdToken(response.idToken);
        }
        await saveTokenExpiry(response.expiresAt);
        
        // Store user info
        if (response.user) {
          await saveUserInfo(response.user);
        }
      }
      
      return response;
    } catch (error) {
      logger.error('Login error', error);
      throw error;
    }
  }
  
  /**
   * Register a new user
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await authHttp.post<AuthResponse>('/register', userData, { requiresAuth: false });
      
      // Store tokens securely
      if (response?.token) {
        await saveAccessToken(response.token);
        await saveRefreshToken(response.refreshToken);
        if (response.idToken) {
          await saveIdToken(response.idToken);
        }
        await saveTokenExpiry(response.expiresAt);
        
        // Store user info
        if (response.user) {
          await saveUserInfo(response.user);
        }
      }
      
      return response;
    } catch (error) {
      logger.error('Registration error', error);
      throw error;
    }
  }
  
  /**
   * Request a password reset
   */
  async forgotPassword(email: string): Promise<boolean> {
    try {
      await authHttp.post('/forgot-password', { email }, { requiresAuth: false });
      return true;
    } catch (error) {
      logger.error('Forgot password error', error);
      throw error;
    }
  }
  
  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      await authHttp.post('/reset-password', { token, password: newPassword }, { requiresAuth: false });
      return true;
    } catch (error) {
      logger.error('Reset password error', error);
      throw error;
    }
  }
  
  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<boolean> {
    try {
      await authHttp.post('/verify-email', { token }, { requiresAuth: false });
      return true;
    } catch (error) {
      logger.error('Email verification error', error);
      throw error;
    }
  }
  
  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<User> {
    try {
      return await authHttp.get<User>('/me');
    } catch (error) {
      logger.error('Get current user error', error);
      throw error;
    }
  }
  
  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      return await authHttp.put<User>('/me', userData);
    } catch (error) {
      logger.error('Update profile error', error);
      throw error;
    }
  }
  
  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      await authHttp.post('/change-password', { currentPassword, newPassword });
      return true;
    } catch (error) {
      logger.error('Change password error', error);
      throw error;
    }
  }
  
  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      // Try to invalidate the token on the backend
      try {
        await authHttp.post('/logout', {});
      } catch (error) {
        // Continue with local logout if server-side logout fails
        logger.warn('Server-side logout failed', error);
      }
      
      // Clear local tokens
      await clearTokens();
    } catch (error) {
      logger.error('Logout error', error);
      throw error;
    }
  }
  
  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number }> {
    try {
      const response = await authHttp.post<{ accessToken: string; expiresAt: number }>(
        '/refresh-token',
        { refreshToken },
        { requiresAuth: false }
      );
      
      // Store the new access token
      await saveAccessToken(response.accessToken);
      await saveTokenExpiry(response.expiresAt);
      
      return response;
    } catch (error) {
      logger.error('Token refresh error', error);
      throw error;
    }
  }
  
  /**
   * Verify 2FA code
   */
  async verifyTwoFactorCode(code: string): Promise<boolean> {
    try {
      await authHttp.post('/verify-2fa', { code });
      return true;
    } catch (error) {
      logger.error('2FA verification error', error);
      throw error;
    }
  }
}

export default new AuthApiService();