import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import AppHeader from '../../components/common/AppHeader';
import { useMainNavigation } from '../../hooks/useAppNavigation';
import logger from '../../utils/logger';

const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useMainNavigation();

  const handleNavigateToSettings = (screenName: string) => {
    // Log the navigation attempt for debugging
    logger.debug(`Navigating to settings screen: ${screenName}`);
    
    // Use a type assertion to handle the navigation properly
    navigation.navigate(screenName as any);
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('settings')} />
      
      <ScrollView>
        <List.Section>
          <List.Subheader>{t('account')}</List.Subheader>
          <List.Item
            title={t('user_profile')}
            left={props => <List.Icon {...props} icon="account" />}
            onPress={() => navigation.navigate('UserProfile')}
          />
          <List.Item
            title={t('business_profile')}
            left={props => <List.Icon {...props} icon="office-building" />}
            onPress={() => navigation.navigate('BusinessProfile')}
          />
          <List.Item
            title={t('user_management')}
            left={props => <List.Icon {...props} icon="account-group" />}
            onPress={() => handleNavigateToSettings('UserManagement')}
          />
        </List.Section>
        
        <Divider />
        
        <List.Section>
          <List.Subheader>{t('subscription')}</List.Subheader>
          <List.Item
            title={t('manage_subscription')}
            description={t('subscription_management_desc')}
            left={props => <List.Icon {...props} icon="star" />}
            onPress={() => handleNavigateToSettings('Subscriptions')}
          />
          <List.Item
            title={t('buy_tokens')}
            description={t('token_purchase_desc')}
            left={props => <List.Icon {...props} icon="currency-usd" />}
            onPress={() => handleNavigateToSettings('TokenPurchase')}
          />
        </List.Section>
        
        <Divider />
        
        <List.Section>
          <List.Subheader>{t('payment')}</List.Subheader>
          <List.Item
            title={t('payment_methods')}
            left={props => <List.Icon {...props} icon="credit-card" />}
            onPress={() => handleNavigateToSettings('PaymentMethods')}
          />
        </List.Section>
        
        <Divider />
        
        <List.Section>
          <List.Subheader>{t('app_settings')}</List.Subheader>
          <List.Item
            title={t('theme')}
            left={props => <List.Icon {...props} icon="palette" />}
            onPress={() => handleNavigateToSettings('ThemeSettings')}
          />
          <List.Item
            title={t('security')}
            left={props => <List.Icon {...props} icon="shield-lock" />}
            onPress={() => handleNavigateToSettings('SecuritySettings')}
          />
          <List.Item
            title={t('notifications')}
            left={props => <List.Icon {...props} icon="bell" />}
            onPress={() => handleNavigateToSettings('NotificationSettings')}
          />
          <List.Item
            title={t('permissions')}
            left={props => <List.Icon {...props} icon="key" />}
            onPress={() => handleNavigateToSettings('PermissionSettings')}
          />
        </List.Section>
        
        <Divider />
        
        <List.Section>
          <List.Subheader>{t('support')}</List.Subheader>
          <List.Item
            title={t('help_support')}
            left={props => <List.Icon {...props} icon="help-circle" />}
            onPress={() => handleNavigateToSettings('HelpSupport')}
          />
          <List.Item
            title={t('about')}
            left={props => <List.Icon {...props} icon="information" />}
            onPress={() => handleNavigateToSettings('About')}
          />
        </List.Section>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default SettingsScreen;
