import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Avatar, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import AppHeader from '../../components/common/AppHeader';

const BusinessProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  
  // Sample business data - in a real app, this would come from a database or API
  const businessData = {
    name: 'KSmall Enterprise',
    type: 'SARL',
    industry: 'Technology',
    taxId: 'FR123456789',
    email: 'contact@ksmall.com',
    phone: '+225 01 23 45 67 89',
    address: {
      street: '25 Avenue des Technologies',
      city: 'Abidjan',
      zipCode: '00225',
      country: 'Côte d\'Ivoire',
    },
    website: 'www.ksmall.com',
    foundedYear: 2020,
    employees: 12,
    logo: null // URL would go here in real implementation
  };
  
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
            <Paragraph style={styles.businessType}>{businessData.type} • {businessData.industry}</Paragraph>
            
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
          onPress={() => console.log('Edit business profile')}
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
});

export default BusinessProfileScreen;
