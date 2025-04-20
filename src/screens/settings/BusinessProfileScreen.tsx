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
  Menu,
  ActivityIndicator
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import logger from '../../utils/logger';
import AppHeader from '../../components/common/AppHeader';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import useOrientation from '../../hooks/useOrientation';
import * as CompanyService from '../../services/CompanyService';
import { CompanyInfo } from '../../services/CompanyService';
import eventEmitter from '../../utils/EventEmitter';

// Interface pour les données de localisation reçues via l'EventEmitter
interface LocationData {
  latitude: number;
  longitude: number;
  description?: string;
}

type BusinessProfileScreenProps = NativeStackScreenProps<MainStackParamList, 'BusinessProfile'>;

interface BusinessFormData {
  name: string;
  logo: string | null;
  
  // Forme juridique
  legalForm: string;         // 'ETs', 'SARLU', 'SARL', 'SAS', 'SA', 'SNC', 'SCS', 'GIE', 'OTHER'
  
  // Identifiants nationaux
  taxNumber: string;         // NIF (Numéro d'Identification Fiscale)
  idNat: string;             // ID National
  rccm: string;              // RCCM (Registre du Commerce et du Crédit Mobilier)
  cnssNumber: string;        // CNSS
  inppNumber: string;        // INPP
  patent: string;            // Numéro de Patente (pour les petites entreprises/commerce)
  
  // Informations générales
  employeeCount: number;
  creationDate: string;
  
  // Adresse
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    coordinates: { latitude: number | null; longitude: number | null };
  };
  
  // Coordonnées géographiques multiples
  locations: {
    headquarters: { latitude: number | null; longitude: number | null; description: string };
    salesPoints: Array<{ 
      id: string;
      name: string;
      latitude: number | null; 
      longitude: number | null; 
      description: string 
    }>;
    productionSites: Array<{ 
      id: string;
      name: string;
      latitude: number | null; 
      longitude: number | null; 
      description: string 
    }>;
  };
  
  // Contact
  phoneNumber: string;
  email: string;
  website: string;
  
  // Associés
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
  const { isLandscape, dimensions } = useOrientation();
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<string>('info');
  const [showAssociateMenu, setShowAssociateMenu] = useState(false);
  const [selectedAssociate, setSelectedAssociate] = useState<number | null>(null);
  
  const defaultFormData: BusinessFormData = {
    name: user?.company || '',
    logo: null,
    legalForm: 'individual',
    taxNumber: '',
    idNat: '',
    rccm: '',
    cnssNumber: '',
    inppNumber: '',
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
    locations: {
      headquarters: { latitude: null, longitude: null, description: '' },
      salesPoints: [],
      productionSites: []
    },
    phoneNumber: '',
    email: '',
    website: '',
    associates: [
      // Par défaut, l'utilisateur actuel est un associé
      {
        name: user?.displayName || '',
        contribution: 1000,
        percentage: 100, // Propriétaire unique par défaut
        role: 'owner'
      }
    ]
  };

  const [formData, setFormData] = useState<BusinessFormData>(defaultFormData);
  
  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    try {
      setInitialLoading(true);
      const companyInfo = await CompanyService.getCompanyInfo();
      
      if (companyInfo) {
        setFormData({
          name: companyInfo.name || defaultFormData.name,
          logo: companyInfo.logo || null,
          legalForm: companyInfo.legalForm || defaultFormData.legalForm,
          taxNumber: companyInfo.taxId || '',
          idNat: companyInfo.idNat || '',
          rccm: companyInfo.registrationNumber || '',
          cnssNumber: companyInfo.cnssNumber || '',
          inppNumber: companyInfo.inppNumber || '',
          patent: companyInfo.patentNumber || '',
          employeeCount: companyInfo.employeeCount || 1,
          creationDate: companyInfo.creationDate || '',
          address: {
            street: companyInfo.address?.street || '',
            city: companyInfo.address?.city || '',
            postalCode: companyInfo.address?.postalCode || '',
            country: companyInfo.address?.country || '',
            coordinates: { latitude: null, longitude: null }
          },
          locations: {
            headquarters: companyInfo.locations?.headquarters 
              ? { 
                  latitude: companyInfo.locations.headquarters.latitude || null, 
                  longitude: companyInfo.locations.headquarters.longitude || null,
                  description: companyInfo.locations.headquarters.description || '' 
                }
              : defaultFormData.locations.headquarters,
            salesPoints: companyInfo.locations?.salesPoints?.map(point => ({
              id: Date.now().toString() + Math.random().toString(),
              name: point.name,
              latitude: point.latitude,
              longitude: point.longitude,
              description: point.description || ''
            })) || [],
            productionSites: companyInfo.locations?.productionSites?.map(site => ({
              id: Date.now().toString() + Math.random().toString(),
              name: site.name,
              latitude: site.latitude,
              longitude: site.longitude,
              description: site.description || ''
            })) || []
          },
          phoneNumber: companyInfo.phone || '',
          email: companyInfo.email || '',
          website: companyInfo.website || '',
          associates: companyInfo.associates?.map(associate => ({
            name: associate.name,
            contribution: associate.contribution,
            percentage: associate.percentage,
            role: associate.role
          })) || defaultFormData.associates
        });
        
        logger.debug('Profil d\'entreprise chargé');
      }
    } catch (error) {
      logger.error('Erreur lors du chargement du profil d\'entreprise:', error);
      Alert.alert(t('error'), t('error_loading_profile'));
    } finally {
      setInitialLoading(false);
    }
  };
  
  const handleSave = async () => {
    setLoading(true);
    try {
      // Convertir BusinessFormData en CompanyInfo
      const companyInfo: CompanyInfo = {
        name: formData.name,
        legalForm: formData.legalForm,
        registrationNumber: formData.rccm,
        taxId: formData.taxNumber,
        idNat: formData.idNat,
        cnssNumber: formData.cnssNumber,
        inppNumber: formData.inppNumber,
        patentNumber: formData.patent,
        phone: formData.phoneNumber,
        email: formData.email,
        website: formData.website,
        logo: formData.logo,
        creationDate: formData.creationDate,
        employeeCount: formData.employeeCount,
        address: {
          street: formData.address.street,
          city: formData.address.city,
          postalCode: formData.address.postalCode,
          country: formData.address.country
        },
        locations: {
          headquarters: formData.locations.headquarters.latitude && formData.locations.headquarters.longitude 
            ? {
                latitude: formData.locations.headquarters.latitude,
                longitude: formData.locations.headquarters.longitude,
                description: formData.locations.headquarters.description
              }
            : undefined,
          salesPoints: formData.locations.salesPoints
            .filter(point => point.latitude !== null && point.longitude !== null)
            .map(point => ({
              name: point.name,
              latitude: point.latitude!,
              longitude: point.longitude!,
              description: point.description
            })),
          productionSites: formData.locations.productionSites
            .filter(site => site.latitude !== null && site.longitude !== null)
            .map(site => ({
              name: site.name,
              latitude: site.latitude!,
              longitude: site.longitude!,
              description: site.description
            }))
        },
        associates: formData.associates,
        // Ajouter l'ID de l'utilisateur actuel pour éviter l'erreur de constraint
        userId: user?.id?.toString() || ''
      };
      
      // Utiliser saveCompanyInfo au lieu de updateCompanyInfo
      await CompanyService.saveCompanyInfo(companyInfo);
      
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
      Alert.alert(t('error'), t('cannot_remove_primary_owner'));
      return;
    }
    
    const newAssociates = [...formData.associates];
    newAssociates.splice(index, 1);
    
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
    <View style={styles.tabContent}>
      <View style={[styles.logoContainer, isLandscape && styles.logoContainerLandscape]}>
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
        label={t('rccm')}
        value={formData.rccm}
        onChangeText={(text) => setFormData({ ...formData, rccm: text })}
        style={styles.input}
        placeholder="Numéro de RCCM"
      />
      
      <TextInput
        label={t('id_nat')}
        value={formData.idNat}
        onChangeText={(text) => setFormData({ ...formData, idNat: text })}
        style={styles.input}
        placeholder="Numéro ID National"
      />
      
      <TextInput
        label={t('tax_number')} // NIF
        value={formData.taxNumber}
        onChangeText={(text) => setFormData({ ...formData, taxNumber: text })}
        style={styles.input}
        placeholder="Numéro d'Impôt (NIF)"
      />
      
      <TextInput
        label={t('cnss_number')}
        value={formData.cnssNumber}
        onChangeText={(text) => setFormData({ ...formData, cnssNumber: text })}
        style={styles.input}
        placeholder="Numéro CNSS"
      />
      
      <TextInput
        label={t('inpp_number')}
        value={formData.inppNumber}
        onChangeText={(text) => setFormData({ ...formData, inppNumber: text })}
        style={styles.input}
        placeholder="Numéro INPP"
      />
      
      <TextInput
        label={t('patent')}
        value={formData.patent}
        onChangeText={(text) => setFormData({ ...formData, patent: text })}
        style={styles.input}
        placeholder="Numéro de Patente (pour TPE)"
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
          // Créer un ID d'événement unique pour cette sélection
          const eventId = `location_headquarters_${Date.now()}`;
          
          // S'abonner à l'événement de sélection de localisation une seule fois
          const unsubscribe = eventEmitter.once<LocationData>(eventId, (location) => {
            setFormData({
              ...formData,
              locations: {
                ...formData.locations,
                headquarters: { 
                  ...formData.locations.headquarters, 
                  latitude: location.latitude,
                  longitude: location.longitude
                }
              }
            });
          });
          
          // Naviguer vers MapSelector avec l'ID d'événement
          navigation.navigate('MapSelector', { eventId });
        }}
        style={styles.locationButton}
      >
        {t('select_on_map')}
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
                      }}
                    />
                    <Menu.Item
                      title={t('remove')}
                      leadingIcon="delete"
                      onPress={() => {
                        setShowAssociateMenu(false);
                        removeAssociate(index);
                      }}
                      disabled={index === 0}
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

  const renderLocationsTab = () => (
    <View>
      <Text style={styles.sectionTitle}>{t('locations')}</Text>
      
      <Text style={styles.subSectionTitle}>{t('headquarters')}</Text>
      <View style={styles.locationFields}>
        <TextInput
          label={t('description')}
          value={formData.locations.headquarters.description}
          onChangeText={(text) => {
            setFormData({
              ...formData,
              locations: {
                ...formData.locations,
                headquarters: { ...formData.locations.headquarters, description: text }
              }
            });
          }}
          style={styles.input}
        />
        
        <View style={styles.coordinatesContainer}>
          <TextInput
            label={t('latitude')}
            value={formData.locations.headquarters.latitude?.toString() || ''}
            onChangeText={(text) => {
              const latitude = parseFloat(text) || null;
              setFormData({
                ...formData,
                locations: {
                  ...formData.locations,
                  headquarters: { ...formData.locations.headquarters, latitude }
                }
              });
            }}
            style={[styles.input, styles.coordinateInput]}
            keyboardType="numeric"
            disabled={true}
          />
          <TextInput
            label={t('longitude')}
            value={formData.locations.headquarters.longitude?.toString() || ''}
            onChangeText={(text) => {
              const longitude = parseFloat(text) || null;
              setFormData({
                ...formData,
                locations: {
                  ...formData.locations,
                  headquarters: { ...formData.locations.headquarters, longitude }
                }
              });
            }}
            style={[styles.input, styles.coordinateInput]}
            keyboardType="numeric"
            disabled={true}
          />
        </View>
        
        <Button
          mode="outlined"
          icon="map-marker"
          onPress={() => {
            // Créer un ID d'événement unique pour cette sélection
            const eventId = `location_headquarters_map_${Date.now()}`;
            
            // S'abonner à l'événement de sélection de localisation une seule fois
            const unsubscribe = eventEmitter.once<LocationData>(eventId, (location) => {
              setFormData({
                ...formData,
                locations: {
                  ...formData.locations,
                  headquarters: { 
                    ...formData.locations.headquarters, 
                    latitude: location.latitude,
                    longitude: location.longitude
                  }
                }
              });
            });
            
            // Naviguer vers MapSelector avec l'ID d'événement
            navigation.navigate('MapSelector', { eventId });
          }}
          style={styles.locationButton}
        >
          {t('select_on_map')}
        </Button>
      </View>
      
      <Text style={styles.subSectionTitle}>{t('sales_points')}</Text>
      {formData.locations.salesPoints.map((point, index) => (
        <View key={`sales-point-${index}`} style={styles.locationContainer}>
          <TextInput
            label={t('name')}
            value={point.name}
            onChangeText={(text) => {
              const newSalesPoints = [...formData.locations.salesPoints];
              newSalesPoints[index].name = text;
              setFormData({
                ...formData,
                locations: { ...formData.locations, salesPoints: newSalesPoints }
              });
            }}
            style={styles.input}
          />
          <TextInput
            label={t('latitude')}
            value={point.latitude?.toString() || ''}
            onChangeText={(text) => {
              const latitude = parseFloat(text) || null;
              const newSalesPoints = [...formData.locations.salesPoints];
              newSalesPoints[index].latitude = latitude;
              setFormData({
                ...formData,
                locations: { ...formData.locations, salesPoints: newSalesPoints }
              });
            }}
            style={styles.input}
            keyboardType="numeric"
          />
          <TextInput
            label={t('longitude')}
            value={point.longitude?.toString() || ''}
            onChangeText={(text) => {
              const longitude = parseFloat(text) || null;
              const newSalesPoints = [...formData.locations.salesPoints];
              newSalesPoints[index].longitude = longitude;
              setFormData({
                ...formData,
                locations: { ...formData.locations, salesPoints: newSalesPoints }
              });
            }}
            style={styles.input}
            keyboardType="numeric"
          />
          <TextInput
            label={t('description')}
            value={point.description}
            onChangeText={(text) => {
              const newSalesPoints = [...formData.locations.salesPoints];
              newSalesPoints[index].description = text;
              setFormData({
                ...formData,
                locations: { ...formData.locations, salesPoints: newSalesPoints }
              });
            }}
            style={styles.input}
          />
        </View>
      ))}
      <Button
        mode="contained"
        icon="plus"
        onPress={() => {
          setFormData({
            ...formData,
            locations: {
              ...formData.locations,
              salesPoints: [
                ...formData.locations.salesPoints,
                { id: Date.now().toString(), name: '', latitude: null, longitude: null, description: '' }
              ]
            }
          });
        }}
        style={styles.addButton}
      >
        {t('add_sales_point')}
      </Button>
      
      <Text style={styles.subSectionTitle}>{t('production_sites')}</Text>
      {formData.locations.productionSites.map((site, index) => (
        <View key={`production-site-${index}`} style={styles.locationContainer}>
          <TextInput
            label={t('name')}
            value={site.name}
            onChangeText={(text) => {
              const newProductionSites = [...formData.locations.productionSites];
              newProductionSites[index].name = text;
              setFormData({
                ...formData,
                locations: { ...formData.locations, productionSites: newProductionSites }
              });
            }}
            style={styles.input}
          />
          <TextInput
            label={t('latitude')}
            value={site.latitude?.toString() || ''}
            onChangeText={(text) => {
              const latitude = parseFloat(text) || null;
              const newProductionSites = [...formData.locations.productionSites];
              newProductionSites[index].latitude = latitude;
              setFormData({
                ...formData,
                locations: { ...formData.locations, productionSites: newProductionSites }
              });
            }}
            style={styles.input}
            keyboardType="numeric"
          />
          <TextInput
            label={t('longitude')}
            value={site.longitude?.toString() || ''}
            onChangeText={(text) => {
              const longitude = parseFloat(text) || null;
              const newProductionSites = [...formData.locations.productionSites];
              newProductionSites[index].longitude = longitude;
              setFormData({
                ...formData,
                locations: { ...formData.locations, productionSites: newProductionSites }
              });
            }}
            style={styles.input}
            keyboardType="numeric"
          />
          <TextInput
            label={t('description')}
            value={site.description}
            onChangeText={(text) => {
              const newProductionSites = [...formData.locations.productionSites];
              newProductionSites[index].description = text;
              setFormData({
                ...formData,
                locations: { ...formData.locations, productionSites: newProductionSites }
              });
            }}
            style={styles.input}
          />
        </View>
      ))}
      <Button
        mode="contained"
        icon="plus"
        onPress={() => {
          setFormData({
            ...formData,
            locations: {
              ...formData.locations,
              productionSites: [
                ...formData.locations.productionSites,
                { id: Date.now().toString(), name: '', latitude: null, longitude: null, description: '' }
              ]
            }
          });
        }}
        style={styles.addButton}
      >
        {t('add_production_site')}
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
          { value: 'locations', label: t('locations') },
          { value: 'associates', label: t('associates') }
        ]}
        style={[styles.tabs, isLandscape && styles.tabsLandscape]}
      />
      
      <ScrollView 
        style={[styles.scrollContent, isLandscape && styles.scrollContentLandscape]}
        contentContainerStyle={isLandscape && styles.contentContainerLandscape}
      >
        {currentTab === 'info' && renderInfoTab()}
        {currentTab === 'id' && renderIdentificationTab()}
        {currentTab === 'contact' && renderContactTab()}
        {currentTab === 'locations' && renderLocationsTab()}
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
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
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
  locationContainer: {
    marginBottom: 16,
  },
  locationFields: {
    marginBottom: 16,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coordinateInput: {
    flex: 1,
    marginRight: 8,
  },
  tabContent: {
    flex: 1,
  },
  logoContainerLandscape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  tabsLandscape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  scrollContentLandscape: {
    flexDirection: 'row',
    padding: 8,
  },
  contentContainerLandscape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap', 
  },
  tabContentLandscape: {
    width: '48%',
  },
  inputLandscape: {
    width: '48%',
  },
});

export default BusinessProfileScreen;
