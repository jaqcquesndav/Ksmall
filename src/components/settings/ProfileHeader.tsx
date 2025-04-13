import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface ProfileHeaderProps {
  name: string;
  businessName: string;
  profileImage?: string | null;
  theme: any;
  onImageChange?: (uri: string) => void;
  onEditProfilePress: () => void;
}

/**
 * Reusable profile header component for settings screen
 * @param name - User name
 * @param businessName - Business name
 * @param profileImage - Profile image URI
 * @param theme - Theme object from ThemeContext
 * @param onImageChange - Function to execute when image is changed
 * @param onEditProfilePress - Function to execute when edit profile button is pressed
 */
const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  businessName,
  profileImage: initialProfileImage,
  theme,
  onImageChange,
  onEditProfilePress,
}) => {
  const [profileImage, setProfileImage] = useState<string | null>(initialProfileImage || null);
  
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        if (onImageChange) {
          onImageChange(imageUri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  return (
    <View style={[styles.profileSection, { backgroundColor: theme.colors.card }]}>
      <TouchableOpacity onPress={pickImage} style={styles.profileImageContainer}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.colors.primary + '40' }]}>
            <Ionicons name="person" size={40} color={theme.colors.primary} />
          </View>
        )}
        <View style={styles.editIconContainer}>
          <Ionicons name="camera" size={16} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
      
      <Text style={[styles.profileName, { color: theme.colors.text }]}>{name}</Text>
      <Text style={[styles.businessName, { color: theme.colors.text + '99' }]}>{businessName}</Text>
      
      <TouchableOpacity 
        style={[styles.editProfileButton, { backgroundColor: theme.colors.primary + '20' }]}
        onPress={onEditProfilePress}
      >
        <Text style={{ color: theme.colors.primary }}>Éditer profil</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  profileSection: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    margin: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 14,
    marginBottom: 16,
  },
  editProfileButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});

export default ProfileHeader;
