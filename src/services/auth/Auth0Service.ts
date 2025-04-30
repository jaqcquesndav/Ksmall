import Auth0, { Credentials } from 'react-native-auth0';
import { auth0Config, AUTH0_SCOPE } from '../../config/auth0';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../types/auth';
import logger from '../../utils/logger';
import { STORAGE_KEYS } from '../../config/constants';

// Définir interface pour UserInfo car elle n'est pas exportée par react-native-auth0
interface UserInfo {
  sub?: string;
  name?: string;
  nickname?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
  phone_number?: string;
  locale?: string;
  company?: string;
  position?: string;
  role?: string;
  [key: string]: any;
}

// Initialiser l'instance Auth0
const auth0 = new Auth0({
  domain: auth0Config.domain,
  clientId: auth0Config.clientId
});

/**
 * Clés de stockage pour AsyncStorage
 */
const KEYS = {
  ACCESS_TOKEN: STORAGE_KEYS.AUTH_TOKEN,
  REFRESH_TOKEN: STORAGE_KEYS.REFRESH_TOKEN,
  USER_INFO: STORAGE_KEYS.USER_INFO,
  ID_TOKEN: 'auth0_id_token',
  EXPIRES_AT: 'auth0_expires_at',
  OFFLINE_MODE: STORAGE_KEYS.OFFLINE_MODE
};

/**
 * Service d'authentification Auth0
 */
class Auth0Service {
  /**
   * Login avec email et mot de passe
   */
  async login(email: string, password: string): Promise<User | null> {
    try {
      // Authentifier l'utilisateur avec Auth0
      const credentials: Credentials = await auth0.auth.passwordRealm({
        username: email,
        password,
        realm: 'Username-Password-Authentication',
        scope: AUTH0_SCOPE,
        audience: auth0Config.audience
      });
      
      if (!credentials || !credentials.accessToken) {
        throw new Error('No credentials returned from Auth0');
      }

      // Récupérer les informations utilisateur
      const userInfo = await this.getUserInfo(credentials.accessToken);
      
      // Sauvegarder les tokens
      await this.saveCredentials(credentials);
      
      // Créer et retourner l'objet utilisateur
      return this.createUserObject(userInfo, credentials);
    } catch (error) {
      logger.error('Auth0 login error:', error);
      throw error;
    }
  }

  /**
   * Login avec Google
   */
  async loginWithGoogle(): Promise<User | null> {
    try {
      const credentials = await auth0.webAuth.authorize({
        scope: AUTH0_SCOPE,
        audience: auth0Config.audience,
        connection: 'google-oauth2'
      });
      
      if (!credentials || !credentials.accessToken) {
        throw new Error('No credentials returned from Google Auth');
      }

      // Récupérer les informations utilisateur
      const userInfo = await this.getUserInfo(credentials.accessToken);
      
      // Sauvegarder les tokens
      await this.saveCredentials(credentials);
      
      // Créer et retourner l'objet utilisateur
      return this.createUserObject(userInfo, credentials);
    } catch (error) {
      logger.error('Google login error:', error);
      throw error;
    }
  }

  /**
   * Login avec Facebook
   */
  async loginWithFacebook(): Promise<User | null> {
    try {
      const credentials = await auth0.webAuth.authorize({
        scope: AUTH0_SCOPE,
        audience: auth0Config.audience,
        connection: 'facebook'
      });
      
      if (!credentials || !credentials.accessToken) {
        throw new Error('No credentials returned from Facebook Auth');
      }

      // Récupérer les informations utilisateur
      const userInfo = await this.getUserInfo(credentials.accessToken);
      
      // Sauvegarder les tokens
      await this.saveCredentials(credentials);
      
      // Créer et retourner l'objet utilisateur
      return this.createUserObject(userInfo, credentials);
    } catch (error) {
      logger.error('Facebook login error:', error);
      throw error;
    }
  }

  /**
   * Inscription avec email et mot de passe
   */
  async register(email: string, password: string, name: string): Promise<User | null> {
    try {
      // Créer l'utilisateur dans Auth0
      await auth0.auth.createUser({
        email,
        password,
        connection: 'Username-Password-Authentication',
        metadata: { name }
      });
      
      // Se connecter avec les identifiants nouvellement créés
      return this.login(email, password);
    } catch (error) {
      logger.error('Auth0 registration error:', error);
      throw error;
    }
  }

  /**
   * Inscription avec Google
   */
  async registerWithGoogle(): Promise<User | null> {
    // Pour Auth0, l'inscription avec un fournisseur social est identique au login
    return this.loginWithGoogle();
  }

  /**
   * Inscription avec Facebook
   */
  async registerWithFacebook(): Promise<User | null> {
    // Pour Auth0, l'inscription avec un fournisseur social est identique au login
    return this.loginWithFacebook();
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      // Récupérer le refresh token pour la déconnexion
      const refreshToken = await AsyncStorage.getItem(KEYS.REFRESH_TOKEN);
      
      // Si disponible, utilisez-le pour la déconnexion complète
      if (refreshToken) {
        await auth0.webAuth.clearSession();
      }
      
      // Nettoyage des tokens stockés localement
      await this.clearTokens();
    } catch (error) {
      logger.error('Auth0 logout error:', error);
      
      // Même en cas d'erreur, essayez de nettoyer les tokens locaux
      await this.clearTokens();
      throw error;
    }
  }

  /**
   * Mot de passe oublié
   */
  async forgotPassword(email: string): Promise<boolean> {
    try {
      await auth0.auth.resetPassword({
        email,
        connection: 'Username-Password-Authentication'
      });
      return true;
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Rafraîchir le token
   */
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem(KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const newCredentials = await auth0.auth.refreshToken({
        refreshToken
      });
      
      // Sauvegarder les nouveaux tokens
      await this.saveCredentials(newCredentials);
      
      return newCredentials.accessToken;
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Vérifier si un token d'accès existe et est valide
      const accessToken = await AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
      
      if (!accessToken) {
        return false;
      }
      
      // Vérifier l'expiration
      const expiresAtStr = await AsyncStorage.getItem(KEYS.EXPIRES_AT);
      const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;
      
      // Si le token a expiré, tenter de le rafraîchir
      if (Date.now() >= expiresAt - 60000) { // 1 minute de marge
        try {
          // Tenter de rafraîchir le token
          const newAccessToken = await this.refreshToken();
          return !!newAccessToken;
        } catch (refreshError) {
          logger.warn('Failed to refresh token:', refreshError);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Check authentication status error:', error);
      return false;
    }
  }
  
  /**
   * Récupérer les informations utilisateur
   */
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    try {
      const userInfo = await auth0.auth.userInfo({ token: accessToken });
      return userInfo as UserInfo;
    } catch (error) {
      logger.error('Get user info error:', error);
      throw error;
    }
  }
  
  /**
   * Récupérer les informations de l'utilisateur actuellement connecté
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const accessToken = await AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
      
      if (!accessToken) {
        return null;
      }
      
      const userInfo = await this.getUserInfo(accessToken);
      const userJson = await AsyncStorage.getItem(KEYS.USER_INFO);
      const savedCredentials = userJson ? JSON.parse(userJson) : {};
      
      return this.createUserObject(userInfo, savedCredentials);
    } catch (error) {
      logger.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Changer le mot de passe 
   */
  async changePassword(email: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Vérifier l'authentification avec le mot de passe actuel
      try {
        await this.login(email, currentPassword);
      } catch (loginError) {
        logger.error('Current password verification failed:', loginError);
        throw new Error('Current password is incorrect');
      }

      // Changer le mot de passe - utiliser resetPassword car changePassword n'existe pas
      await auth0.auth.resetPassword({
        email,
        password: newPassword,
        connection: 'Username-Password-Authentication'
      });
      
      return true;
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Vérifier le code 2FA
   */
  async verifyTwoFactorCode(code: string, mfaToken: string): Promise<Credentials> {
    try {
      // Utiliser loginWithOTP au lieu de loginWithOtp (différence de casse)
      const credentials = await auth0.auth.loginWithOTP({
        otp: code,
        mfaToken
      });
      
      // Sauvegarder les tokens
      await this.saveCredentials(credentials);
      
      return credentials;
    } catch (error) {
      logger.error('2FA verification error:', error);
      throw error;
    }
  }

  // ===== MÉTHODES PRIVÉES =====

  /**
   * Sauvegarder les informations d'identification
   */
  private async saveCredentials(credentials: Credentials): Promise<void> {
    try {
      if (credentials.accessToken) {
        await AsyncStorage.setItem(KEYS.ACCESS_TOKEN, credentials.accessToken);
      }
      
      if (credentials.refreshToken) {
        await AsyncStorage.setItem(KEYS.REFRESH_TOKEN, credentials.refreshToken);
      }
      
      if (credentials.idToken) {
        await AsyncStorage.setItem(KEYS.ID_TOKEN, credentials.idToken);
      }
      
      if (credentials.expiresIn) {
        const expiresAt = Date.now() + credentials.expiresIn * 1000;
        await AsyncStorage.setItem(KEYS.EXPIRES_AT, expiresAt.toString());
      }
    } catch (error) {
      logger.error('Save credentials error:', error);
      throw error;
    }
  }

  /**
   * Effacer tous les tokens
   */
  private async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        KEYS.ACCESS_TOKEN,
        KEYS.REFRESH_TOKEN,
        KEYS.ID_TOKEN,
        KEYS.USER_INFO,
        KEYS.EXPIRES_AT
      ]);
    } catch (error) {
      logger.error('Clear tokens error:', error);
      throw error;
    }
  }

  /**
   * Créer un objet utilisateur à partir des informations Auth0
   */
  private createUserObject(userInfo: UserInfo, credentials: any): User {
    // Déterminer le fournisseur (Auth0, Google, Facebook, etc.)
    let provider = 'auth0';
    if (userInfo.sub) {
      const parts = userInfo.sub.split('|');
      if (parts.length > 1) {
        provider = parts[0];
      }
    }

    return {
      uid: userInfo.sub || '',
      email: userInfo.email || '',
      displayName: userInfo.name || userInfo.nickname || userInfo.email?.split('@')[0] || '',
      photoURL: userInfo.picture || null,
      phoneNumber: userInfo.phone_number || null,
      emailVerified: userInfo.email_verified || false,
      company: userInfo.company,
      role: userInfo['https://ksmall.app/roles'] || userInfo.role,
      position: userInfo.position,
      language: userInfo.locale || 'fr',
      isDemo: false,
      provider
    };
  }
}

export default new Auth0Service();