import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';

// Écrans d'authentification
import OnboardingScreen from '../screens/authentication/OnboardingScreen';
import LoginScreen from '../screens/authentication/LoginScreen';
import SignupScreen from '../screens/authentication/SignupScreen';
import ForgotPasswordScreen from '../screens/authentication/ForgotPasswordScreen';
import TwoFactorAuthScreen from '../screens/authentication/TwoFactorAuthScreen';

// Écrans principaux
import FinancialDashboardScreen from '../screens/main/FinancialDashboardScreen';
import ChatScreen from '../screens/main/ChatScreen';
import AccountingScreen from '../screens/main/AccountingScreen';
import InventoryScreen from '../screens/main/InventoryScreen';

// Types de navigation
import { 
  RootStackParamList, 
  AuthStackParamList, 
  MainStackParamList, 
  MainTabParamList 
} from './types';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import SplashScreen from '../screens/SplashScreen';
import logger from '../utils/logger';
import MainStack from './MainStack';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Navigation pour les écrans d'authentification
const AuthNavigator = () => {
  const { t } = useTranslation();
  
  return (
    <AuthStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="TwoFactorAuth" component={TwoFactorAuthScreen} />
    </AuthStack.Navigator>
  );
};

// Navigation des onglets principaux
const MainTabNavigator = () => {
  const { t } = useTranslation();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6200EE',
        tabBarInactiveTintColor: '#999',
        headerShown: false
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={FinancialDashboardScreen}
        options={{
          tabBarLabel: t('dashboard'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarLabel: t('chat'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chat" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Accounting"
        component={AccountingScreen}
        options={{
          tabBarLabel: t('accounting'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calculator" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarLabel: t('inventory'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="package-variant" color={color} size={size} />
          ),
        }}
      />
      {/* Removed Profile tab */}
    </Tab.Navigator>
  );
};

// Navigateur principal qui gère l'authentification
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
  
  // Afficher un écran de chargement pendant l'initialisation
  if (initializing || loading) {
    console.log("⏳ AppNavigator - Showing splash screen due to:", {
      initializing,
      loading
    });
    return <SplashScreen />;
  }
  
  console.log("🧭 AppNavigator - Rendering main navigation structure, user:", user?.email || "none");
  
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // L'utilisateur est connecté, afficher les écrans principaux
        <RootStack.Screen name="Main" component={MainStack} />
      ) : (
        // L'utilisateur n'est pas connecté, afficher les écrans d'authentification
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};

export default AppNavigator;
