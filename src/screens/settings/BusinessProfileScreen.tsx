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
  TextInput,
  Button,
  SegmentedButtons,
  Text,
  Avatar,
  useTheme,
  List,
  DataTable,
  Divider,
  IconButton,
  Menu
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import logger from '../../utils/logger';
import AppHeader from '../../components/common/AppHeader';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';

type BusinessProfileScreenProps = NativeStackScreenProps<MainStackParamList, 'BusinessProfile'>;

interface BusinessFormData {
  name: string;
  logo: string | null;
  legalForm: string;
  taxNumber: string; // NIF
  idNat: string;
  rccm: string;
  patent: string;
  employeeCount: number;
  creationDate: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    coordinates: { latitude: number | null; longitude: number | null };
  };
  phoneNumber: string;
  email: string;
  website: string;
  associates: {
    name: string;
    contribution: number;
    percentage: number;
    role: string;
  }[];
}

const BusinessProfileScreen: React.FC<BusinessProfileScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>('info');
  const [showAssociateMenu, setShowAssociateMenu] = useState(false);
  const [selectedAssociate, setSelectedAssociate] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<BusinessFormData>({
    name: user?.company || '',
    logo: null,
    legalForm: 'individual',
    taxNumber: '',
    idNat: '',
    rccm: '',
    patent: '',
    employeeCount: 1,
    creationDate: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: '',
      coordinates: { latitude: null, longitude: null }
    },
    phoneNumber: '',
    email: '',
    website: '',
    associates: [
      // Par défaut, l'utilisateur actuel est un associé
      {
        name: user?.displayName || '',
        contribution: 0,
        percentage: 100, // Propriétaire unique par défaut
        role: 'owner'
      }
    ]
  });
  
  const handleSave = async () => {
    setLoading(true);
    try {
      // Sauvegarder les données dans SQLite
      // À implémenter avec un service dédié pour les profils d'entreprise
      
      Alert.alert(t('success'), t('business_profile_updated'));
    } catch (error) {
      logger.error('Failed to update business profile', error);
      Alert.alert(t('error'), t('business_profile_update_failed'));
    } finally {
      setLoading(false);
    }
  };
  
  const pickLogo = async () => {
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
        logo: result.assets[0].uri
      });
    }
  };
  
  const addAssociate = () => {
    setFormData({
      ...formData,
      associates: [
        ...formData.associates,
        {
          name: '',
          contribution: 0,
          percentage: 0,
          role: 'associate'
        }
      ]
    });
  };
  
  const removeAssociate = (index: number) => {
    if (index === 0) {
      // Ne pas supprimer le propriétaire principal
      Alert.alert(t('error'), t('cannot_remove_primary_owner'));
      return;
    }
    
    const newAssociates = [...formData.associates];
    newAssociates.splice(index, 1);
    
    // Recalculer les pourcentages
    const totalContribution = newAssociates.reduce((sum, associate) => sum + associate.contribution, 0);
    
    if (totalContribution > 0) {
      newAssociates.forEach(associate => {
        associate.percentage = (associate.contribution / totalContribution) * 100;
      });
    }
    
    setFormData({
      ...formData,
      associates: newAssociates
    });
  };
  
  const updateAssociateContribution = (index: number, contribution: number) => {
    const newAssociates = [...formData.associates];
    newAssociates[index].contribution = contribution;
    
    // Recalculer les pourcentages
    const totalContribution = newAssociates.reduce((sum, associate) => sum + associate.contribution, 0);
    
    if (totalContribution > 0) {
      newAssociates.forEach(associate => {
        associate.percentage = (associate.contribution / totalContribution) * 100;
      });
    }
    
    setFormData({
      ...formData,
      associates: newAssociates
    });
  };
  
  const renderInfoTab = () => (
    <View>
      <View style={styles.logoContainer}>
        <TouchableOpacity onPress={pickLogo}>
          {formData.logo ? (
            <Avatar.Image size={120} source={{ uri: formData.logo }} />
          ) : (
            <Avatar.Icon 
              size={120} 
              icon="domain" 
              style={{ backgroundColor: theme.colors.primary }}
            />
          )}
          <Button mode="text" onPress={pickLogo}>
            {t('change_logo')}
          </Button>
        </TouchableOpacity>
      </View>

      <TextInput
        label={t('business_name')}
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        style={styles.input}
      />
      
      <Text style={styles.inputLabel}>{t('legal_form')}</Text>
      <SegmentedButtons
        value={formData.legalForm}
        onValueChange={(value) => setFormData({ ...formData, legalForm: value })}
        buttons={[
          { value: 'individual', label: t('individual') },
          { value: 'sarl', label: 'SARL' },
          { value: 'sa', label: 'SA' },
          { value: 'sas', label: 'SAS' }
        ]}
        style={styles.segmentedButtons}
      />
      
      <TextInput
        label={t('creation_date')}
        value={formData.creationDate}
        onChangeText={(text) => setFormData({ ...formData, creationDate: text })}
        style={styles.input}
        placeholder="YYYY-MM-DD"
      />
      
      <TextInput
        label={t('employee_count')}
        value={formData.employeeCount.toString()}
        onChangeText={(text) => {
          const count = parseInt(text) || 0;
          setFormData({ ...formData, employeeCount: count });
        }}
        style={styles.input}
        keyboardType="numeric"
      />
    </View>
  );
  
  const renderIdentificationTab = () => (
    <View>
      <TextInput
        label={t('tax_number')} // NIF
        value={formData.taxNumber}
        onChangeText={(text) => setFormData({ ...formData, taxNumber: text })}
        style={styles.input}
      />
      
      <TextInput
        label={t('id_nat')}
        value={formData.idNat}
        onChangeText={(text) => setFormData({ ...formData, idNat: text })}
        style={styles.input}
      />
      
      <TextInput
        label={t('rccm')}
        value={formData.rccm}
        onChangeText={(text) => setFormData({ ...formData, rccm: text })}
        style={styles.input}
      />
      
      <TextInput
        label={t('patent')}
        value={formData.patent}
        onChangeText={(text) => setFormData({ ...formData, patent: text })}
        style={styles.input}
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
      
      <TextInput
        label={t('email')}
        value={formData.email}
        onChangeText={(text) => {
          setFormData({ ...formData, email: text });
        }}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        label={t('website')}
        value={formData.website}
        onChangeText={(text) => {
          setFormData({ ...formData, website: text });
        }}
        style={styles.input}
        keyboardType="url"
        autoCapitalize="none"
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
  
  const renderAssociatesTab = () => (
    <View>
      <Text style={styles.sectionTitle}>{t('associates_partners')}</Text>
      
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>{t('name')}</DataTable.Title>
          <DataTable.Title numeric>{t('contribution')}</DataTable.Title>
          <DataTable.Title numeric>{t('percentage')}</DataTable.Title>
          <DataTable.Title>{t('role')}</DataTable.Title>
          <DataTable.Title>{t('actions')}</DataTable.Title>
        </DataTable.Header>

        {formData.associates.map((associate, index) => (
          <DataTable.Row key={`associate-${index}`}>
            <DataTable.Cell>
              <TextInput
                value={associate.name}
                onChangeText={(text) => {
                  const newAssociates = [...formData.associates];
                  newAssociates[index].name = text;
                  setFormData({ ...formData, associates: newAssociates });
                }}
                style={styles.tableInput}
              />
            </DataTable.Cell>
            <DataTable.Cell numeric>
              <TextInput
                value={associate.contribution.toString()}
                onChangeText={(text) => {
                  const contribution = parseFloat(text) || 0;
                  updateAssociateContribution(index, contribution);
                }}
                keyboardType="numeric"
                style={styles.tableInput}
              />
            </DataTable.Cell>
            <DataTable.Cell numeric>
              {associate.percentage.toFixed(1)}%
            </DataTable.Cell>
            <DataTable.Cell>
              <TextInput
                value={associate.role}
                onChangeText={(text) => {
                  const newAssociates = [...formData.associates];
                  newAssociates[index].role = text;
                  setFormData({ ...formData, associates: newAssociates });
                }}
                style={styles.tableInput}
              />
            </DataTable.Cell>
            <DataTable.Cell>
              <View style={{ position: 'relative' }}>
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => {
                    setSelectedAssociate(index);
                    setShowAssociateMenu(true);
                  }}
                />
                
                {showAssociateMenu && selectedAssociate === index && (
                  <Menu
                    visible={showAssociateMenu}
                    onDismiss={() => setShowAssociateMenu(false)}
                    anchor={{ x: 0, y: 0 }}
                  >
                    <Menu.Item
                      title={t('edit')}
                      leadingIcon="pencil"
                      onPress={() => {
                        setShowAssociateMenu(false);
                        // Vous pourriez ouvrir un modal pour l'édition complète ici
                      }}
                    />
                    <Menu.Item
                      title={t('remove')}
                      leadingIcon="delete"
                      onPress={() => {
                        setShowAssociateMenu(false);
                        removeAssociate(index);
                      }}
                      disabled={index === 0} // Désactiver la suppression pour le propriétaire principal
                    />
                  </Menu>
                )}
              </View>
            </DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>
      
      <Button
        mode="contained"
        icon="plus"
        onPress={addAssociate}
        style={styles.addButton}
      >
        {t('add_associate')}
      </Button>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AppHeader 
        title={t('business_profile')}
        showBack
      />
      
      <SegmentedButtons
        value={currentTab}
        onValueChange={setCurrentTab}
        buttons={[
          { value: 'info', label: t('info') },
          { value: 'id', label: t('identification') },
          { value: 'contact', label: t('contact') },
          { value: 'associates', label: t('associates') }
        ]}
        style={styles.tabs}
      />
      
      <ScrollView style={styles.scrollContent}>
        {currentTab === 'info' && renderInfoTab()}
        {currentTab === 'id' && renderIdentificationTab()}
        {currentTab === 'contact' && renderContactTab()}
        {currentTab === 'associates' && renderAssociatesTab()}
        
        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          style={styles.saveButton}
        >
          {t('save_business_profile')}
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
  logoContainer: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 16,
  },
  addButton: {
    marginVertical: 16,
  },
  saveButton: {
    marginVertical: 24,
  },
  locationButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  tableInput: {
    height: 30,
    fontSize: 14,
    padding: 0,
    backgroundColor: 'transparent',
  },
});

export default BusinessProfileScreen;
