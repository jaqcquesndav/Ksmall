import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainStack from './MainStack';
import { RootStackParamList } from './types';
import SplashScreen from '../screens/SplashScreen';
import logger from '../utils/logger';

const RootStack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();
  const [initializing, setInitializing] = useState(true);
  
  useEffect(() => {
    console.log("🧭 AppNavigator - Auth state changed:", { 
      isAuthenticated: !!user, 
      userEmail: user?.email,
      loading, 
      initializing 
    });
    
    // Simuler un temps de chargement pour le splash screen
    const timer = setTimeout(() => {
      setInitializing(false);
      logger.debug('App initialization complete');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [user, loading]);
  
  if (initializing || loading) {
    console.log("⏳ AppNavigator - Showing splash screen due to:", {
      initializing,
      loading
    });
    return <SplashScreen />;
  }
  
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <RootStack.Screen name="Main" component={MainStack} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};

export default AppNavigator;
