import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  List, 
  Text,
  Switch,
  Button, 
  TextInput,
  Divider 
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import AppHeader from '../../components/common/AppHeader';
import { useAuth } from '../../context/AuthContext';

const SecuritySettingsScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('error'), t('all_fields_required'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('error'), t('passwords_must_match'));
      return;
    }

    // Here you would call your auth service to change the password
    Alert.alert(t('success'), t('password_changed_successfully'));
    
    // Clear the form
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const toggleTwoFactor = async () => {
    // Here you would call your auth service to enable/disable 2FA
    setTwoFactorEnabled(!twoFactorEnabled);
    Alert.alert(
      t('success'), 
      twoFactorEnabled ? t('2fa_disabled') : t('2fa_enabled')
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        title={t('security_settings')} 
        showBack
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>{t('account_security')}</Text>
        
        <List.Item
          title={t('two_factor_authentication')}
          description={t('2fa_description')}
          right={() => <Switch value={twoFactorEnabled} onValueChange={toggleTwoFactor} />}
        />
        
        <Divider style={styles.divider} />
        
        <Text style={styles.sectionTitle}>{t('change_password')}</Text>
        
        <TextInput
          label={t('current_password')}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry={!passwordVisible}
          right={
            <TextInput.Icon 
              icon={passwordVisible ? 'eye-off' : 'eye'} 
              onPress={() => setPasswordVisible(!passwordVisible)} 
            />
          }
          style={styles.input}
        />
        
        <TextInput
          label={t('new_password')}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!passwordVisible}
          style={styles.input}
        />
        
        <TextInput
          label={t('confirm_new_password')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!passwordVisible}
          style={styles.input}
        />
        
        <Button 
          mode="contained" 
          onPress={handlePasswordChange}
          style={styles.button}
          disabled={!currentPassword || !newPassword || !confirmPassword}
        >
          {t('change_password')}
        </Button>
        
        <Divider style={styles.divider} />
        
        <Text style={styles.sectionTitle}>{t('login_sessions')}</Text>
        
        <List.Item
          title={t('active_sessions')}
          description={t('active_sessions_description')}
          right={() => <Button mode="text">{t('view_sessions')}</Button>}
        />
        
        <Button 
          mode="outlined" 
          onPress={() => Alert.alert(t('success'), t('all_sessions_terminated'))}
          style={[styles.button, styles.dangerButton]}
          labelStyle={{ color: '#F44336' }}
        >
          {t('logout_all_devices')}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  button: {
    marginVertical: 16,
  },
  divider: {
    marginVertical: 16,
  },
  dangerButton: {
    borderColor: '#F44336',
  },
});

export default SecuritySettingsScreen;
