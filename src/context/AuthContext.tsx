import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DashboardAccountingService from '../services/DashboardAccountingService';
import { setDemoMode } from '../services/auth/AuthStorage';
import Auth0Service from '../services/auth/Auth0Service';
import { 
  getUserInfo, 
  hasValidTokens, 
  clearTokens, 
  setOfflineMode as setTokenOfflineMode 
} from '../services/auth/TokenStorage';
import { authApi } from '../services/api/ApiClient';
import { useNetInfo } from '@react-native-community/netinfo';
import logger from '../utils/logger';
import { AxiosResponse } from 'axios';

// Interface pour les réponses API
interface ApiResponse {
  [key: string]: any;
}

// Interface pour les données utilisateur de l'API
interface ApiUserProfile {
  sub?: string;
  id?: string;
  email?: string;
  name?: string;
  displayName?: string;
  picture?: string;
  photoURL?: string;
  phone_number?: string;
  phoneNumber?: string;
  email_verified?: boolean;
  emailVerified?: boolean;
  company?: string;
  role?: string;
  position?: string;
  language?: string;
  locale?: string;
  [key: string]: any;
}

// Interface pour les réponses d'authentification
interface AuthResponse extends ApiResponse {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  user?: ApiUserProfile;
  [key: string]: any;
}

interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  phoneNumber: string | null;
  emailVerified: boolean;
  company?: string;
  role?: string;
  position?: string;
  language?: string;
  isDemo: boolean;
  provider?: string; // Ajouté pour le suivi de la connexion sociale
  [key: string]: string | boolean | null | undefined;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  demoLogin: () => Promise<void>;
  verifyTwoFactorCode: (code: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  registerWithGoogle: () => Promise<void>;
  registerWithFacebook: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
  demoLogin: async () => {},
  verifyTwoFactorCode: async () => {},
  loginWithGoogle: async () => {},
  loginWithFacebook: async () => {},
  registerWithGoogle: async () => {},
  registerWithFacebook: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const netInfo = useNetInfo();
  
  // Vérifier la connectivité et définir le mode hors ligne
  useEffect(() => {
    const updateOfflineStatus = async () => {
      await setTokenOfflineMode(netInfo.isConnected === false);
    };
    
    updateOfflineStatus();
  }, [netInfo.isConnected]);

  useEffect(() => {
    logger.info("🔐 Auth state changed:", user ? `User logged in: ${user.email}` : "No user logged in");
  }, [user]);

  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        logger.info("🔄 Checking existing auth session...");
        // Vérifier si un token valide existe
        const isAuthenticated = await hasValidTokens();
        
        if (isAuthenticated) {
          // Récupérer les informations utilisateur depuis le stockage sécurisé
          const userInfo = await getUserInfo();
          if (userInfo) {
            // Créer un objet utilisateur correspondant au modèle de notre application
            setUser({
              uid: userInfo.sub,
              email: userInfo.email,
              displayName: userInfo.name || userInfo.email?.split('@')[0] || 'User',
              photoURL: userInfo.picture,
              phoneNumber: userInfo.phone_number || null,
              emailVerified: userInfo.email_verified || false,
              company: userInfo.company,
              role: userInfo['https://ksmall.app/roles'] || userInfo.role,
              position: userInfo.position,
              language: userInfo.locale || 'fr',
              isDemo: false
            });
            logger.info("✅ Restored authentication session");
          }
        } else {
          // Vérifier s'il y a des identifiants sauvegardés pour le mode hors ligne
          try {
            const savedCredentialsJson = await AsyncStorage.getItem('saved_credentials');
            
            if (savedCredentialsJson && netInfo.isConnected === false) {
              const savedCredentials = JSON.parse(savedCredentialsJson);
              logger.info("📱 Offline mode detected with saved credentials");
              
              // Si c'est le compte de démonstration, utiliser le mode démo
              if (savedCredentials.email === 'jacquesndav@gmail.com' && savedCredentials.password === 'root12345') {
                await demoLogin();
              } else {
                // Créer un objet utilisateur de base pour le mode hors ligne
                setUser({
                  uid: `offline-${Date.now()}`,
                  email: savedCredentials.email,
                  displayName: savedCredentials.email.split('@')[0],
                  photoURL: null,
                  phoneNumber: null,
                  emailVerified: false,
                  isDemo: false
                });
              }
            }
          } catch (offlineError) {
            logger.error('❌ Error checking offline credentials:', offlineError);
          }
        }
      } catch (error) {
        logger.error('❌ Auth check failed:', error);
      } finally {
        logger.info("✅ Auth initialization complete, loading:", loading);
        setLoading(false);
      }
    };

    checkExistingAuth();
  }, []);

  const login = async (email: string, password: string) => {
    logger.info("🔑 Login process started");
    setLoading(true);
    try {
      // Gérer le compte de démonstration séparément
      if (email.trim() === 'jacquesndav@gmail.com' && password === 'root12345') {
        return demoLogin();
      }
      
      // Si hors ligne, vérifier les identifiants sauvegardés
      if (netInfo.isConnected === false) {
        const savedCredentialsJson = await AsyncStorage.getItem('saved_credentials');
        if (savedCredentialsJson) {
          const savedCredentials = JSON.parse(savedCredentialsJson);
          if (savedCredentials.email === email && savedCredentials.password === password) {
            setUser({
              uid: `offline-${Date.now()}`,
              email: email,
              displayName: email.split('@')[0],
              isDemo: false,
              phoneNumber: null,
              photoURL: null,
              emailVerified: false
            });
            logger.info("✅ Offline login successful with saved credentials");
            return;
          } else {
            throw new Error('Invalid credentials for offline mode');
          }
        } else {
          throw new Error('No saved credentials available for offline login');
        }
      }
      
      // Mode en ligne - authentification avec Auth0
      try {
        // Se connecter avec Auth0
        const auth0User = await Auth0Service.login(email, password);
        
        if (auth0User) {
          // Définir l'état utilisateur
          setUser(auth0User);
          
          // Enregistrer les identifiants pour une utilisation hors ligne
          await AsyncStorage.setItem('saved_credentials', JSON.stringify({
            email: email,
            password: password
          }));
          
          // S'assurer que le mode démo est désactivé
          await setDemoMode(false);
          DashboardAccountingService.setDemoMode(false);
          
          logger.info("✅ Auth0 login successful");
        } else {
          throw new Error('Login failed');
        }
      } catch (auth0Error: any) {
        logger.error('❌ Auth0 login failed:', auth0Error);
        
        // Essayer de se connecter via l'API si Auth0 échoue
        try {
          const response = await authApi.post<AuthResponse>('/login', { email, password }, { 
            // On utilise as any pour contourner le problème de typage
            requiresAuth: false 
          } as any);
          
          const loginResponse = response as AuthResponse;
          
          if (loginResponse && loginResponse.access_token) {
            // Succès de la connexion avec l'API directe
            
            // Récupérer le profil utilisateur
            const response = await authApi.get<ApiUserProfile>('/profile');
            const userProfile = response as ApiUserProfile;
            
            // Définir l'état utilisateur
            setUser({
              uid: userProfile.sub || userProfile.id || '',
              email: userProfile.email || '',
              displayName: userProfile.name || userProfile.displayName || email.split('@')[0],
              photoURL: userProfile.picture || userProfile.photoURL || null,
              phoneNumber: userProfile.phone_number || userProfile.phoneNumber || null,
              emailVerified: userProfile.email_verified || userProfile.emailVerified || false,
              company: userProfile.company,
              role: userProfile.role,
              isDemo: false
            });
            
            // Enregistrer les identifiants pour une utilisation hors ligne
            await AsyncStorage.setItem('saved_credentials', JSON.stringify({
              email: email,
              password: password
            }));
            
            logger.info("✅ API login successful");
          } else {
            throw new Error('API login failed');
          }
        } catch (apiError) {
          logger.error('API login failed:', apiError);
          throw auth0Error; // Renvoyer l'erreur originale de Auth0
        }
      }
    } catch (error: any) {
      logger.error('❌ Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      // Vérifier la connectivité
      if (netInfo.isConnected === false) {
        throw new Error('Internet connection required for registration');
      }
      
      // Essayer de s'enregistrer avec Auth0
      try {
        const auth0User = await Auth0Service.register(email, password, displayName);
        
        if (auth0User) {
          // Définir l'état utilisateur
          setUser(auth0User);
          
          // Enregistrer les identifiants pour une utilisation hors ligne
          await AsyncStorage.setItem('saved_credentials', JSON.stringify({
            email: email,
            password: password
          }));
          
          // S'assurer que le mode démo est désactivé
          await setDemoMode(false);
          DashboardAccountingService.setDemoMode(false);
          
          logger.info("✅ Auth0 registration successful");
        } else {
          throw new Error('Registration failed');
        }
      } catch (auth0Error) {
        logger.error('Auth0 registration failed, trying API fallback:', auth0Error);
        
        // Si l'enregistrement Auth0 échoue, essayer l'API
        try {
          const response = await authApi.post<AuthResponse>('/register', {
            email,
            password,
            displayName,
          }, { 
            // On utilise as any pour contourner le problème de typage
            requiresAuth: false 
          } as any);
          
          const registerResponse = response as AuthResponse;
          
          if (registerResponse && registerResponse.user) {
            const userData = registerResponse.user;
            
            // Définir l'état utilisateur à partir de la réponse de l'API
            setUser({
              uid: userData.id || userData.sub || '',
              email: userData.email || '',
              displayName: userData.displayName || userData.name || displayName,
              photoURL: userData.photoURL || userData.picture || null,
              phoneNumber: userData.phoneNumber || userData.phone_number || null,
              emailVerified: userData.emailVerified || userData.email_verified || false,
              isDemo: false
            });
            
            // Enregistrer les identifiants pour une utilisation hors ligne
            await AsyncStorage.setItem('saved_credentials', JSON.stringify({
              email: email,
              password: password
            }));
            
            logger.info("✅ API registration successful");
          } else {
            throw new Error('API registration failed');
          }
        } catch (apiError) {
          logger.error('API registration also failed:', apiError);
          throw auth0Error; // Renvoyer l'erreur originale de Auth0
        }
      }
    } catch (error) {
      logger.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      logger.info('Logout attempt');
      
      // Si nous sommes en mode démo, effacer simplement l'état
      if (user?.isDemo) {
        await AsyncStorage.clear();
        await clearTokens();
        setUser(null);
        await setDemoMode(false);
        DashboardAccountingService.setDemoMode(false);
        return;
      }
      
      // Si nous sommes en ligne, essayer de se déconnecter d'Auth0
      if (netInfo.isConnected !== false) {
        try {
          // Essayer de se déconnecter via Auth0
          await Auth0Service.logout();
        } catch (error) {
          logger.error('Online logout had errors:', error);
          // Continuer avec la déconnexion locale même si la déconnexion en ligne échoue
        }
      }
      
      // Toujours effacer le stockage local et l'état
      await AsyncStorage.clear();
      await clearTokens();
      setUser(null);
    } catch (error: any) {
      logger.error('Logout failed:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      // Vérifier la connectivité
      if (netInfo.isConnected === false) {
        throw new Error('Internet connection required to reset password');
      }
      
      // Essayer à la fois l'API et Auth0 pour la réinitialisation du mot de passe
      try {
        const success = await Auth0Service.forgotPassword(email);
        if (!success) {
          throw new Error('Failed to send password reset email via Auth0');
        }
        logger.info('Password reset email sent via Auth0');
      } catch (auth0Error) {
        // Replier sur la réinitialisation du mot de passe de l'API
        try {
          await authApi.post<ApiResponse>('/forgot-password', { email }, { 
            // On utilise as any pour contourner le problème de typage
            requiresAuth: false 
          } as any);
          logger.info('Password reset email sent via API');
        } catch (apiError) {
          logger.error('All password reset methods failed:', apiError);
          throw new Error('Failed to send password reset email');
        }
      }
    } catch (error: any) {
      logger.error('Password reset failed:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      setLoading(true);
      
      // Si nous sommes en ligne, mettre à jour le profil via l'API
      if (netInfo.isConnected !== false && !user?.isDemo) {
        try {
          const response = await authApi.patch<ApiUserProfile>('/profile', data);
          const updatedProfile = response as ApiUserProfile;
          
          // Mettre à jour l'état utilisateur local avec la réponse de l'API
          if (user && updatedProfile) {
            // Créer un nouvel objet utilisateur avec les données mises à jour
            const updatedUser: User = {
              ...user,
              ...(updatedProfile as any),
              // S'assurer que les champs spécifiques sont correctement mappés
              displayName: updatedProfile.name || updatedProfile.displayName || user.displayName,
              photoURL: updatedProfile.picture || updatedProfile.photoURL || user.photoURL,
              phoneNumber: updatedProfile.phone_number || updatedProfile.phoneNumber || user.phoneNumber,
              emailVerified: updatedProfile.email_verified || updatedProfile.emailVerified || user.emailVerified
            };
            setUser(updatedUser);
          }
          logger.info('Profile updated via API');
        } catch (apiError) {
          logger.error('Failed to update profile via API:', apiError);
          // Replier sur la mise à jour locale uniquement
          setUser(prev => prev ? { ...prev, ...data } : null);
        }
      } else {
        // Mode hors ligne ou mode démo - mettre à jour uniquement l'état local
        logger.info('Offline/demo profile update - local only');
        setUser(prev => prev ? { ...prev, ...data } : null);
      }
    } catch (error) {
      logger.error('Error updating profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async () => {
    setLoading(true);
    try {
      const demoUser = {
        uid: 'demo-user-123',
        email: 'jacquesndav@gmail.com',
        displayName: 'Jacques Ndavaro',
        photoURL: null,
        phoneNumber: '+243987654321',
        company: 'KSMall Demo',
        role: 'Admin',
        isDemo: true,
        emailVerified: false
      };
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(demoUser);
      // Activer le mode démo pour les transactions
      await setDemoMode(true);
      DashboardAccountingService.setDemoMode(true);
      logger.info("🎉 Demo account login complete");
    } catch (error: any) {
      logger.error('Demo login failed:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyTwoFactorCode = async (code: string): Promise<void> => {
    try {
      logger.info(`Verifying 2FA code: ${code}`);
      
      // Si nous sommes en ligne et pas en mode démo
      if (netInfo.isConnected !== false && !user?.isDemo) {
        try {
          // Verifier via Auth0
          // Note: nous avons besoin du mfaToken, qui devrait avoir été stocké après la tentative de connexion
          const mfaToken = await AsyncStorage.getItem('mfa_token');
          if (!mfaToken) {
            throw new Error('No MFA token available');
          }
          
          await Auth0Service.verifyTwoFactorCode(code, mfaToken);
          logger.info('2FA verification successful via Auth0');
        } catch (auth0Error) {
          logger.error('Auth0 2FA verification failed:', auth0Error);
          
          // Essayer via l'API comme secours
          try {
            await authApi.post<ApiResponse>('/verify-2fa', { code });
            logger.info('2FA verification successful via API');
          } catch (apiError) {
            logger.error('2FA API verification failed:', apiError);
            throw new Error('Invalid verification code');
          }
        }
      } else if (code !== '123456') {
        // Code 2FA mode démo/hors ligne
        throw new Error('Invalid verification code');
      }
    } catch (error) {
      logger.error('2FA verification failed:', error);
      throw error;
    }
  };

  /**
   * Connexion avec Google
   */
  const loginWithGoogle = async (): Promise<void> => {
    setLoading(true);
    try {
      // Si hors ligne, lancer une erreur car la connexion sociale nécessite Internet
      if (netInfo.isConnected === false) {
        throw new Error('Internet connection required for Google login');
      }
      
      logger.info("🔑 Google login process started");
      
      // Essayer la connexion Google Auth0
      const googleUser = await Auth0Service.loginWithGoogle();
      
      if (googleUser) {
        setUser(googleUser);
        
        // S'assurer que le mode démo est désactivé
        await setDemoMode(false);
        DashboardAccountingService.setDemoMode(false);
        
        logger.info("✅ Google login successful");
      } else {
        throw new Error('Google login failed');
      }
    } catch (error: any) {
      logger.error('❌ Google login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Connexion avec Facebook
   */
  const loginWithFacebook = async (): Promise<void> => {
    setLoading(true);
    try {
      // Si hors ligne, lancer une erreur car la connexion sociale nécessite Internet
      if (netInfo.isConnected === false) {
        throw new Error('Internet connection required for Facebook login');
      }
      
      logger.info("🔑 Facebook login process started");
      
      // Essayer la connexion Facebook Auth0
      const facebookUser = await Auth0Service.loginWithFacebook();
      
      if (facebookUser) {
        setUser(facebookUser);
        
        // S'assurer que le mode démo est désactivé
        await setDemoMode(false);
        DashboardAccountingService.setDemoMode(false);
        
        logger.info("✅ Facebook login successful");
      } else {
        throw new Error('Facebook login failed');
      }
    } catch (error: any) {
      logger.error('❌ Facebook login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Inscription avec Google
   */
  const registerWithGoogle = async (): Promise<void> => {
    setLoading(true);
    try {
      // Si hors ligne, lancer une erreur car l'inscription sociale nécessite Internet
      if (netInfo.isConnected === false) {
        throw new Error('Internet connection required for Google registration');
      }
      
      logger.info("🔑 Google registration process started");
      
      // Essayer l'inscription Google Auth0
      const googleUser = await Auth0Service.registerWithGoogle();
      
      if (googleUser) {
        setUser(googleUser);
        
        // S'assurer que le mode démo est désactivé
        await setDemoMode(false);
        DashboardAccountingService.setDemoMode(false);
        
        logger.info("✅ Google registration successful");
      } else {
        throw new Error('Google registration failed');
      }
    } catch (error: any) {
      logger.error('❌ Google registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Inscription avec Facebook
   */
  const registerWithFacebook = async (): Promise<void> => {
    setLoading(true);
    try {
      // Si hors ligne, lancer une erreur car l'inscription sociale nécessite Internet
      if (netInfo.isConnected === false) {
        throw new Error('Internet connection required for Facebook registration');
      }
      
      logger.info("🔑 Facebook registration process started");
      
      // Essayer l'inscription Facebook Auth0
      const facebookUser = await Auth0Service.registerWithFacebook();
      
      if (facebookUser) {
        setUser(facebookUser);
        
        // S'assurer que le mode démo est désactivé
        await setDemoMode(false);
        DashboardAccountingService.setDemoMode(false);
        
        logger.info("✅ Facebook registration successful");
      } else {
        throw new Error('Facebook registration failed');
      }
    } catch (error: any) {
      logger.error('❌ Facebook registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    demoLogin,
    verifyTwoFactorCode,
    loginWithGoogle,
    loginWithFacebook,
    registerWithGoogle,
    registerWithFacebook
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
