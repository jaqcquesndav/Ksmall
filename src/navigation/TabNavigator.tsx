import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabsParamList } from './types';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DashboardScreen from '../screens/main/DashboardScreen';
import ChatScreen from '../screens/main/ChatScreen';
import AccountingScreen from '../screens/main/AccountingScreen';
import InventoryScreen from '../screens/main/InventoryScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import useOrientation from '../hooks/useOrientation';
import { View, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator<MainTabsParamList>();

const TabNavigator: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isLandscape } = useOrientation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarStyle: {
          height: isLandscape ? 60 : 70,
          paddingBottom: isLandscape ? 5 : 10,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: t('dashboard'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: t('chat'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="chat-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Accounting"
        component={AccountingScreen}
        options={{
          title: t('accounting'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="calculator-variant-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          title: t('inventory'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="package-variant-closed" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('settings'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="cog-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
