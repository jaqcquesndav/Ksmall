import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { 
  Appbar, TextInput, Button, SegmentedButtons, 
  RadioButton, Text, Avatar, useTheme 
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import logger from '../../utils/logger';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';

type UserProfileScreenProps = NativeStackScreenProps<MainStackParamList, 'UserProfile'>;

interface ProfileFormData {
  photoURL: string | null;
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  maritalStatus: string;
  idNumber: string;
  spouses: { name: string; idNumber: string }[];
  children: number;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    coordinates: { latitude: number | null; longitude: number | null };
  };
  phoneNumber: string;
  useBiometrics: boolean;
}

const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    photoURL: user?.photoURL || null,
    firstName: user?.displayName?.split(' ')[0] || '',
    lastName: user?.displayName?.split(' ')[1] || '',
    gender: 'male',
    birthDate: '',
    maritalStatus: 'single',
    idNumber: '',
    spouses: [],
    children: 0,
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: '',
      coordinates: { latitude: null, longitude: null }
    },
    phoneNumber: user?.phoneNumber || '',
    useBiometrics: false
  });
  
  const [currentTab, setCurrentTab] = useState<string>('personal');

  const updateUserProfile = async (userData: any) => {
    // Mock implementation
    console.log('Updating user profile:', userData);
    return Promise.resolve();
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update du profil utilisateur
      await updateUserProfile({
        displayName: `${formData.firstName} ${formData.lastName}`.trim(),
        photoURL: formData.photoURL,
        phoneNumber: formData.phoneNumber,
        // Autres données à synchroniser avec votre backend
      });

      // Sauvegarder les données complémentaires dans SQLite
      // Cela pourrait nécessiter un service dédié pour les profils utilisateurs

      Alert.alert(t('success'), t('profile_updated_successfully'));
    } catch (error) {
      logger.error('Failed to update profile', error);
      Alert.alert(t('error'), t('profile_update_failed'));
    } finally {
      setLoading(false);
    }
  };
  
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(t('permission_required'), t('camera_roll_permission_message'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      setFormData({
        ...formData,
        photoURL: result.assets[0].uri
      });
    }
  };
  
  const renderPersonalInfoTab = () => (
    <View>
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={pickImage}>
          {formData.photoURL ? (
            <Avatar.Image size={120} source={{ uri: formData.photoURL }} />
          ) : (
            <Avatar.Icon 
              size={120} 
              icon="account" 
              style={{ backgroundColor: theme.colors.primary }}
            />
          )}
          <Button mode="text" onPress={pickImage}>
            {t('change_photo')}
          </Button>
        </TouchableOpacity>
      </View>

      <TextInput
        label={t('first_name')}
        value={formData.firstName}
        onChangeText={(text) => setFormData({ ...formData, firstName: text })}
        style={styles.input}
      />
      
      <TextInput
        label={t('last_name')}
        value={formData.lastName}
        onChangeText={(text) => setFormData({ ...formData, lastName: text })}
        style={styles.input}
      />

      <Text style={styles.inputLabel}>{t('gender')}</Text>
      <SegmentedButtons
        value={formData.gender}
        onValueChange={(value) => setFormData({ ...formData, gender: value })}
        buttons={[
          { value: 'male', label: t('male') },
          { value: 'female', label: t('female') },
          { value: 'other', label: t('other') }
        ]}
        style={styles.segmentedButtons}
      />
      
      <TextInput
        label={t('birth_date')}
        value={formData.birthDate}
        onChangeText={(text) => setFormData({ ...formData, birthDate: text })}
        style={styles.input}
        placeholder="YYYY-MM-DD"
        keyboardType="numeric"
      />
      
      <Text style={styles.inputLabel}>{t('marital_status')}</Text>
      <RadioButton.Group
        value={formData.maritalStatus}
        onValueChange={(value) => setFormData({ ...formData, maritalStatus: value })}
      >
        <View style={styles.radioGroup}>
          <RadioButton.Item label={t('single')} value="single" />
          <RadioButton.Item label={t('married')} value="married" />
          <RadioButton.Item label={t('divorced')} value="divorced" />
          <RadioButton.Item label={t('widowed')} value="widowed" />
        </View>
      </RadioButton.Group>
    </View>
  );
  
  const renderIdentityTab = () => (
    <View>
      <TextInput
        label={t('id_number')}
        value={formData.idNumber}
        onChangeText={(text) => setFormData({ ...formData, idNumber: text })}
        style={styles.input}
      />
      
      {/* Ajoutez ici d'autres champs comme empreinte digitale, etc. */}
      
      {/* Section pour les conjoints si marié */}
      {formData.maritalStatus === 'married' && (
        <View>
          <Text style={styles.sectionTitle}>{t('spouse_information')}</Text>
          
          {formData.spouses.map((spouse, index) => (
            <View key={`spouse-${index}`} style={styles.spouseContainer}>
              <TextInput
                label={t('spouse_name')}
                value={spouse.name}
                onChangeText={(text) => {
                  const updatedSpouses = [...formData.spouses];
                  updatedSpouses[index].name = text;
                  setFormData({ ...formData, spouses: updatedSpouses });
                }}
                style={styles.input}
              />
              
              <TextInput
                label={t('spouse_id_number')}
                value={spouse.idNumber}
                onChangeText={(text) => {
                  const updatedSpouses = [...formData.spouses];
                  updatedSpouses[index].idNumber = text;
                  setFormData({ ...formData, spouses: updatedSpouses });
                }}
                style={styles.input}
              />
              
              <Button
                mode="outlined"
                icon="minus"
                onPress={() => {
                  const updatedSpouses = formData.spouses.filter((_, i) => i !== index);
                  setFormData({ ...formData, spouses: updatedSpouses });
                }}
                style={styles.removeButton}
              >
                {t('remove')}
              </Button>
            </View>
          ))}
          
          <Button
            mode="contained"
            icon="plus"
            onPress={() => {
              setFormData({
                ...formData,
                spouses: [...formData.spouses, { name: '', idNumber: '' }]
              });
            }}
            style={styles.addButton}
          >
            {t('add_spouse')}
          </Button>
        </View>
      )}
      
      <TextInput
        label={t('number_of_children')}
        value={formData.children.toString()}
        onChangeText={(text) => {
          const numChildren = parseInt(text) || 0;
          setFormData({ ...formData, children: numChildren });
        }}
        style={styles.input}
        keyboardType="numeric"
      />
    </View>
  );
  
  const renderContactTab = () => (
    <View>
      <TextInput
        label={t('street_address')}
        value={formData.address.street}
        onChangeText={(text) => {
          setFormData({
            ...formData,
            address: { ...formData.address, street: text }
          });
        }}
        style={styles.input}
      />
      
      <TextInput
        label={t('city')}
        value={formData.address.city}
        onChangeText={(text) => {
          setFormData({
            ...formData,
            address: { ...formData.address, city: text }
          });
        }}
        style={styles.input}
      />
      
      <TextInput
        label={t('postal_code')}
        value={formData.address.postalCode}
        onChangeText={(text) => {
          setFormData({
            ...formData,
            address: { ...formData.address, postalCode: text }
          });
        }}
        style={styles.input}
        keyboardType="numeric"
      />
      
      <TextInput
        label={t('country')}
        value={formData.address.country}
        onChangeText={(text) => {
          setFormData({
            ...formData,
            address: { ...formData.address, country: text }
          });
        }}
        style={styles.input}
      />
      
      <TextInput
        label={t('phone_number')}
        value={formData.phoneNumber}
        onChangeText={(text) => {
          setFormData({ ...formData, phoneNumber: text });
        }}
        style={styles.input}
        keyboardType="phone-pad"
      />
      
      <Button
        mode="outlined"
        icon="map-marker"
        onPress={() => {
          // Ouvrir un écran pour sélectionner la position sur une carte
          Alert.alert(t('feature_coming_soon'));
        }}
        style={styles.locationButton}
      >
        {t('set_location')}
      </Button>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('my_profile')} />
        <Appbar.Action icon="check" onPress={handleSave} disabled={loading} />
      </Appbar.Header>
      
      <SegmentedButtons
        value={currentTab}
        onValueChange={setCurrentTab}
        buttons={[
          { value: 'personal', label: t('personal') },
          { value: 'identity', label: t('identity') },
          { value: 'contact', label: t('contact') }
        ]}
        style={styles.tabs}
      />
      
      <ScrollView style={styles.scrollContent}>
        {currentTab === 'personal' && renderPersonalInfoTab()}
        {currentTab === 'identity' && renderIdentityTab()}
        {currentTab === 'contact' && renderContactTab()}
        
        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          style={styles.saveButton}
        >
          {t('save_profile')}
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
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  tabs: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  radioGroup: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  spouseContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  addButton: {
    marginVertical: 8,
  },
  removeButton: {
    marginTop: 8,
  },
  locationButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  saveButton: {
    marginVertical: 24,
  },
});

export default UserProfileScreen;
