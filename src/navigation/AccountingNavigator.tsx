import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';

// Imports complets des écrans de comptabilité
import AccountingDashboardScreen from '../screens/accounting/AccountingDashboardScreen';
import JournalEntryScreen from '../screens/accounting/JournalEntryScreen';
import LedgerScreen from '../screens/accounting/LedgerScreen';
import FinancialStatementsScreen from '../screens/accounting/FinancialStatementsScreen';
import ReportGeneratorScreen from '../screens/accounting/ReportGeneratorScreen';
import AccountDetailsScreen from '../screens/accounting/AccountDetailsScreen';
import AddJournalEntryScreen from '../screens/accounting/AddJournalEntryScreen';
import JournalEntryDetailsScreen from '../screens/accounting/JournalEntryDetailsScreen';
import TransactionDetailsScreen from '../screens/accounting/TransactionDetailsScreen';

// Imports des écrans de paramètres comptables
import AccountingSettingsScreen from '../screens/settings/AccountingSettingsScreen';
import FiscalYearScreen from '../screens/settings/FiscalYearScreen';
import ChartOfAccountsScreen from '../screens/settings/ChartOfAccountsScreen';
import TaxSettingsScreen from '../screens/settings/TaxSettingsScreen';
import ReportFormatScreen from '../screens/settings/ReportFormatScreen';
import DisplayPreferencesScreen from '../screens/settings/DisplayPreferencesScreen';
import DataImportScreen from '../screens/settings/DataImportScreen';
import DataExportScreen from '../screens/settings/DataExportScreen';
import BackupRestoreScreen from '../screens/settings/BackupRestoreScreen';

const Stack = createStackNavigator<RootStackParamList>();

const AccountingNavigator = () => {
  return (
    <Stack.Navigator 
      initialRouteName="AccountingDashboard"
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="AccountingDashboard" component={AccountingDashboardScreen} />
      {/* Écrans de comptabilité */}
      <Stack.Screen name="JournalEntry" component={JournalEntryScreen} />
      <Stack.Screen name="JournalEntryDetails" component={JournalEntryDetailsScreen} />
      <Stack.Screen name="AddJournalEntry" component={AddJournalEntryScreen} />
      <Stack.Screen name="Ledger" component={LedgerScreen} />
      <Stack.Screen name="AccountDetails" component={AccountDetailsScreen} />
      <Stack.Screen name="TransactionDetails" component={TransactionDetailsScreen} />
      <Stack.Screen name="FinancialStatements" component={FinancialStatementsScreen} />
      <Stack.Screen name="ReportGenerator" component={ReportGeneratorScreen} />
      
      {/* Écrans de paramètres comptables */}
      <Stack.Screen name="AccountingSettings" component={AccountingSettingsScreen} />
      <Stack.Screen name="FiscalYear" component={FiscalYearScreen} />
      <Stack.Screen name="ChartOfAccounts" component={ChartOfAccountsScreen} />
      <Stack.Screen name="TaxSettings" component={TaxSettingsScreen} />
      <Stack.Screen name="ReportFormat" component={ReportFormatScreen} />
      <Stack.Screen name="DisplayPreferences" component={DisplayPreferencesScreen} />
      <Stack.Screen name="DataImport" component={DataImportScreen} />
      <Stack.Screen name="DataExport" component={DataExportScreen} />
      <Stack.Screen name="BackupRestore" component={BackupRestoreScreen} />
    </Stack.Navigator>
  );
};

export default AccountingNavigator;
