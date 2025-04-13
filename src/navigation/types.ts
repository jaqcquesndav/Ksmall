import { NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * Type definitions for navigation
 */

// Authentication stack param list
export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  TwoFactorAuth: { email: string };
};

// Main tab navigator param list
export type MainTabParamList = {
  Dashboard: undefined;
  Chat: undefined;
  Accounting: undefined;
  Inventory: undefined;
};

export type TabParamList = MainTabParamList;

// Main stack param list
export type MainStackParamList = {
  Tabs: {
    screen?: string;
  };
  // Settings screens
  Settings: undefined;
  UserProfile: undefined;
  BusinessProfile: undefined;
  UserManagement: undefined;
  PaymentMethods: undefined;
  ThemeSettings: undefined;
  SecuritySettings: undefined;
  NotificationSettings: undefined;
  PermissionSettings: undefined;
  HelpSupport: undefined;
  About: undefined;
  // Notification screen
  Notifications: undefined;
  // Accounting screens
  JournalEntryDetails: { entryId: string };
  // Inventory screens
  ProductDetails: { productId: string };
  TransactionDetails: { transactionId: string };
  AddProduct: undefined;
};

// Root navigator param list combining all stacks
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// Navigation prop type for components
export type OnboardingScreenProps = NativeStackScreenProps<
  AuthStackParamList, 
  'Onboarding'
>;

export type LoginScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Login'
>;

export type SignupScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Signup'
>;

export type ForgotPasswordScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'ForgotPassword'
>;

export type TwoFactorAuthScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'TwoFactorAuth'
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
