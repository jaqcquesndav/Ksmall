import React, { useEffect, useRef } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { API } from '../../services/API';
import { setOfflineMode } from '../../services/auth/TokenStorage';

/**
 * Component that monitors network status changes and handles online/offline transitions
 */
const NetworkStatusListener: React.FC = () => {
  const netInfo = useNetInfo();
  const prevConnected = useRef<boolean | null>(null);
  
  useEffect(() => {
    // Handle transitions between offline and online states
    const handleConnectionChange = async () => {
      const isConnected = netInfo.isConnected;
      
      // Update offline mode in storage
      await setOfflineMode(isConnected === false);
      
      // Handle coming back online
      if (isConnected && prevConnected.current === false) {
        console.log('🌐 Network connection restored');
        
        // Process any queued requests from offline mode
        try {
          await API.processOfflineQueue();
        } catch (error) {
          console.error('Error processing offline queue:', error);
        }
      }
      
      // Handle going offline
      if (isConnected === false && prevConnected.current !== false) {
        console.log('📴 Network connection lost');
      }
      
      prevConnected.current = isConnected;
    };
    
    handleConnectionChange();
  }, [netInfo.isConnected]);
  
  // This is a headless component - it doesn't render anything
  return null;
};

export default NetworkStatusListener;