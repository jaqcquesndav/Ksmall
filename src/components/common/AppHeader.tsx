import React, { useState, useEffect } from 'react';
import { Appbar, Badge, Menu, Avatar, useTheme } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import NotificationService from '../../services/NotificationService';
import { MainStackParamList } from '../../navigation/types';
import logger from '../../utils/logger';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  showNotifications?: boolean;
  showProfile?: boolean;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  onBackPress?: () => void;
  subtitle?: string;
  children?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  title, 
  showBack = false, 
  showNotifications = true,
  showProfile = true,
  rightAction,
  leftAction,
  onBackPress,
  subtitle,
  children
}) => {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const theme = useTheme();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await NotificationService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        logger.error('Error fetching notification count:', error);
      }
    };

    fetchUnreadCount();
    
    const subscription = NotificationService.addNotificationListener(() => {
      fetchUnreadCount();
    });
    
    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const handleNotificationsPress = () => {
    navigation.navigate('Notifications');
  };

  const handleProfilePress = () => {
    setProfileMenuVisible(true);
  };

  const handleProfileNavigate = () => {
    navigation.navigate('UserProfile');
    setProfileMenuVisible(false);
  };

  const handleBusinessProfileNavigate = () => {
    navigation.navigate('BusinessProfile');
    setProfileMenuVisible(false);
  };

  const handleSettingsNavigate = () => {
    // @ts-ignore - We'll fix the type issue with our updated types
    navigation.navigate('Settings');
    setProfileMenuVisible(false);
  };

  return (
    <View>
      <Appbar.Header>
        {leftAction}
        {showBack && <Appbar.BackAction onPress={handleBack} />}
        <Appbar.Content title={title} subtitle={subtitle} />
        
        {showNotifications && (
          <View>
            <Appbar.Action 
              icon="bell" 
              onPress={handleNotificationsPress} 
            />
            {unreadCount > 0 && (
              <Badge
                visible={unreadCount > 0}
                size={16}
                style={styles.badge}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </View>
        )}
        
        {showProfile && (
          <Menu
            visible={profileMenuVisible}
            onDismiss={() => setProfileMenuVisible(false)}
            anchor={
              <Appbar.Action
                icon={props => (
                  user?.photoURL ? 
                  <Avatar.Image {...props} size={28} source={{ uri: user.photoURL }} /> :
                  <Avatar.Text {...props} size={28} label={user?.displayName?.[0] || 'U'} />
                )}
                onPress={handleProfilePress}
              />
            }
          >
            <Menu.Item 
              leadingIcon="account"
              onPress={handleProfileNavigate} 
              title="My Profile" 
            />
            <Menu.Item 
              leadingIcon="domain"
              onPress={handleBusinessProfileNavigate} 
              title="Business Profile" 
            />
            <Menu.Item 
              leadingIcon="cog"
              onPress={handleSettingsNavigate} 
              title="Settings" 
            />
          </Menu>
        )}
        
        {rightAction}
      </Appbar.Header>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
  }
});

export default AppHeader;
