import { useCallback } from 'react';
import { NotificationOptions } from '../types/notification';

/**
 * Hook for displaying notifications to the user
 */
export const useNotification = () => {
  /**
   * Show a notification to the user
   */
  const showNotification = useCallback((options: NotificationOptions) => {
    // In a real implementation, this would display a toast or notification UI
    // For now, use console.log as a placeholder
    console.log(`${options.type.toUpperCase()} - ${options.message}`, 
      options.description ? `\n${options.description}` : '');
    
    // You can replace this with an actual notification implementation
    // such as react-native-toast-message, react-native-flash-message, etc.
  }, []);

  /**
   * Show a success notification
   */
  const showSuccess = useCallback((message: string, description?: string) => {
    showNotification({ type: 'success', message, description });
  }, [showNotification]);

  /**
   * Show an error notification
   */
  const showError = useCallback((message: string, description?: string) => {
    showNotification({ type: 'error', message, description });
  }, [showNotification]);

  /**
   * Show a warning notification
   */
  const showWarning = useCallback((message: string, description?: string) => {
    showNotification({ type: 'warning', message, description });
  }, [showNotification]);

  /**
   * Show an info notification
   */
  const showInfo = useCallback((message: string, description?: string) => {
    showNotification({ type: 'info', message, description });
  }, [showNotification]);

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};