import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MainTabsParamList } from './types';
import { useTheme } from 'react-native-paper';

import DashboardScreen from '../screens/main/DashboardScreen';
import ChatScreen from '../screens/main/ChatScreen';
import InventoryScreen from '../screens/main/InventoryScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import AccountingNavigator from './AccountingNavigator';

const Tab = createBottomTabNavigator<MainTabsParamList>();

const TabNavigator: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          elevation: 8,
          shadowOpacity: 0.1,
          shadowRadius: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 }
        }
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
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
        component={AccountingNavigator}
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
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('settings'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
