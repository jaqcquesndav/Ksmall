import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Title, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  TwoFactorAuth: { email: string };
  ForgotPassword: undefined;
  Onboarding: undefined;
};

type ForgotPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError(t('valid_email_required'));
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      // API call would go here
      // For now, just simulate API call
      setTimeout(() => {
        setEmailSent(true);
      }, 1500);
    } catch (error) {
      console.error('Password reset error:', error);
      setError(t('password_reset_error'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Title style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
          {emailSent ? t('check_your_email') : t('forgot_password')}
        </Title>
        
        {!emailSent ? (
          <>
            <Text style={{ textAlign: 'center', marginBottom: 24, color: '#666' }}>
              {t('forgot_password_instructions')}
            </Text>
            
            <TextInput
              label={t('email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              error={!!error}
              mode="outlined"
            />
            
            {error ? (
              <Text style={{ color: 'red', marginBottom: 8 }}>
                {error}
              </Text>
            ) : null}
            
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={{ marginTop: 16, paddingVertical: 8 }}
              loading={loading}
              disabled={loading}
            >
              {t('send_reset_link')}
            </Button>
          </>
        ) : (
          <>
            <Text style={{ textAlign: 'center', marginBottom: 24, color: '#666' }}>
              {t('password_reset_email_sent', { email })}
            </Text>
            
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Login')}
              style={{ marginTop: 16 }}
            >
              {t('back_to_login')}
            </Button>
          </>
        )}
        
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          {emailSent ? t('done') : t('back')}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
  },
  backButton: {
    marginTop: 16,
  },
});

export default ForgotPasswordScreen;
