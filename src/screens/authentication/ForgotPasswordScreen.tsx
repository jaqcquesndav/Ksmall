import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Title, useTheme, HelperText, Snackbar, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useNetInfo } from '@react-native-community/netinfo';
import logger from '../../utils/logger';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  TwoFactorAuth: { email: string };
  ForgotPassword: undefined;
  Onboarding: undefined;
};

type ForgotPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const auth = useAuth();
  const netInfo = useNetInfo();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Vérifier si l'utilisateur est hors ligne
  useEffect(() => {
    if (netInfo.isConnected === false) {
      setSnackbarMessage(t('offline_mode_feature_unavailable'));
      setSnackbarVisible(true);
    }
  }, [netInfo.isConnected, t]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendResetEmail = async () => {
    // Vérifier si en ligne
    if (netInfo.isConnected === false) {
      setSnackbarMessage(t('offline_mode_feature_unavailable'));
      setSnackbarVisible(true);
      return;
    }

    // Validation de l'email
    if (!email) {
      setError(t('email_required'));
      return;
    }
    
    if (!validateEmail(email)) {
      setError(t('invalid_email'));
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Utiliser notre contexte d'authentification pour réinitialiser le mot de passe
      await auth.resetPassword(email);
      setEmailSent(true);
      logger.info(`✅ Password reset email sent to ${email}`);
    } catch (error: any) {
      logger.error('❌ Failed to send password reset email:', error);
      Alert.alert(
        t('reset_password_error'),
        error?.message || t('reset_password_generic_error'),
        [{ text: t('ok') }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        
        <Title style={styles.title}>
          {t('forgot_password')}
        </Title>
        
        {!emailSent ? (
          <>
            <Text style={styles.subtitle}>
              {t('forgot_password_instructions')}
            </Text>
            
            <TextInput
              label={t('email')}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              error={!!error}
              disabled={loading || auth.loading}
            />
            
            {error && (
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
            )}
            
            <Button
              mode="contained"
              onPress={handleSendResetEmail}
              style={styles.button}
              loading={loading || auth.loading}
              disabled={loading || auth.loading}
            >
              {t('send_reset_link')}
            </Button>
            
            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={styles.textButton}
            >
              {t('back_to_login')}
            </Button>
          </>
        ) : (
          <View style={styles.successContainer}>
            <Text style={styles.successMessage}>
              {t('reset_email_sent', { email })}
            </Text>
            
            <Text style={styles.instructionText}>
              {t('reset_email_instructions')}
            </Text>
            
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Login')}
              style={styles.button}
            >
              {t('back_to_login')}
            </Button>
          </View>
        )}
      </ScrollView>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: t('ok'),
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
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
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  textButton: {
    marginTop: 16,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  successMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
    textAlign: 'center',
  }
});

export default ForgotPasswordScreen;
