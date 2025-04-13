import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Divider, Surface, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import AppHeader from '../../components/common/AppHeader';
import logger from '../../utils/logger';

const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      logger.error('Error during logout:', error);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('settings')} />
      
      <ScrollView style={styles.scrollView}>
        <Surface style={styles.profileSurface}>
          <List.Item
            title={user?.displayName || t('user')}
            description={user?.email || ''}
            left={props => <List.Icon {...props} icon="account-circle" color={theme.colors.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('UserProfile' as never)}
            style={styles.profileItem}
          />
        </Surface>
        
        <List.Section title={t('account')}>
          <Surface style={styles.surface}>
            <List.Item
              title={t('user_profile')}
              left={props => <List.Icon {...props} icon="account" />}
              onPress={() => navigation.navigate('UserProfile' as never)}
            />
            <Divider />
            <List.Item
              title={t('business_profile')}
              left={props => <List.Icon {...props} icon="domain" />}
              onPress={() => navigation.navigate('BusinessProfile' as never)}
            />
            <Divider />
            <List.Item
              title={t('user_management')}
              left={props => <List.Icon {...props} icon="account-group" />}
              onPress={() => navigation.navigate('UserManagement' as never)}
            />
            <Divider />
            <List.Item
              title={t('payment_methods')}
              left={props => <List.Icon {...props} icon="credit-card" />}
              onPress={() => navigation.navigate('PaymentMethods' as never)}
            />
          </Surface>
        </List.Section>
        
        <List.Section title={t('app_settings')}>
          <Surface style={styles.surface}>
            <List.Item
              title={t('theme')}
              left={props => <List.Icon {...props} icon="palette" />}
              onPress={() => navigation.navigate('ThemeSettings' as never)}
            />
            <Divider />
            <List.Item
              title={t('security')}
              left={props => <List.Icon {...props} icon="shield-lock" />}
              onPress={() => navigation.navigate('SecuritySettings' as never)}
            />
            <Divider />
            <List.Item
              title={t('notifications')}
              left={props => <List.Icon {...props} icon="bell" />}
              onPress={() => navigation.navigate('NotificationSettings' as never)}
            />
            <Divider />
            <List.Item
              title={t('permissions')}
              left={props => <List.Icon {...props} icon="shield-check" />}
              onPress={() => navigation.navigate('PermissionSettings' as never)}
            />
          </Surface>
        </List.Section>
        
        <List.Section title={t('help_and_about')}>
          <Surface style={styles.surface}>
            <List.Item
              title={t('help_and_support')}
              left={props => <List.Icon {...props} icon="help-circle" />}
              onPress={() => navigation.navigate('HelpSupport' as never)}
            />
            <Divider />
            <List.Item
              title={t('about')}
              left={props => <List.Icon {...props} icon="information" />}
              onPress={() => navigation.navigate('About' as never)}
            />
          </Surface>
        </List.Section>
        
        <Surface style={[styles.surface, styles.logoutSurface]}>
          <List.Item
            title={t('logout')}
            titleStyle={{ color: '#D32F2F' }}
            left={props => <List.Icon {...props} icon="logout" color="#D32F2F" />}
            onPress={handleLogout}
          />
        </Surface>
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
  surface: {
    elevation: 1,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  profileSurface: {
    elevation: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
  },
  profileItem: {
    paddingVertical: 8,
  },
  logoutSurface: {
    marginVertical: 24,
  },
});

export default SettingsScreen;
