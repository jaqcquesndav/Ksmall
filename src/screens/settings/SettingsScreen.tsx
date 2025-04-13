import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Divider, Avatar, Text } from 'react-native-paper';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MainStackParamList } from '../../navigation/types';
import AppHeader from '../../components/common/AppHeader';

const SettingsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();

  return (
    <View style={styles.container}>
      <AppHeader title={t('settings')} />
      
      <ScrollView style={styles.content}>
        <List.Section>
          <List.Subheader>{t('account')}</List.Subheader>
          
          <List.Item
            title={t('user_profile')}
            left={props => <List.Icon {...props} icon="account" />}
            onPress={() => navigation.navigate('UserProfile')}
          />
          
          <List.Item
            title={t('business_profile')}
            left={props => <List.Icon {...props} icon="domain" />}
            onPress={() => navigation.navigate('BusinessProfile')}
          />
          
          <List.Item
            title={t('user_management')}
            left={props => <List.Icon {...props} icon="account-group" />}
            onPress={() => navigation.navigate('UserManagement')}
          />
          
          <List.Item
            title={t('payment_methods')}
            left={props => <List.Icon {...props} icon="credit-card" />}
            onPress={() => navigation.navigate('PaymentMethods')}
          />
          
          <Divider />
          
          <List.Subheader>{t('app_settings')}</List.Subheader>
          
          <List.Item
            title={t('theme')}
            left={props => <List.Icon {...props} icon="palette" />}
            onPress={() => navigation.navigate('ThemeSettings')}
          />
          
          <List.Item
            title={t('security')}
            left={props => <List.Icon {...props} icon="shield-lock" />}
            onPress={() => navigation.navigate('SecuritySettings')}
          />
          
          <List.Item
            title={t('notifications')}
            left={props => <List.Icon {...props} icon="bell" />}
            onPress={() => navigation.navigate('NotificationSettings')}
          />
          
          <List.Item
            title={t('permissions')}
            left={props => <List.Icon {...props} icon="shield-check" />}
            onPress={() => navigation.navigate('PermissionSettings')}
          />
          
          <Divider />
          
          <List.Subheader>{t('help_and_about')}</List.Subheader>
          
          <List.Item
            title={t('help_support')}
            left={props => <List.Icon {...props} icon="help-circle" />}
            onPress={() => navigation.navigate('HelpSupport')}
          />
          
          <List.Item
            title={t('about')}
            left={props => <List.Icon {...props} icon="information" />}
            onPress={() => navigation.navigate('About')}
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
  content: {
    flex: 1,
  },
});

export default SettingsScreen;
