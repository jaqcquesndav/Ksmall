import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Animated, Dimensions } from 'react-native';
import { useTheme, Surface, Text, TouchableRipple, Divider, Badge } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MainTabsParamList } from './types';
import UserService from '../services/UserService';

interface SidebarProps {
  tabRoutes: Array<{
    name: keyof MainTabsParamList;
    title: string;
    iconName: string;
    component: React.ComponentType<any>;
    listeners?: (props: { navigation: any }) => { tabPress: (e: any) => void };
  }>;
  currentTab: keyof MainTabsParamList;
  onChangeTab: (tabName: keyof MainTabsParamList) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  tabRoutes,
  currentTab,
  onChangeTab,
}) => {
  const theme = useTheme();
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const sidebarWidth = Math.min(Math.max(screenWidth * 0.15, 80), 120); // 15% de la largeur, min 80px, max 120px
  
  // Animation pour l'apparition de la sidebar
  const [slideAnim] = useState(new Animated.Value(-sidebarWidth));
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
    
    return () => {
      // Animation de sortie si nécessaire
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.sidebarContainer,
        {
          width: sidebarWidth,
          transform: [{ translateX: slideAnim }],
          opacity: fadeAnim,
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
            {tabRoutes.map((route, index) => {
              const isFocused = currentTab === route.name;
              const iconName = route.iconName;
              
              // Afficher un badge pour les notifications
              const showBadge = route.name === 'Chat' && notificationCount > 0;
              
              return (
                <TouchableRipple
                  key={`tab-${route.name}`}
                  onPress={() => onChangeTab(route.name)}
                  style={[
                    styles.sidebarItem,
                    { height: Math.min(screenHeight / 6, 80) },
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
                      {route.title}
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
  );
};

const styles = StyleSheet.create({
  sidebarContainer: {
    height: '100%',
    zIndex: 10,
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

export default Sidebar;