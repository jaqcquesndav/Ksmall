import { NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * Type definitions for navigation
 */

// Root navigator param list combining all stacks
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  // Comptabilité - Ajout des types pour AccountingNavigator
  AccountingDashboard: undefined;
  AccountingMain: undefined;
  JournalEntry: undefined;
  JournalEntryDetails: { entryId: string };
  AddJournalEntry: { draftId?: string };
  Ledger: undefined;
  AccountDetails: { accountId: string };
  TransactionDetails: { transactionId: string };
  FinancialStatements: undefined;
  ReportGenerator: { reportType?: string; period?: { start: string; end: string } };
  // Paramètres comptables
  AccountingSettings: undefined;
  FiscalYear: undefined;
  ChartOfAccounts: undefined;
  TaxSettings: undefined;
  ReportFormat: undefined;
  DisplayPreferences: undefined;
  DataImport: undefined;
  DataExport: undefined;
  BackupRestore: undefined;
  // Finance rapide
  FinanceRequest: { 
    type: string; 
    creditScore?: number;
  };
  FinancePayment: { 
    type: string; 
    paymentMethod?: string;
    financialInstitution?: string;
  };
  FinanceInvestment: { 
    type: string;
    financialInstitution?: string; 
    isPublic?: boolean;
  };
  BondIssuance: undefined;
};

// Authentication stack param list
export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  TwoFactorAuth: { email: string };
};

// Main stack param list
export type MainStackParamList = {
  MainTabs: undefined | { screen: string; params?: object };
  Notifications: undefined;
  UserProfile: undefined;
  BusinessProfile: undefined;
  Settings: undefined;
  Chat: { conversationId?: string; newConversation?: boolean };
  
  // Settings screens
  UserManagement: undefined;
  PaymentMethods: undefined;
  ThemeSettings: undefined;
  SecuritySettings: undefined;
  NotificationSettings: undefined;
  PermissionSettings: undefined;
  HelpSupport: undefined;
  About: undefined;
  
  // New screens for subscription and tokens
  Subscriptions: undefined;
  TokenPurchase: undefined;
  
  // Accounting screens
  JournalEntryDetails: { entryId: string };
  AddJournalEntry: { draftId?: string };
  AccountDetails: { accountId: string };
  AccountingDashboard: undefined;
  Ledger: undefined;
  FinancialStatements: undefined;
  ReportGenerator: { reportType?: string; period?: { start: string; end: string } };
  
  // Inventory screens
  ProductDetails: { productId: string };
  TransactionDetails: { transactionId: string };
  AddProduct: { productId?: string; categoryId?: string };
  StockAdjustment: { productId: string };
  
  // Finance screens
  FinanceRequest: { 
    type: string; 
    creditScore?: number;
  };
  FinancePayment: { 
    type: string; 
    paymentMethod?: string;
    financialInstitution?: string;
  };
  FinanceInvestment: { 
    type: string;
    financialInstitution?: string; 
    isPublic?: boolean;
  };
  BondIssuance: undefined;
};

// Main tab navigator param list
export type MainTabsParamList = {
  Dashboard: undefined;
  Chat: undefined;
  Accounting: undefined;
  Inventory: undefined;
  Settings: undefined;
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

export type RegisterScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Register'
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
