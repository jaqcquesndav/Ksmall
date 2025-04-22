import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabsParamList } from './types';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DashboardScreen from '../screens/main/DashboardScreen';
import ChatScreen from '../screens/main/ChatScreen';
import AccountingNavigator from './AccountingNavigator';
import InventoryScreen from '../screens/main/InventoryScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import useOrientation from '../hooks/useOrientation';
import { View, StyleSheet, Platform } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import Sidebar from './Sidebar'; // Nous allons créer ce composant

const Tab = createBottomTabNavigator<MainTabsParamList>();

const TabNavigator: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isLandscape } = useOrientation();
  const [currentTab, setCurrentTab] = useState<keyof MainTabsParamList>("Dashboard");
  
  // Définition des routes pour faciliter la réutilisation
  const tabRoutes = [
    {
      name: "Dashboard" as keyof MainTabsParamList,
      title: t('dashboard'),
      iconName: "view-dashboard-outline",
      component: DashboardScreen
    },
    {
      name: "Chat" as keyof MainTabsParamList,
      title: t('chat'),
      iconName: "chat-outline",
      component: ChatScreen
    },
    {
      name: "Accounting" as keyof MainTabsParamList,
      title: t('accounting'),
      iconName: "calculator-variant-outline",
      component: AccountingNavigator,
      listeners: ({ navigation }) => ({
        tabPress: (e) => {
          // Empêcher le comportement par défaut de navigation
          e.preventDefault();
          
          // Toujours réinitialiser la pile de navigation de comptabilité à l'écran principal
          navigation.dispatch(
            CommonActions.navigate({
              name: 'Accounting',
              params: {},
              merge: true,
            })
          );
          
          // Puis réinitialiser la pile interne de l'AccountingNavigator
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                { 
                  name: 'Accounting', 
                  state: {
                    routes: [{ name: 'AccountingDashboard' }],
                    index: 0
                  }
                },
              ],
            })
          );
        },
      })
    },
    {
      name: "Inventory" as keyof MainTabsParamList,
      title: t('inventory'),
      iconName: "package-variant-closed",
      component: InventoryScreen
    },
    {
      name: "Settings" as keyof MainTabsParamList,
      title: t('settings'),
      iconName: "cog-outline",
      component: SettingsScreen
    }
  ];

  // Rendu en fonction de l'orientation
  if (isLandscape) {
    // En mode paysage, on utilise une mise en page avec sidebar à gauche
    return (
      <View style={styles.landscapeContainer}>
        <Sidebar 
          tabRoutes={tabRoutes}
          currentTab={currentTab}
          onChangeTab={(tabName) => setCurrentTab(tabName)}
        />
        <View style={styles.content}>
          {/* Afficher le composant correspondant à l'onglet actuel */}
          {React.createElement(
            tabRoutes.find(route => route.name === currentTab)?.component || DashboardScreen
          )}
        </View>
      </View>
    );
  }

  // En mode portrait, on utilise le TabNavigator standard
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
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
      screenListeners={{
        state: (e) => {
          // Mettre à jour l'onglet actuel quand il change dans le TabNavigator
          const state = e.data?.state;
          if (state && state.index >= 0 && state.routeNames[state.index]) {
            setCurrentTab(state.routeNames[state.index] as keyof MainTabsParamList);
          }
        }
      }}
    >
      {tabRoutes.map(route => (
        <Tab.Screen
          key={route.name}
          name={route.name}
          component={route.component}
          options={{
            title: route.title,
            tabBarIcon: ({ color, size }) => (
              <Icon name={route.iconName} size={size} color={color} />
            ),
          }}
          listeners={route.listeners}
        />
      ))}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  }
});

export default TabNavigator;
