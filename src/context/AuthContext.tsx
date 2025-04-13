import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as AuthStorage from '../services/auth/AuthStorage';

export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  company?: string | null;
  role?: string | null;
  isDemo?: boolean; // Ajout d'un flag pour identifier le compte démo
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyTwoFactorCode: (code: string) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>; // Add this method
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Demo user credentials
const DEMO_EMAIL = 'jacquesndav@gmail.com';
const DEMO_PASSWORD = 'root12345';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Ajout d'un log à chaque changement d'état utilisateur
  useEffect(() => {
    console.log("🔐 Auth state changed:", user ? `User logged in: ${user.email}` : "No user logged in");
  }, [user]);

  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        console.log("🔄 Checking existing auth session...");
        // Vérifier s'il y a une session enregistrée (simulé pour cet exemple)
        const hasSession = false; // En production: vérifier AsyncStorage ou autre mécanisme

        if (hasSession) {
          // Si un utilisateur était connecté, on pourrait restaurer sa session ici
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
      
      // Ajoutons des logs plus détaillés pour déboguer la comparaison
      console.debug(`📊 Input email length: ${email.length}, DEMO_EMAIL length: ${DEMO_EMAIL.length}`);
      console.debug(`📊 Email comparison (with trim): "${email.trim()}" === "${DEMO_EMAIL}": ${email.trim() === DEMO_EMAIL}`);
      console.debug(`📊 Password comparison: "${password}" === "${DEMO_PASSWORD}": ${password === DEMO_PASSWORD}`);
      
      // Vérification caractère par caractère pour détecter d'éventuels caractères invisibles
      console.debug("📝 Email character codes:");
      for (let i = 0; i < email.length; i++) {
        console.debug(`   Char at ${i}: '${email[i]}' (${email.charCodeAt(i)})`);
      }
      console.debug("📝 DEMO_EMAIL character codes:");
      for (let i = 0; i < DEMO_EMAIL.length; i++) {
        console.debug(`   Char at ${i}: '${DEMO_EMAIL[i]}' (${DEMO_EMAIL.charCodeAt(i)})`);
      }
      
      // Vérifier si les identifiants correspondent au compte de démo
      if (email.trim() === DEMO_EMAIL && password === DEMO_PASSWORD) {
        console.log("✅ Demo account credentials matched!");
        
        // Compte de démo
        const demoUser = {
          uid: 'demo-user-123',
          email: DEMO_EMAIL,
          displayName: 'Jacques Ndavaro',
          photoURL: null,
          phoneNumber: '+243987654321',
          company: 'KSMall Demo',
          role: 'Admin',
          isDemo: true // Marquer comme compte de démonstration
        };
        
        // Simuler un petit délai pour montrer le chargement
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.info('👤 Setting demo user in state', { userId: demoUser.uid });
        setUser(demoUser);
        console.log("🎉 Demo account login complete");
        return; // Simply return to match the expected Promise<void> type
      } else {
        console.log("⚠️ Demo account match failed, checking other credentials");
        // Si ce n'est pas le compte de démo, simuler un délai et vérifier d'autres identifiants
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Pour cet exemple, accepter n'importe quel email/mot de passe valide
        // En production, vous feriez une vérification avec votre backend
        setUser({
          uid: `user-${Date.now()}`,
          email: email,
          displayName: email.split('@')[0],
          isDemo: false
        });
        
        console.log("✅ Regular login complete with email:", email);
      }
      
      return;
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
      throw error;
    } finally {
      console.log("🔄 Login process finished, resetting loading state");
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      console.log('Simulating Google login');
    } catch (error: any) {
      console.error('Google login failed:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyTwoFactorCode = async (code: string) => {
    setLoading(true);
    try {
      console.log('Simulating 2FA verification with code:', code);
    } catch (error: any) {
      console.error('2FA verification failed:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const mockUser = { uid: '1', email, displayName: name };
      await AuthStorage.saveUserProfile({
        id: mockUser.uid,
        email: mockUser.email,
        fullName: mockUser.displayName,
        username: email.split('@')[0],
      });
      await AuthStorage.saveAuthToken('mock-token');
      setUser(mockUser);
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

      // Simuler un délai pour le logout
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Clear user data
      await AuthStorage.clearAllData();
      setUser(null);
    } catch (error: any) {
      console.error('Logout failed:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (data: Partial<User>) => {
    try {
      setLoading(true);
      // Mock implementation
      console.log('Updating user profile with data:', data);
      
      // Update the user state with the new data
      setUser(prev => prev ? { ...prev, ...data } : null);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    login,
    loginWithGoogle,
    signup,
    logout,
    verifyTwoFactorCode,
    updateUserProfile, // Add the method here
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
