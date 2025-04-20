import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Avatar, Divider, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import AppHeader from '../../components/common/AppHeader';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import logger from '../../utils/logger';
import * as CompanyService from '../../services/CompanyService';

const BusinessProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  
  const [loading, setLoading] = useState(true);
  const [businessData, setBusinessData] = useState({
    name: 'KSmall Enterprise',
    legalForm: 'SARL',
    industry: 'Technology',
    taxId: 'FR123456789',
    email: 'contact@ksmall.com',
    phone: '+225 01 23 45 67 89',
    website: 'www.ksmall.com',
    foundedYear: '2020',
    employees: '12',
    address: {
      street: '25 Avenue des Technologies',
      city: 'Abidjan',
      zipCode: '00225',
      country: 'Côte d\'Ivoire',
    },
    logo: null // URL would go here in real implementation
  });
  
  // Charger les données de l'entreprise au chargement de l'écran
  useEffect(() => {
    loadCompanyData();
  }, []);

  // Récupérer les données de l'entreprise depuis la base de données
  const loadCompanyData = async () => {
    try {
      setLoading(true);
      const companyInfo = await CompanyService.getCompanyInfo();
      
      if (companyInfo) {
        setBusinessData({
          name: companyInfo.name || 'Mon Entreprise',
          legalForm: companyInfo.legalForm || 'Non défini',
          industry: 'Technology', // Information actuellement non stockée dans CompanyInfo
          taxId: companyInfo.taxId || 'Non défini',
          email: companyInfo.email || 'Non défini',
          phone: companyInfo.phone || 'Non défini',
          website: companyInfo.website || 'Non défini',
          foundedYear: companyInfo.creationDate || 'Non défini',
          employees: companyInfo.employeeCount?.toString() || '0',
          address: {
            street: companyInfo.address?.street || 'Non défini',
            city: companyInfo.address?.city || 'Non défini',
            zipCode: companyInfo.address?.postalCode || 'Non défini',
            country: companyInfo.address?.country || 'Non défini',
          },
          logo: companyInfo.logo || null
        });
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des données d\'entreprise:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour naviguer vers l'écran d'édition
  const handleEditProfile = () => {
    navigation.navigate('BusinessProfileEdit');
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <AppHeader title={t('business_profile')} showBack />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.logoContainer}>
          {businessData.logo ? (
            <Avatar.Image size={100} source={{ uri: businessData.logo }} />
          ) : (
            <Avatar.Text size={100} label={businessData.name.substr(0, 2).toUpperCase()} />
          )}
        </View>
        
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.businessName}>{businessData.name}</Title>
            <Paragraph style={styles.businessType}>{businessData.legalForm}</Paragraph>
            
            <Divider style={styles.divider} />
            
            <View style={styles.section}>
              <Title style={styles.sectionTitle}>{t('contact_information')}</Title>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{t('email')}</Text>
                <Text style={styles.fieldValue}>{businessData.email}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{t('phone')}</Text>
                <Text style={styles.fieldValue}>{businessData.phone}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{t('website')}</Text>
                <Text style={styles.fieldValue}>{businessData.website}</Text>
              </View>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.section}>
              <Title style={styles.sectionTitle}>{t('business_address')}</Title>
              <Paragraph>{businessData.address.street}</Paragraph>
              <Paragraph>{businessData.address.city}, {businessData.address.zipCode}</Paragraph>
              <Paragraph>{businessData.address.country}</Paragraph>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.section}>
              <Title style={styles.sectionTitle}>{t('business_details')}</Title>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{t('tax_id')}</Text>
                <Text style={styles.fieldValue}>{businessData.taxId}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{t('founded_in')}</Text>
                <Text style={styles.fieldValue}>{businessData.foundedYear}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{t('employees')}</Text>
                <Text style={styles.fieldValue}>{businessData.employees}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        <Button 
          mode="contained" 
          style={styles.editButton}
          onPress={handleEditProfile}
        >
          {t('edit_profile')}
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  businessType: {
    color: '#666',
    fontSize: 16,
  },
  section: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  fieldLabel: {
    color: '#666',
    flex: 1,
  },
  fieldValue: {
    flex: 2,
    fontWeight: '500',
  },
  editButton: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default BusinessProfileScreen;
