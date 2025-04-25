import { useCallback } from 'react';
import { useApi } from './useApi';
import API from '../../services/API';
// Import the useAuth hook instead of the context directly
import { useAuth as useAuthContext } from '../../context/AuthContext';
import logger from '../../utils/logger';
import { User } from '../../types/auth';

/**
 * Hook pour gérer l'authentification et les opérations utilisateur
 */
export function useAuth() {
  // Use the provided hook from the context file
  const authContext = useAuthContext();
  
  /**
   * Hook pour la connexion utilisateur
   */
  const login = useApi(
    (email: string, password: string) => {
      // Capture email and password in closure for later use in onSuccess
      const authCredentials = { email, password };
      return API.auth.login(email, password).then(response => {
        // Attach the credentials to the response for access in onSuccess
        return { ...response, _authCredentials: authCredentials };
      });
    },
    {
      autoFetch: false,
      onSuccess: (response) => {
        if (response?.user && response?.token) {
          // Access the captured credentials
          authContext.login(response._authCredentials.email, response._authCredentials.password);
        }
      }
    }
  );

  /**
   * Hook pour l'inscription utilisateur
   */
  const register = useApi(
    (userData: { email: string; password: string; displayName: string; phoneNumber?: string }) => {
      // Capture the userData in closure for later use
      const userRegistrationData = { ...userData };
      return API.auth.register(userData).then(response => {
        // Attach userData to the response
        return { ...response, _userData: userRegistrationData };
      });
    },
    {
      autoFetch: false,
      onSuccess: (response) => {
        if (response?.user && response?.token) {
          // Access the captured userData
          authContext.login(response.user.email, response._userData.password);
        }
      }
    }
  );

  /**
   * Hook pour la récupération du mot de passe
   */
  const forgotPassword = useApi(
    (email: string) => API.auth.forgotPassword(email),
    { autoFetch: false }
  );

  /**
   * Hook pour réinitialiser le mot de passe
   */
  const resetPassword = useApi(
    (token: string, newPassword: string) => API.auth.resetPassword(token, newPassword),
    { autoFetch: false }
  );

  /**
   * Hook pour la vérification de l'email
   */
  const verifyEmail = useApi(
    (token: string) => API.auth.verifyEmail(token),
    { autoFetch: false }
  );

  /**
   * Hook pour récupérer les informations de l'utilisateur courant
   */
  const currentUser = useApi(
    () => API.auth.getCurrentUser(),
    {
      autoFetch: false,
      fetchOnFocus: true,
      onSuccess: (user) => {
        if (user) {
          authContext.updateProfile(user);
        }
      }
    }
  );

  /**
   * Hook pour mettre à jour le profil utilisateur
   */
  const updateProfile = useApi(
    (userData: Partial<User>) => API.auth.updateProfile(userData),
    {
      autoFetch: false,
      onSuccess: (user) => {
        if (user) {
          authContext.updateProfile(user);
        }
      }
    }
  );

  /**
   * Hook pour changer le mot de passe
   */
  const changePassword = useApi(
    (currentPassword: string, newPassword: string) => 
      API.auth.changePassword(currentPassword, newPassword),
    { autoFetch: false }
  );

  /**
   * Fonction de déconnexion
   */
  const logout = useCallback(async () => {
    try {
      await API.auth.logout();
    } catch (error) {
      logger.error('Erreur lors de la déconnexion', error);
    } finally {
      authContext.logout();
    }
  }, [authContext]);

  return {
    login,
    register,
    forgotPassword,
    resetPassword,
    verifyEmail,
    currentUser,
    updateProfile,
    changePassword,
    logout,
    loading: authContext.loading
  };
}