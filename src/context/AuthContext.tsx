import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebase } from '../config/firebase';
import DashboardAccountingService from '../services/DashboardAccountingService';
import { setDemoMode } from '../services/auth/AuthStorage';
import Auth0Service from '../services/auth/Auth0Service';
import { getUserInfo, hasValidTokens, clearTokens, setOfflineMode as setTokenOfflineMode } from '../services/auth/TokenStorage';
import { authApi } from '../services/api/ApiClient';
import { useNetInfo } from '@react-native-community/netinfo';

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
  provider?: string; // Added for social login tracking
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
  
  // Check connectivity and set offline mode
  useEffect(() => {
    const updateOfflineStatus = async () => {
      await setTokenOfflineMode(netInfo.isConnected === false);
    };
    
    updateOfflineStatus();
  }, [netInfo.isConnected]);

  useEffect(() => {
    console.log("🔐 Auth state changed:", user ? `User logged in: ${user.email}` : "No user logged in");
  }, [user]);

  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        console.log("🔄 Checking existing auth session...");
        // Check for existing valid token
        const isAuthenticated = await hasValidTokens();
        
        if (isAuthenticated) {
          // Get user info from secure storage
          const userInfo = await getUserInfo();
          if (userInfo) {
            // Create a user object that matches our application's user model
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
            console.log("✅ Restored authentication session");
          }
        } else {
          // Check if there are saved credentials for offline mode
          try {
            const savedCredentialsJson = await AsyncStorage.getItem('saved_credentials');
            if (savedCredentialsJson && netInfo.isConnected === false) {
              const savedCredentials = JSON.parse(savedCredentialsJson);
              console.log("📱 Offline mode detected with saved credentials");
              
              // If it's the demo account, use demo mode
              if (savedCredentials.email === 'jacquesndav@gmail.com' && savedCredentials.password === 'root12345') {
                await demoLogin();
              } else {
                // Create a basic user object for offline mode
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
            console.error('❌ Error checking offline credentials:', offlineError);
          }
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
      } finally {
        console.log("✅ Auth initialization complete, loading:", loading);
        setLoading(false);
      }
    };

    checkExistingAuth();
  }, []);

  const login = async (email: string, password: string) => {
    console.log("🔑 Login process started");
    setLoading(true);
    try {
      // Handle demo account separately
      if (email.trim() === 'jacquesndav@gmail.com' && password === 'root12345') {
        return demoLogin();
      }
      
      // If offline, check saved credentials
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
            console.log("✅ Offline login successful with saved credentials");
            return;
          } else {
            throw new Error('Invalid credentials for offline mode');
          }
        } else {
          throw new Error('No saved credentials available for offline login');
        }
      }
      
      // Online mode - authenticate with NestJS Auth microservice
      try {
        // Try direct API login first (our own UI)
        const loginResponse = await authApi.post('/login', { email, password }, { requiresAuth: false });
        
        if (loginResponse && loginResponse.access_token) {
          // Login successful with direct API
          
          // Store tokens securely
          // (This would be done in the ApiService implementation)
          
          // Get user profile from the token or user info endpoint
          const userProfile = await authApi.get('/profile');
          
          // Set user state
          setUser({
            uid: userProfile.sub || userProfile.id,
            email: userProfile.email,
            displayName: userProfile.name || email.split('@')[0],
            photoURL: userProfile.picture,
            phoneNumber: userProfile.phone_number,
            emailVerified: userProfile.email_verified,
            company: userProfile.company,
            role: userProfile.role,
            isDemo: false
          });
          
          // Save credentials for offline use
          await AsyncStorage.setItem('saved_credentials', JSON.stringify({
            email: email,
            password: password
          }));
          
          console.log("✅ API login successful");
        }
      } catch (apiError) {
        console.log('API login failed, trying Auth0 fallback:', apiError);
        
        // If API login fails, fall back to Auth0
        const user = await Auth0Service.login();
        
        if (user) {
          setUser(user);
          
          // Save credentials for offline use
          await AsyncStorage.setItem('saved_credentials', JSON.stringify({
            email: email,
            password: password
          }));
          
          // Ensure demo mode is off
          await setDemoMode(false);
          DashboardAccountingService.setDemoMode(false);
          
          console.log("✅ Auth0 login successful");
        } else {
          throw new Error('Login failed');
        }
      }
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      // Check connectivity
      if (netInfo.isConnected === false) {
        throw new Error('Internet connection required for registration');
      }
      
      // Try to register with API first
      try {
        const registerResponse = await authApi.post('/register', {
          email,
          password,
          displayName,
        }, { requiresAuth: false });
        
        if (registerResponse && registerResponse.user) {
          // Set user state from API response
          setUser({
            uid: registerResponse.user.id || registerResponse.user.sub,
            email: registerResponse.user.email,
            displayName: registerResponse.user.displayName || displayName,
            photoURL: registerResponse.user.photoURL || null,
            phoneNumber: registerResponse.user.phoneNumber || null,
            emailVerified: registerResponse.user.emailVerified || false,
            isDemo: false
          });
          
          // Save credentials for offline use
          await AsyncStorage.setItem('saved_credentials', JSON.stringify({
            email: email,
            password: password
          }));
          
          console.log("✅ API registration successful");
        } else {
          throw new Error('API registration failed');
        }
      } catch (apiError) {
        console.log('API registration failed, trying Auth0 fallback:', apiError);
        
        // Fall back to Auth0 registration
        const user = await Auth0Service.registerDirectly(email, password, displayName);
        
        if (user) {
          setUser(user);
          
          // Save credentials for offline use
          await AsyncStorage.setItem('saved_credentials', JSON.stringify({
            email: email,
            password: password
          }));
          
          console.log("✅ Auth0 registration successful");
        } else {
          throw new Error('Registration failed');
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      console.log('Logout attempt');
      
      // If we're in demo mode, just clear state
      if (user?.isDemo) {
        await AsyncStorage.clear();
        await clearTokens();
        setUser(null);
        await setDemoMode(false);
        DashboardAccountingService.setDemoMode(false);
        return;
      }
      
      // If we're online, try to logout from Auth0
      if (netInfo.isConnected !== false) {
        try {
          // Try both API and Auth0 logout
          await authApi.post('/logout', {}).catch(() => console.log('API logout unavailable'));
          await Auth0Service.logout();
        } catch (error) {
          console.log('Online logout had errors:', error);
          // Continue with local logout even if online logout fails
        }
      }
      
      // Always clear local storage and state
      await AsyncStorage.clear();
      await clearTokens();
      setUser(null);
    } catch (error: any) {
      console.error('Logout failed:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      // Check connectivity
      if (netInfo.isConnected === false) {
        throw new Error('Internet connection required to reset password');
      }
      
      // Try both API and Auth0 for password reset
      try {
        await authApi.post('/forgot-password', { email }, { requiresAuth: false });
        console.log('Password reset email sent via API');
      } catch (apiError) {
        // Fall back to Auth0 password reset
        const success = await Auth0Service.forgotPassword(email);
        if (!success) {
          throw new Error('Failed to send password reset email');
        }
        console.log('Password reset email sent via Auth0');
      }
    } catch (error: any) {
      console.error('Password reset failed:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      setLoading(true);
      
      // If we're online, update profile through API
      if (netInfo.isConnected !== false && !user?.isDemo) {
        try {
          const updatedProfile = await authApi.patch('/profile', data);
          
          // Update local user state with API response
          setUser(prev => prev ? { ...prev, ...updatedProfile } : null);
          console.log('Profile updated via API');
        } catch (apiError) {
          console.error('Failed to update profile via API:', apiError);
          // Fall back to local update only
          setUser(prev => prev ? { ...prev, ...data } : null);
        }
      } else {
        // Offline mode or demo mode - just update local state
        console.log('Offline/demo profile update - local only');
        setUser(prev => prev ? { ...prev, ...data } : null);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
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
      console.log("🎉 Demo account login complete");
    } catch (error: any) {
      console.error('Demo login failed:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyTwoFactorCode = async (code: string): Promise<void> => {
    try {
      console.log(`Verifying 2FA code: ${code}`);
      
      // If we're online and not in demo mode
      if (netInfo.isConnected !== false && !user?.isDemo) {
        try {
          await authApi.post('/verify-2fa', { code });
          console.log('2FA verification successful via API');
        } catch (apiError) {
          console.error('2FA API verification failed:', apiError);
          throw new Error('Invalid verification code');
        }
      } else if (code !== '123456') {
        // Demo/offline 2FA code
        throw new Error('Invalid verification code');
      }
    } catch (error) {
      console.error('2FA verification failed:', error);
      throw error;
    }
  };

  /**
   * Login with Google
   */
  const loginWithGoogle = async (): Promise<void> => {
    setLoading(true);
    try {
      // If offline, throw error as social login requires internet
      if (netInfo.isConnected === false) {
        throw new Error('Internet connection required for Google login');
      }
      
      console.log("🔑 Google login process started");
      
      // Try Auth0 Google login
      const googleUser = await Auth0Service.loginWithGoogle();
      
      if (googleUser) {
        setUser(googleUser);
        
        // Ensure demo mode is off
        await setDemoMode(false);
        DashboardAccountingService.setDemoMode(false);
        
        console.log("✅ Google login successful");
      } else {
        throw new Error('Google login failed');
      }
    } catch (error: any) {
      console.error('❌ Google login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Login with Facebook
   */
  const loginWithFacebook = async (): Promise<void> => {
    setLoading(true);
    try {
      // If offline, throw error as social login requires internet
      if (netInfo.isConnected === false) {
        throw new Error('Internet connection required for Facebook login');
      }
      
      console.log("🔑 Facebook login process started");
      
      // Try Auth0 Facebook login
      const facebookUser = await Auth0Service.loginWithFacebook();
      
      if (facebookUser) {
        setUser(facebookUser);
        
        // Ensure demo mode is off
        await setDemoMode(false);
        DashboardAccountingService.setDemoMode(false);
        
        console.log("✅ Facebook login successful");
      } else {
        throw new Error('Facebook login failed');
      }
    } catch (error: any) {
      console.error('❌ Facebook login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Register with Google
   */
  const registerWithGoogle = async (): Promise<void> => {
    setLoading(true);
    try {
      // If offline, throw error as social registration requires internet
      if (netInfo.isConnected === false) {
        throw new Error('Internet connection required for Google registration');
      }
      
      console.log("🔑 Google registration process started");
      
      // Try Auth0 Google registration
      const googleUser = await Auth0Service.registerWithGoogle();
      
      if (googleUser) {
        setUser(googleUser);
        
        // Ensure demo mode is off
        await setDemoMode(false);
        DashboardAccountingService.setDemoMode(false);
        
        console.log("✅ Google registration successful");
      } else {
        throw new Error('Google registration failed');
      }
    } catch (error: any) {
      console.error('❌ Google registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Register with Facebook
   */
  const registerWithFacebook = async (): Promise<void> => {
    setLoading(true);
    try {
      // If offline, throw error as social registration requires internet
      if (netInfo.isConnected === false) {
        throw new Error('Internet connection required for Facebook registration');
      }
      
      console.log("🔑 Facebook registration process started");
      
      // Try Auth0 Facebook registration
      const facebookUser = await Auth0Service.registerWithFacebook();
      
      if (facebookUser) {
        setUser(facebookUser);
        
        // Ensure demo mode is off
        await setDemoMode(false);
        DashboardAccountingService.setDemoMode(false);
        
        console.log("✅ Facebook registration successful");
      } else {
        throw new Error('Facebook registration failed');
      }
    } catch (error: any) {
      console.error('❌ Facebook registration failed:', error);
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
