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
  
  // Helper function to safely call API methods
  const safeApiCall = async (apiMethod, ...args) => {
    if (!API || !API.auth || typeof API.auth[apiMethod] !== 'function') {
      logger.error(`API.auth.${apiMethod} is not available`);
      throw new Error(`Authentication service not available`);
    }
    return API.auth[apiMethod](...args);
  };
  
  /**
   * Hook pour la connexion utilisateur
   */
  const login = useApi(
    async (email: string, password: string) => {
      // Capture email and password in closure for later use in onSuccess
      const authCredentials = { email, password };
      try {
        const response = await safeApiCall('login', email, password);
        // Attach the credentials to the response for access in onSuccess
        return { ...response, _authCredentials: authCredentials };
      } catch (error) {
        // Use offline demo login if API is not available
        logger.warn('API login failed, using offline authentication');
        // Return null to prevent further processing but don't throw an error
        return null;
      }
    },
    {
      autoFetch: false,
      onSuccess: (response) => {
        if (response?.user && response?.token) {
          // Access the captured credentials
          authContext.login(response._authCredentials.email, response._authCredentials.password);
        } else if (response === null) {
          // Handle null response from API not being available
          // We'll let the LoginScreen component handle this
        }
      }
    }
  );

  /**
   * Hook pour l'inscription utilisateur
   */
  const register = useApi(
    async (userData: { email: string; password: string; displayName: string; phoneNumber?: string }) => {
      // Capture the userData in closure for later use
      const userRegistrationData = { ...userData };
      try {
        const response = await safeApiCall('register', userData);
        // Attach userData to the response
        return { ...response, _userData: userRegistrationData };
      } catch (error) {
        logger.error('Failed to register user', error);
        throw error;
      }
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
    async (email: string) => {
      try {
        return await safeApiCall('forgotPassword', email);
      } catch (error) {
        logger.error('Failed to send forgot password email', error);
        throw error;
      }
    },
    { autoFetch: false }
  );

  /**
   * Hook pour réinitialiser le mot de passe
   */
  const resetPassword = useApi(
    async (token: string, newPassword: string) => {
      try {
        return await safeApiCall('resetPassword', token, newPassword);
      } catch (error) {
        logger.error('Failed to reset password', error);
        throw error;
      }
    },
    { autoFetch: false }
  );

  /**
   * Hook pour la vérification de l'email
   */
  const verifyEmail = useApi(
    async (token: string) => {
      try {
        return await safeApiCall('verifyEmail', token);
      } catch (error) {
        logger.error('Failed to verify email', error);
        throw error;
      }
    },
    { autoFetch: false }
  );

  /**
   * Hook pour récupérer les informations de l'utilisateur courant
   */
  const currentUser = useApi(
    async () => {
      try {
        return await safeApiCall('getCurrentUser');
      } catch (error) {
        logger.warn('Failed to get current user from API');
        return null;
      }
    },
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
    async (userData: Partial<User>) => {
      try {
        return await safeApiCall('updateProfile', userData);
      } catch (error) {
        logger.error('Failed to update profile', error);
        throw error;
      }
    },
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
    async (currentPassword: string, newPassword: string) => {
      try {
        return await safeApiCall('changePassword', currentPassword, newPassword);
      } catch (error) {
        logger.error('Failed to change password', error);
        throw error;
      }
    },
    { autoFetch: false }
  );

  /**
   * Fonction de déconnexion
   */
  const logout = useCallback(async () => {
    try {
      if (API && API.auth && typeof API.auth.logout === 'function') {
        await API.auth.logout();
      }
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