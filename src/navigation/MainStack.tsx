import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import TabNavigator from './TabNavigator';

// Import all screens for the main stack
import UserProfileScreen from '../screens/profile/UserProfileScreen';
import BusinessProfileScreen from '../screens/profile/BusinessProfileScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

// Import settings sub-screens
import UserManagementScreen from '../screens/settings/UserManagementScreen';
import PaymentMethodsScreen from '../screens/settings/PaymentMethodsScreen';
import ThemeSettingsScreen from '../screens/settings/ThemeSettingsScreen';
import SecuritySettingsScreen from '../screens/settings/SecuritySettingsScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import PermissionSettingsScreen from '../screens/settings/PermissionSettingsScreen';
import HelpSupportScreen from '../screens/settings/HelpSupportScreen';
import AboutScreen from '../screens/settings/AboutScreen';
import SubscriptionScreen from '../screens/settings/SubscriptionScreen';
import TokenPurchaseScreen from '../screens/settings/TokenPurchaseScreen';

// Import accounting screens
import JournalEntryDetailsScreen from '../screens/accounting/JournalEntryDetailsScreen';
import AddJournalEntryScreen from '../screens/accounting/AddJournalEntryScreen';
import AccountDetailsScreen from '../screens/accounting/AccountDetailsScreen';

// Import inventory screens
import ProductDetailsScreen from '../screens/inventory/ProductDetailsScreen';
import TransactionDetailsScreen from '../screens/inventory/TransactionDetailsScreen';
import AddProductScreen from '../screens/inventory/AddProductScreen';
import StockAdjustmentScreen from '../screens/inventory/StockAdjustmentScreen';

// Import finance screens
import FinanceRequestScreen from '../screens/finance/FinanceRequestScreen';
import FinancePaymentScreen from '../screens/finance/FinancePaymentScreen';
import FinanceInvestmentScreen from '../screens/finance/FinanceInvestmentScreen';
import BondIssuanceScreen from '../screens/finance/BondIssuanceScreen';

// Import chat screen
import ConversationScreen from '../screens/chat/ConversationScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

const MainStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Main tabs */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      
      {/* Profile and common screens */}
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      
      {/* Settings sub-screens */}
      <Stack.Screen name="UserManagement" component={UserManagementScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="ThemeSettings" component={ThemeSettingsScreen} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="PermissionSettings" component={PermissionSettingsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      
      {/* Subscription and Token screens */}
      <Stack.Screen name="Subscriptions" component={SubscriptionScreen} />
      <Stack.Screen name="TokenPurchase" component={TokenPurchaseScreen} />
      
      {/* Accounting screens */}
      <Stack.Screen name="JournalEntryDetails" component={JournalEntryDetailsScreen} />
      <Stack.Screen name="AddJournalEntry" component={AddJournalEntryScreen} />
      <Stack.Screen name="AccountDetails" component={AccountDetailsScreen} />
      
      {/* Inventory screens */}
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="TransactionDetails" component={TransactionDetailsScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="StockAdjustment" component={StockAdjustmentScreen} />
      
      {/* Finance screens */}
      <Stack.Screen name="FinanceRequest" component={FinanceRequestScreen} />
      <Stack.Screen name="FinancePayment" component={FinancePaymentScreen} />
      <Stack.Screen name="FinanceInvestment" component={FinanceInvestmentScreen} />
      <Stack.Screen name="BondIssuance" component={BondIssuanceScreen} />
      
      {/* Chat screen */}
      <Stack.Screen name="Chat" component={ConversationScreen} />
    </Stack.Navigator>
  );
};

export default MainStack;
