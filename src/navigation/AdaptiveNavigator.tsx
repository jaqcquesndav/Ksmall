import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, Animated, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme, Surface, Text, TouchableRipple, Divider, Badge } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CommonActions, NavigationProp, ParamListBase, TabNavigationState, useNavigation } from '@react-navigation/native';
import useOrientation from '../hooks/useOrientation';
import { MainTabsParamList } from './types';
import UserService from '../services/UserService';

interface AdaptiveNavigatorProps {
  state: TabNavigationState<ParamListBase>;
  descriptors: Record<string, any>;
  navigation: any;
  tabRoutes: Array<{
    name: keyof MainTabsParamList;
    title: string;
    iconName: string;
    component: React.ComponentType<any>;
    listeners?: (props: { navigation: any }) => { tabPress: (e: any) => void };
  }>;
}

const Tab = createBottomTabNavigator();

const AdaptiveNavigator: React.FC<AdaptiveNavigatorProps> = ({ 
  state, 
  descriptors, 
  navigation,
  tabRoutes 
}) => {
  const theme = useTheme();
  const { isLandscape, dimensions } = useOrientation();
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const screenWidth = Dimensions.get('window').width;
  const sidebarWidth = Math.min(Math.max(screenWidth * 0.15, 80), 120); // 15% de la largeur de l'écran entre 80px et 120px
  
  // Animation pour l'apparition de la sidebar
  const [slideAnim] = useState(new Animated.Value(-100));
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // Récupérer le nombre de notifications non lues
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const count = await UserService.getUnreadNotificationsCount();
        setNotificationCount(count);
      } catch (error) {
        console.error("Erreur lors de la récupération des notifications:", error);
      }
    };
    
    fetchNotifications();
  }, []);
  
  // Animation lors du montage du composant
  useEffect(() => {
    if (isLandscape) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLandscape, slideAnim, fadeAnim]);
  
  // Fonction de navigation améliorée
  const handleNavigation = useCallback((routeName: string, tabRoute: any) => {
    // Navigation standard
    navigation.navigate(routeName);
    
    // Gestion des listeners spécifiques
    const customListener = tabRoute?.listeners;
    if (customListener) {
      try {
        const handler = customListener({ navigation }).tabPress;
        handler({ preventDefault: () => {} });
      } catch (error) {
        console.error("Erreur lors de la navigation:", error);
      }
    }
  }, [navigation]);
  
  // Si on est en mode paysage, afficher la sidebar
  if (isLandscape) {
    return (
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.sidebarContainer,
            {
              transform: [{ translateX: slideAnim }],
              opacity: fadeAnim,
              width: sidebarWidth,
            }
          ]}
        >
          <Surface style={[styles.sidebar, { backgroundColor: theme.colors.elevation.level2 }]} elevation={4}>
            <SafeAreaView style={styles.sidebarContent}>
              <View style={styles.sidebarHeader}>
                <Text style={[styles.appTitle, { color: theme.colors.primary }]}>KSmall</Text>
              </View>
              <Divider style={{ marginVertical: 8 }} />
              <View style={styles.sidebarNav}>
                {state.routes.map((route, index) => {
                  const { options } = descriptors[route.key];
                  const label = options.title || route.name;
                  const isFocused = state.index === index;
                  
                  // Trouver l'icône correspondante
                  const tabRoute = tabRoutes.find(tab => tab.name === route.name);
                  const iconName = tabRoute?.iconName || 'help-circle-outline';
                  
                  // Afficher un badge pour les notifications
                  const showBadge = route.name === 'Chat' && notificationCount > 0;
                  
                  return (
                    <TouchableRipple
                      key={route.key}
                      onPress={() => handleNavigation(route.name, tabRoute)}
                      style={[
                        styles.sidebarItem,
                        { height: Math.min(dimensions.height / 6, 80) },
                        isFocused && { 
                          backgroundColor: theme.colors.primaryContainer,
                          borderLeftWidth: 4,
                          borderLeftColor: theme.colors.primary,
                        }
                      ]}
                    >
                      <View style={styles.sidebarItemContent}>
                        <View style={styles.iconContainer}>
                          <Icon
                            name={iconName}
                            size={24}
                            color={isFocused ? theme.colors.primary : theme.colors.outline}
                          />
                          {showBadge && (
                            <Badge
                              size={16}
                              style={styles.badge}
                            >
                              {notificationCount}
                            </Badge>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.sidebarItemLabel,
                            { 
                              color: isFocused ? theme.colors.primary : theme.colors.outline,
                              fontSize: sidebarWidth < 100 ? 10 : 12,
                            }
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {label}
                        </Text>
                      </View>
                    </TouchableRipple>
                  );
                })}
              </View>
              <Divider style={{ marginVertical: 8 }} />
              <View style={styles.sidebarFooter}>
                <Text style={styles.versionText}>v1.0.0</Text>
              </View>
            </SafeAreaView>
          </Surface>
        </Animated.View>
        
        {/* Conteneur de contenu principal */}
        <View style={styles.content}>
          {state.routes[state.index] && 
           descriptors[state.routes[state.index].key] && 
           descriptors[state.routes[state.index].key].render()}
        </View>
      </View>
    );
  }
  
  // En mode portrait, on retourne la tabBar standard
  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebarContainer: {
    height: '100%',
    zIndex: 10,
    // La largeur est définie dynamiquement
  },
  sidebar: {
    height: '100%',
    width: '100%',
  },
  sidebarContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  sidebarHeader: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sidebarNav: {
    flex: 1,
    paddingTop: 10,
  },
  sidebarItem: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 2,
    // La hauteur est définie dynamiquement
  },
  sidebarItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },
  iconContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  sidebarItemLabel: {
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
    // La taille de la police est définie dynamiquement
  },
  content: {
    flex: 1,
  },
  sidebarFooter: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 10,
    opacity: 0.6,
  }
});

export default AdaptiveNavigator;