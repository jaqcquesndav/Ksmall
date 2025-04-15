import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebase } from '../config/firebase';
import DashboardAccountingService from '../services/DashboardAccountingService';
import { setDemoMode } from '../services/auth/AuthStorage';

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
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🔐 Auth state changed:", user ? `User logged in: ${user.email}` : "No user logged in");
  }, [user]);

  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        console.log("🔄 Checking existing auth session...");
        const hasSession = false;

        if (hasSession) {
          // Restore session logic
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
      console.info(`📧 Login attempt with email: ${email}`);
      if (email.trim() === 'jacquesndav@gmail.com' && password === 'root12345') {
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
        return;
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setUser({
          uid: `user-${Date.now()}`,
          email: email,
          displayName: email.split('@')[0],
          isDemo: false,
          phoneNumber: null,
          photoURL: null,
          emailVerified: false
        });
        // Désactiver le mode démo pour les transactions
        await setDemoMode(false);
        DashboardAccountingService.setDemoMode(false);
        console.log("✅ Regular login complete with email:", email);
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
      const mockUser = { uid: '1', email, displayName };
      await AsyncStorage.setItem('userProfile', JSON.stringify(mockUser));
      setUser({
        uid: mockUser.uid,
        email: mockUser.email,
        displayName: mockUser.displayName,
        isDemo: false,
        phoneNumber: null,
        photoURL: null,
        emailVerified: false
      });
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
      await new Promise((resolve) => setTimeout(resolve, 500));
      await AsyncStorage.clear();
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
      console.log('Simulating password reset for email:', email);
    } catch (error: any) {
      console.error('Password reset failed:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      setLoading(true);
      console.log('Updating user profile with data:', data);
      setUser(prev => prev ? { ...prev, ...data } : null);
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (code !== '123456') {
        throw new Error('Invalid verification code');
      }
    } catch (error) {
      console.error('2FA verification failed:', error);
      throw error;
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
    verifyTwoFactorCode
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
