import React from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { Text, Button, Divider, List, Avatar, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import AppHeader from '../../components/common/AppHeader';

const AboutScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const appVersion = '1.0.0'; // Use a constant since package.json might not be accessible
  
  const handleOpenWebsite = () => {
    Linking.openURL('https://ksmall.app');
  };
  
  const handleOpenPrivacyPolicy = () => {
    Linking.openURL('https://ksmall.app/privacy');
  };
  
  const handleOpenTerms = () => {
    Linking.openURL('https://ksmall.app/terms');
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        title={t('about')} 
        showBack
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Avatar.Icon 
            size={100}
            icon="shopping"
            style={{ backgroundColor: theme.colors.primary }}
          />
          <Text style={styles.appName}>KSMall</Text>
          <Text style={styles.version}>{t('version')} {appVersion}</Text>
        </View>
        
        <Text style={styles.description}>
          {t('app_description', 'KSMall est une application de gestion commerciale conçue pour simplifier la comptabilité et l\'inventaire pour les petites et moyennes entreprises.')}
        </Text>
        
        <Button 
          mode="outlined" 
          onPress={handleOpenWebsite}
          style={styles.websiteButton}
        >
          {t('visit_website')}
        </Button>
        
        <Divider style={styles.divider} />
        
        <List.Section>
          <List.Item
            title={t('privacy_policy')}
            description={t('privacy_policy_description', 'Comment nous protégeons vos données')}
            left={props => <List.Icon {...props} icon="shield-account" />}
            onPress={handleOpenPrivacyPolicy}
          />
          
          <List.Item
            title={t('terms_of_service')}
            description={t('terms_description', 'Conditions d\'utilisation du service')}
            left={props => <List.Icon {...props} icon="file-document" />}
            onPress={handleOpenTerms}
          />
          
          <List.Item
            title={t('licenses')}
            description={t('licenses_description', 'Licences des bibliothèques tierces')}
            left={props => <List.Icon {...props} icon="license" />}
            onPress={() => {}}
          />
        </List.Section>
        
        <View style={styles.creditsContainer}>
          <Text style={styles.credits}>© 2023 KSMall. {t('all_rights_reserved')}</Text>
          <Text style={styles.credits}>{t('made_with_love', 'Fait avec ❤️')}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 4,
  },
  version: {
    color: '#666',
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  websiteButton: {
    marginBottom: 24,
  },
  divider: {
    width: '100%',
    marginBottom: 16,
  },
  creditsContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  credits: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  }
});

export default AboutScreen;
