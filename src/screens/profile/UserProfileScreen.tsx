import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Avatar, TextInput, Button, Card, Text, Switch, useTheme, Divider } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import AppHeader from '../../components/common/AppHeader';
import UserService from '../../services/UserService';
import { showErrorToUser } from '../../utils/errorHandler';
import logger from '../../utils/logger';

interface UserProfile {
  displayName: string;
  email: string;
  phoneNumber: string;
  position: string;
  photoURL: string | null;
  language: string;
}

const UserProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    displayName: '',
    email: '',
    phoneNumber: '',
    position: '',
    photoURL: null,
    language: 'fr'
  });
  
  const [editableProfile, setEditableProfile] = useState<UserProfile>({...profile});
  const [isSaving, setIsSaving] = useState(false);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  useEffect(() => {
    loadUserProfile();
  }, []);
  
  const loadUserProfile = async () => {
    try {
      const userData = await UserService.getCurrentUser();
      if (userData) {
        const userProfile = {
          displayName: userData.displayName || '',
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || '',
          position: userData.position || '',
          photoURL: userData.photoURL,
          language: userData.language || 'fr'
        };
        setProfile(userProfile);
        setEditableProfile(userProfile);
      }
    } catch (error) {
      logger.error('Error loading user profile:', error);
      showErrorToUser(t('error_loading_profile'));
    }
  };
  
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - revert changes
      setEditableProfile({...profile});
    }
    setIsEditing(!isEditing);
  };
  
  const handleSaveProfile = async () => {
    if (!editableProfile.displayName.trim()) {
      Alert.alert(t('error'), t('name_required'));
      return;
    }
    
    setIsSaving(true);
    try {
      await UserService.updateUserProfile(editableProfile);
      setProfile({...editableProfile});
      setIsEditing(false);
      Alert.alert(t('success'), t('profile_updated'));
    } catch (error) {
      logger.error('Error saving profile:', error);
      showErrorToUser(t('error_saving_profile'));
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(t('permission_required'), t('storage_permission_message'));
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhotoURL = result.assets[0].uri;
        
        // Update the profile photo
        setIsSaving(true);
        try {
          await UserService.updateUserAvatar(newPhotoURL);
          setProfile(prev => ({...prev, photoURL: newPhotoURL}));
          setEditableProfile(prev => ({...prev, photoURL: newPhotoURL}));
          Alert.alert(t('success'), t('photo_updated'));
        } catch (error) {
          logger.error('Error updating profile photo:', error);
          showErrorToUser(t('error_updating_photo'));
        } finally {
          setIsSaving(false);
        }
      }
    } catch (error) {
      logger.error('Error picking image:', error);
      showErrorToUser(t('error_picking_image'));
    }
  };
  
  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <AppHeader title={t('user_profile')} showBack />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileHeaderContainer}>
          <TouchableOpacity 
            onPress={handlePickImage} 
            disabled={isSaving}
            style={styles.avatarContainer}
          >
            {profile.photoURL ? (
              <Avatar.Image 
                source={{ uri: profile.photoURL }} 
                size={120} 
                style={styles.avatar} 
              />
            ) : (
              <Avatar.Text 
                size={120} 
                label={profile.displayName.substring(0, 2).toUpperCase()} 
                style={[styles.avatar, {backgroundColor: theme.colors.primary}]} 
              />
            )}
            <View style={[styles.editAvatarBadge, {backgroundColor: theme.colors.primary}]}>
              <Text style={styles.editAvatarText}>+</Text>
            </View>
          </TouchableOpacity>
          
          {!isEditing && (
            <View style={styles.profileInfo}>
              <Text style={[styles.displayName, {color: theme.colors.onSurface}]}>
                {profile.displayName}
              </Text>
              <Text style={styles.position}>{profile.position}</Text>
            </View>
          )}
        </View>
        
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, {color: theme.colors.onSurface}]}>
                {t('personal_information')}
              </Text>
              <Button 
                onPress={handleEditToggle}
                mode={isEditing ? "outlined" : "text"}
              >
                {isEditing ? t('cancel') : t('edit')}
              </Button>
            </View>
            
            <Divider style={styles.divider} />
            
            {isEditing ? (
              <View style={styles.formContainer}>
                <TextInput
                  label={t('name')}
                  value={editableProfile.displayName}
                  onChangeText={text => setEditableProfile({...editableProfile, displayName: text})}
                  mode="outlined"
                  style={styles.input}
                />
                
                <TextInput
                  label={t('email')}
                  value={editableProfile.email}
                  onChangeText={text => setEditableProfile({...editableProfile, email: text})}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="email-address"
                  disabled
                />
                
                <TextInput
                  label={t('phone')}
                  value={editableProfile.phoneNumber}
                  onChangeText={text => setEditableProfile({...editableProfile, phoneNumber: text})}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="phone-pad"
                />
                
                <TextInput
                  label={t('position')}
                  value={editableProfile.position}
                  onChangeText={text => setEditableProfile({...editableProfile, position: text})}
                  mode="outlined"
                  style={styles.input}
                />
                
                <Button
                  mode="contained"
                  onPress={handleSaveProfile}
                  style={styles.saveButton}
                  loading={isSaving}
                  disabled={isSaving}
                >
                  {t('save_changes')}
                </Button>
              </View>
            ) : (
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('name')}</Text>
                  <Text style={styles.detailValue}>{profile.displayName}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('email')}</Text>
                  <Text style={styles.detailValue}>{profile.email}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('phone')}</Text>
                  <Text style={styles.detailValue}>
                    {profile.phoneNumber || t('not_provided')}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('position')}</Text>
                  <Text style={styles.detailValue}>
                    {profile.position || t('not_provided')}
                  </Text>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={[styles.cardTitle, {color: theme.colors.onSurface}]}>
              {t('preferences')}
            </Text>
            
            <Divider style={styles.divider} />
            
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceTextContainer}>
                <Text style={styles.preferenceTitle}>{t('notifications')}</Text>
                <Text style={styles.preferenceDescription}>
                  {t('notifications_description')}
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                color={theme.colors.primary}
              />
            </View>
            
            <Divider style={styles.itemDivider} />
            
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceTextContainer}>
                <Text style={styles.preferenceTitle}>{t('dark_mode')}</Text>
                <Text style={styles.preferenceDescription}>
                  {t('dark_mode_description')}
                </Text>
              </View>
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                color={theme.colors.primary}
              />
            </View>
            
            <Divider style={styles.itemDivider} />
            
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceTextContainer}>
                <Text style={styles.preferenceTitle}>{t('biometric_auth')}</Text>
                <Text style={styles.preferenceDescription}>
                  {t('biometric_auth_description')}
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                color={theme.colors.primary}
              />
            </View>
          </Card.Content>
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button mode="outlined" style={styles.logoutButton}>
            {t('logout')}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileHeaderContainer: {
    alignItems: 'center',
    padding: 24,
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    backgroundColor: '#ccc',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    alignItems: 'center',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  position: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  itemDivider: {
    marginVertical: 8,
  },
  formContainer: {
    gap: 12,
  },
  input: {
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 16,
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  preferenceTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    padding: 16,
    marginBottom: 24,
  },
  logoutButton: {
    borderColor: '#F44336',
  },
});

export default UserProfileScreen;
