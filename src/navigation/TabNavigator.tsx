import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import FinancialDashboardScreen from '../screens/main/FinancialDashboardScreen';
import ChatScreen from '../screens/main/ChatScreen';
import AccountingScreen from '../screens/main/AccountingScreen';
import InventoryScreen from '../screens/main/InventoryScreen';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabNavigator = () => {
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
    </Tab.Navigator>
  );
};

export default TabNavigator;
