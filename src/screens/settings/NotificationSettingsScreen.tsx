import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Switch, Text, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import AppHeader from '../../components/common/AppHeader';

const NotificationSettingsScreen = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    pushEnabled: true,
    emailEnabled: true,
    transactionsNotif: true,
    lowInventoryNotif: true,
    paymentsNotif: true,
    updatesNotif: false,
    marketingNotif: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [key]: !prevSettings[key]
    }));
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        title={t('notification_settings')} 
        showBack
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>{t('notification_channels')}</Text>
        
        <List.Item
          title={t('push_notifications')}
          description={t('push_notifications_description')}
          right={() => (
            <Switch 
              value={settings.pushEnabled} 
              onValueChange={() => toggleSetting('pushEnabled')} 
            />
          )}
        />
        
        <List.Item
          title={t('email_notifications')}
          description={t('email_notifications_description')}
          right={() => (
            <Switch 
              value={settings.emailEnabled} 
              onValueChange={() => toggleSetting('emailEnabled')} 
            />
          )}
        />
        
        <Divider style={styles.divider} />
        
        <Text style={styles.sectionTitle}>{t('notification_types')}</Text>
        
        <List.Item
          title={t('transactions')}
          description={t('transactions_notifications_description')}
          right={() => (
            <Switch 
              value={settings.transactionsNotif} 
              onValueChange={() => toggleSetting('transactionsNotif')} 
            />
          )}
        />
        
        <List.Item
          title={t('inventory_alerts')}
          description={t('inventory_notifications_description')}
          right={() => (
            <Switch 
              value={settings.lowInventoryNotif} 
              onValueChange={() => toggleSetting('lowInventoryNotif')} 
            />
          )}
        />
        
        <List.Item
          title={t('payments')}
          description={t('payments_notifications_description')}
          right={() => (
            <Switch 
              value={settings.paymentsNotif} 
              onValueChange={() => toggleSetting('paymentsNotif')} 
            />
          )}
        />
        
        <Divider style={styles.divider} />
        
        <Text style={styles.sectionTitle}>{t('other_notifications')}</Text>
        
        <List.Item
          title={t('app_updates')}
          description={t('updates_notifications_description')}
          right={() => (
            <Switch 
              value={settings.updatesNotif} 
              onValueChange={() => toggleSetting('updatesNotif')} 
            />
          )}
        />
        
        <List.Item
          title={t('marketing')}
          description={t('marketing_notifications_description')}
          right={() => (
            <Switch 
              value={settings.marketingNotif} 
              onValueChange={() => toggleSetting('marketingNotif')} 
            />
          )}
        />
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  divider: {
    marginVertical: 8,
  },
});

export default NotificationSettingsScreen;
