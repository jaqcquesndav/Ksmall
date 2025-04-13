import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

// Ces imports produiront des erreurs jusqu'à ce que vous créiez les fichiers correspondants
import AccountingDashboardScreen from '../screens/accounting/AccountingDashboardScreen';
import JournalEntryScreen from '../screens/accounting/JournalEntryScreen';
import LedgerScreen from '../screens/accounting/LedgerScreen'; // Ensure this file exists at the specified path
import FinancialStatementsScreen from '../screens/accounting/FinancialStatementsScreen';
import ReportGeneratorScreen from '../screens/accounting/ReportGeneratorScreen';

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
      <Stack.Screen name="JournalEntry" component={JournalEntryScreen} />
      <Stack.Screen name="Ledger" component={LedgerScreen} />
      <Stack.Screen name="FinancialStatements" component={FinancialStatementsScreen} />
      <Stack.Screen name="ReportGenerator" component={ReportGeneratorScreen} />
    </Stack.Navigator>
  );
};

export default AccountingNavigator;
