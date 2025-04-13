import React, { ReactNode, useState, useEffect } from 'react';
import { Appbar, Badge, useTheme, Menu, Divider, Avatar } from 'react-native-paper';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import UserService from '../../services/UserService';
import { useMainNavigation } from '../../hooks/useAppNavigation';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  showNotifications?: boolean;
  showProfile?: boolean;
  rightAction?: ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  title, 
  subtitle,
  onBack, 
  showBack = false,
  showNotifications = true,
  showProfile = true,
  rightAction
}) => {
  const navigation = useMainNavigation();
  const theme = useTheme();
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  
  // État pour les informations utilisateur
  const [userName, setUserName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Charger les données utilisateur depuis le service
  useEffect(() => {
    const loadUserData = async () => {
      const user = await UserService.getCurrentUser();
      if (user) {
        setUserName(user.displayName);
        
        // Extraire les initiales du nom
        const nameParts = user.displayName.split(' ');
        const initials = nameParts.length > 1 
          ? `${nameParts[0][0]}${nameParts[1][0]}` 
          : user.displayName.substring(0, 2);
        setUserInitials(initials.toUpperCase());
        
        setUserAvatar(user.photoURL);
        
        const count = await UserService.getUnreadNotificationsCount();
        setNotificationCount(count);
      }
    };
    
    loadUserData();
    
    // S'abonner aux mises à jour de l'utilisateur
    const unsubscribe = UserService.onUserUpdated(user => {
      setUserName(user.displayName);
      
      const nameParts = user.displayName.split(' ');
      const initials = nameParts.length > 1 
        ? `${nameParts[0][0]}${nameParts[1][0]}` 
        : user.displayName.substring(0, 2);
      setUserInitials(initials.toUpperCase());
      
      setUserAvatar(user.photoURL);
    });
    
    return unsubscribe;
  }, []);
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };
  
  const handleOpenNotifications = () => {
    navigation.navigate('Notifications');
  };
  
  const handleOpenUserProfile = () => {
    navigation.navigate('UserProfile');
    setProfileMenuVisible(false);
  };
  
  const handleOpenCompanyProfile = () => {
    navigation.navigate('BusinessProfile');
    setProfileMenuVisible(false);
  };
  
  const handleOpenSettings = () => {
    navigation.navigate('Settings');
    setProfileMenuVisible(false);
  };

  // Render user avatar or initials
  const renderUserAvatar = () => {
    if (userAvatar) {
      return (
        <Avatar.Image 
          size={32} 
          source={{ uri: userAvatar }} 
          style={styles.avatar}
        />
      );
    } else {
      return (
        <Avatar.Text 
          size={32} 
          label={userInitials || 'U'}
          style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
          color="#fff"
        />
      );
    }
  };

  return (
    <Appbar.Header>
      {(onBack || showBack) && (
        <Appbar.BackAction onPress={handleBack} />
      )}
      
      <Appbar.Content 
        title={title} 
        subtitle={subtitle}
      />
      
      {rightAction}
      
      {showNotifications && (
        <View>
          <Appbar.Action icon="bell" onPress={handleOpenNotifications} />
          {notificationCount > 0 && (
            <Badge 
              visible={true}
              size={16}
              style={styles.badge}
            >
              {notificationCount}
            </Badge>
          )}
        </View>
      )}
      
      {showProfile && (
        <Menu
          visible={profileMenuVisible}
          onDismiss={() => setProfileMenuVisible(false)}
          anchor={
            <TouchableOpacity onPress={() => setProfileMenuVisible(true)}>
              {renderUserAvatar()}
            </TouchableOpacity>
          }
        >
          <Menu.Item 
            leadingIcon="account" 
            onPress={handleOpenUserProfile} 
            title="Profil utilisateur" 
          />
          <Menu.Item 
            leadingIcon="office-building" 
            onPress={handleOpenCompanyProfile} 
            title="Profil entreprise" 
          />
          <Divider />
          <Menu.Item 
            leadingIcon="cog" 
            onPress={handleOpenSettings} 
            title="Paramètres" 
          />
        </Menu>
      )}
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  avatar: {
    marginHorizontal: 10,
  },
});

export default AppHeader;
