import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import UserProfileScreen from '../screens/settings/UserProfileScreen';
import BusinessProfileScreen from '../screens/settings/BusinessProfileScreen';
import UserManagementScreen from '../screens/settings/UserManagementScreen';
import PaymentMethodsScreen from '../screens/settings/PaymentMethodsScreen';
import ThemeSettingsScreen from '../screens/settings/ThemeSettingsScreen';
import SecuritySettingsScreen from '../screens/settings/SecuritySettingsScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import PermissionSettingsScreen from '../screens/settings/PermissionSettingsScreen';
import HelpSupportScreen from '../screens/settings/HelpSupportScreen';
import AboutScreen from '../screens/settings/AboutScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

// Accounting screens
import JournalEntryDetailsScreen from '../screens/accounting/JournalEntryDetailsScreen';

// Inventory screens - fix the import path
import ProductDetailsScreen from '../screens/inventory/ProductDetailsScreen';
import TransactionDetailsScreen from '../screens/inventory/TransactionDetailsScreen';
import AddProductScreen from '../screens/inventory/AddProductScreen';

import { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

const MainStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      
      {/* Main settings screen */}
      <Stack.Screen name="Settings" component={SettingsScreen} />
      
      {/* Notifications */}
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      
      {/* Profile & Settings screens */}
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="ThemeSettings" component={ThemeSettingsScreen} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="PermissionSettings" component={PermissionSettingsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      
      {/* Accounting screens */}
      <Stack.Screen name="JournalEntryDetails" component={JournalEntryDetailsScreen} />
      
      {/* Inventory screens */}
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="TransactionDetails" component={TransactionDetailsScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
    </Stack.Navigator>
  );
};

export default MainStack;
