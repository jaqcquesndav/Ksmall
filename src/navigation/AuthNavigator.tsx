import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';

import OnboardingScreen from '../screens/authentication/OnboardingScreen';
import LoginScreen from '../screens/authentication/LoginScreen';
import SignupScreen from '../screens/authentication/SignupScreen';
import ForgotPasswordScreen from '../screens/authentication/ForgotPasswordScreen';
import TwoFactorAuthScreen from '../screens/authentication/TwoFactorAuthScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={SignupScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <AuthStack.Screen name="TwoFactorAuth" component={TwoFactorAuthScreen} />
  </AuthStack.Navigator>
);

export default AuthNavigator;
