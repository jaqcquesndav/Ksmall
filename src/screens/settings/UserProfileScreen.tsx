import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Avatar,
  TextInput,
  Button,
  Text,
  List,
  HelperText,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import AppHeader from '../../components/common/AppHeader';
import logger from '../../utils/logger';
import { useDispatch } from 'react-redux';
// Ensure the correct path to the userActions file
import { updateUserProfile } from '../../store/userActions';
import UserService from '../../services/UserService';

interface UserFormData {
  displayName: string;
  email: string;
  phoneNumber: string;
  photoURL: string | null;
  position: string;
  language: string;
}

const UserProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<UserFormData>({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    photoURL: user?.photoURL || null,
    position: user?.position || '',
    language: user?.language || 'fr',
  });

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(t('permission_required'), t('camera_roll_permission_message'));
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0].uri) {
        const selectedImage = result.assets[0];
        const avatarUri = selectedImage.uri;
        
        const updatedUser = await UserService.updateUserAvatar(avatarUri);
        
        if (updatedUser) {
          dispatch(updateUserProfile(updatedUser));
          setFormData(prev => ({
            ...prev,
            photoURL: avatarUri
          }));
        }
      }
    } catch (error) {
      logger.error('Error picking image:', error);
      Alert.alert(t('error'), t('image_picker_error'));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = t('name_required');
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('email_required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('email_invalid');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      // Fix the type issue by matching properties in the User interface
      await UserService.updateUserProfile({
        id: typeof user?.id === 'string' ? user.id : '',
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        photoURL: formData.photoURL,
        position: formData.position,
        language: formData.language,
        email: formData.email
      });
      
      Alert.alert(t('success'), t('profile_updated_successfully'));
    } catch (error) {
      logger.error('Error updating profile:', error);
      Alert.alert(t('error'), t('profile_update_failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AppHeader 
        title={t('user_profile')} 
        showBack
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handlePickImage}>
            {formData.photoURL ? (
              <Avatar.Image
                size={120}
                source={{ uri: formData.photoURL }}
              />
            ) : (
              <Avatar.Text 
                size={120} 
                label={formData.displayName?.[0] || 'U'} 
              />
            )}
          </TouchableOpacity>
          <Button
            mode="text"
            onPress={handlePickImage}
            style={styles.changePhotoButton}
          >
            {t('change_photo')}
          </Button>
        </View>

        <Text style={styles.sectionTitle}>{t('personal_information')}</Text>
        
        <TextInput
          label={t('full_name')}
          value={formData.displayName}
          onChangeText={(text) => setFormData({...formData, displayName: text})}
          style={styles.input}
          error={!!errors.displayName}
        />
        {errors.displayName && <HelperText type="error">{errors.displayName}</HelperText>}
        
        <TextInput
          label={t('email')}
          value={formData.email}
          onChangeText={(text) => setFormData({...formData, email: text})}
          style={styles.input}
          disabled={true} // Email usually can't be changed without verification
          error={!!errors.email}
        />
        {errors.email && <HelperText type="error">{errors.email}</HelperText>}
        
        <TextInput
          label={t('phone_number')}
          value={formData.phoneNumber}
          onChangeText={(text) => setFormData({...formData, phoneNumber: text})}
          style={styles.input}
          keyboardType="phone-pad"
        />
        
        <TextInput
          label={t('position')}
          value={formData.position}
          onChangeText={(text) => setFormData({...formData, position: text})}
          style={styles.input}
        />

        <Divider style={styles.divider} />

        <Text style={styles.sectionTitle}>{t('preferences')}</Text>
        
        <List.Section>
          <List.Item
            title={t('language')}
            description={formData.language === 'fr' ? 'Français' : 'English'}
            left={props => <List.Icon {...props} icon="translate" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // Toggle language for demo
              setFormData({
                ...formData,
                language: formData.language === 'fr' ? 'en' : 'fr'
              });
            }}
          />
        </List.Section>
        
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={saving}
          style={styles.saveButton}
        >
          {t('save_changes')}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  changePhotoButton: {
    marginTop: 8,
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  saveButton: {
    marginVertical: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 24,
  },
});

export default UserProfileScreen;
