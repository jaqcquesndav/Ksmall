import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Divider, Surface } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import AppHeader from '../../components/common/AppHeader';
import { useMainNavigation } from '../../hooks/useAppNavigation';
import logger from '../../utils/logger';
import useOrientation from '../../hooks/useOrientation';
import OrientationAwareView from '../../components/common/OrientationAwareView';

const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useMainNavigation();
  const { isLandscape } = useOrientation();

  const handleNavigateToSettings = (screenName: string) => {
    // Log the navigation attempt for debugging
    logger.debug(`Navigating to settings screen: ${screenName}`);
    
    // Use a type assertion to handle the navigation properly
    navigation.navigate(screenName as any);
  };

  // Organiser les sections de paramètres en deux colonnes pour le mode paysage
  const renderSettingsSections = () => {
    // Liste de toutes les sections
    const sections = [
      {
        title: 'account',
        items: [
          {
            title: 'user_profile',
            icon: 'account',
            onPress: () => navigation.navigate('UserProfile'),
          },
          {
            title: 'business_profile',
            icon: 'office-building',
            onPress: () => navigation.navigate('BusinessProfile'),
          },
          {
            title: 'user_management',
            icon: 'account-group',
            onPress: () => handleNavigateToSettings('UserManagement'),
          },
        ],
      },
      {
        title: 'subscription',
        items: [
          {
            title: 'manage_subscription',
            icon: 'star',
            description: 'subscription_management_desc',
            onPress: () => handleNavigateToSettings('Subscriptions'),
          },
          {
            title: 'buy_tokens',
            icon: 'currency-usd',
            description: 'token_purchase_desc',
            onPress: () => handleNavigateToSettings('TokenPurchase'),
          },
        ],
      },
      {
        title: 'payment',
        items: [
          {
            title: 'payment_methods',
            icon: 'credit-card',
            onPress: () => handleNavigateToSettings('PaymentMethods'),
          },
        ],
      },
      {
        title: 'app_settings',
        items: [
          {
            title: 'theme',
            icon: 'palette',
            onPress: () => handleNavigateToSettings('ThemeSettings'),
          },
          {
            title: 'security',
            icon: 'shield-lock',
            onPress: () => handleNavigateToSettings('SecuritySettings'),
          },
          {
            title: 'notifications',
            icon: 'bell',
            onPress: () => handleNavigateToSettings('NotificationSettings'),
          },
          {
            title: 'permissions',
            icon: 'key',
            onPress: () => handleNavigateToSettings('PermissionSettings'),
          },
        ],
      },
      {
        title: 'support',
        items: [
          {
            title: 'help_support',
            icon: 'help-circle',
            onPress: () => handleNavigateToSettings('HelpSupport'),
          },
          {
            title: 'about',
            icon: 'information',
            onPress: () => handleNavigateToSettings('About'),
          },
        ],
      },
    ];

    if (isLandscape) {
      // Division des sections en deux colonnes pour le mode paysage
      const leftColumnSections = sections.slice(0, Math.ceil(sections.length / 2));
      const rightColumnSections = sections.slice(Math.ceil(sections.length / 2));
      
      return (
        <View style={styles.landscapeContainer}>
          <Surface style={styles.landscapeColumn}>
            {leftColumnSections.map((section, index) => (
              <React.Fragment key={`left-${section.title}`}>
                {renderSection(section)}
                {index < leftColumnSections.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Surface>
          
          <Surface style={styles.landscapeColumn}>
            {rightColumnSections.map((section, index) => (
              <React.Fragment key={`right-${section.title}`}>
                {renderSection(section)}
                {index < rightColumnSections.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Surface>
        </View>
      );
    } else {
      // Mode portrait - une seule colonne
      return (
        <>
          {sections.map((section, index) => (
            <React.Fragment key={section.title}>
              {renderSection(section)}
              {index < sections.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </>
      );
    }
  };

  // Rendu d'une section de paramètres
  const renderSection = (section: any) => (
    <List.Section>
      <List.Subheader>{t(section.title)}</List.Subheader>
      {section.items.map((item: any) => (
        <List.Item
          key={item.title}
          title={t(item.title)}
          description={item.description ? t(item.description) : undefined}
          left={props => <List.Icon {...props} icon={item.icon} />}
          onPress={item.onPress}
        />
      ))}
    </List.Section>
  );

  return (
    <OrientationAwareView style={styles.container}>
      <AppHeader title={t('settings')} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={isLandscape ? styles.scrollContentLandscape : styles.scrollContent}
      >
        {renderSettingsSections()}
      </ScrollView>
    </OrientationAwareView>
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
  scrollContent: {
    paddingBottom: 20,
  },
  scrollContentLandscape: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  landscapeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  landscapeColumn: {
    width: '48%',
    borderRadius: 8,
    marginVertical: 4,
    elevation: 2,
    overflow: 'hidden',
  },
});

export default SettingsScreen;
