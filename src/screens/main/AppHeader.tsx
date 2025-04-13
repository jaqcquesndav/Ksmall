import React from 'react';
import { Appbar, Avatar, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useMainNavigation } from '../../hooks/useAppNavigation';
import UserService from '../../services/UserService';
import { useState, useEffect } from 'react';
import { TouchableOpacity } from 'react-native';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  title, 
  subtitle, 
  showBack = false,
  onBack,
}) => {
  const theme = useTheme();
  const navigation = useMainNavigation();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState('');
  
  useEffect(() => {
    const loadUserData = async () => {
      const user = await UserService.getCurrentUser();
      if (user) {
        setAvatarUri(user.photoURL);
        
        // Generate initials from name
        const nameParts = user.displayName.split(' ');
        if (nameParts.length > 1) {
          setUserInitials(`${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase());
        } else {
          setUserInitials(user.displayName.substring(0, 2).toUpperCase());
        }
      }
    };
    
    loadUserData();
  }, []);

  const handleUserProfile = () => {
    navigation.navigate('UserProfile');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <Appbar.Header 
      style={{ 
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline
      }}
    >
      {showBack && (
        <Appbar.BackAction 
          onPress={handleBack} 
          color={theme.colors.primary}
        />
      )}
      
      <Appbar.Content 
        title={title} 
        subtitle={subtitle} 
        titleStyle={{ color: theme.colors.onSurface, fontWeight: 'bold' }}
        subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
      />
      
      <Appbar.Action 
        icon="bell-outline" 
        onPress={() => navigation.navigate('Notifications')} 
        color={theme.colors.primary}
      />
      
      <TouchableOpacity onPress={handleUserProfile}>
        {avatarUri ? (
          <Avatar.Image 
            size={32} 
            source={{ uri: avatarUri }} 
            style={{ marginRight: 16 }} 
          />
        ) : (
          <Avatar.Text 
            size={32} 
            label={userInitials} 
            style={{ 
              marginRight: 16, 
              backgroundColor: theme.colors.primary 
            }} 
            labelStyle={{ color: '#fff' }}
          />
        )}
      </TouchableOpacity>
    </Appbar.Header>
  );
};

export default AppHeader;