import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { TextInput, Button, Text, Title, useTheme, HelperText, Snackbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { useNetInfo } from '@react-native-community/netinfo';
import logger from '../../utils/logger';

type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const netInfo = useNetInfo();
  const isConnected = netInfo.isConnected;
  
  // Contexte d'authentification
  const auth = useAuth();
  
  // États
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState<{
    email?: string; 
    password?: string;
    confirmPassword?: string;
    displayName?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Afficher une notification si l'utilisateur est hors ligne
  useEffect(() => {
    if (isConnected === false) {
      setOfflineMode(true);
      setSnackbarMessage(t('offline_mode_register'));
      setSnackbarVisible(true);
    } else {
      setOfflineMode(false);
    }
  }, [isConnected, t]);

  // Validation
  const validateForm = () => {
    const newErrors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
      displayName?: string;
    } = {};
    let isValid = true;

    // Validation email
    if (!email) {
      newErrors.email = t('email_required');
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = t('invalid_email');
        isValid = false;
      }
    }

    // Validation du nom d'affichage
    if (!displayName) {
      newErrors.displayName = t('name_required');
      isValid = false;
    }

    // Validation du mot de passe
    if (!password) {
      newErrors.password = t('password_required');
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = t('password_too_short');
      isValid = false;
    }

    // Validation de la confirmation du mot de passe
    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('passwords_dont_match');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Gérer l'inscription
  const handleRegister = async () => {
    if (offlineMode) {
      setSnackbarMessage(t('feature_unavailable_offline'));
      setSnackbarVisible(true);
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Utiliser le service Auth0 via le contexte d'authentification
      await auth.register(email, password, displayName);
      
      logger.info("✅ Registration successful");
      
      Alert.alert(
        t('registration_success'),
        t('registration_success_message'),
        [{ text: t('ok'), onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      logger.error("❌ Registration error:", error);
      
      Alert.alert(
        t('registration_failed'),
        error?.message || t('registration_error'),
        [{ text: t('ok') }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Gérer l'inscription avec Google
  const handleGoogleRegistration = async () => {
    if (offlineMode) {
      setSnackbarMessage(t('feature_unavailable_offline'));
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);
    try {
      await auth.registerWithGoogle();
      logger.info("✅ Google registration successful");
    } catch (error: any) {
      logger.error("❌ Google registration error:", error);
      Alert.alert(
        t('registration_failed'),
        error?.message || t('google_registration_failed'),
        [{ text: t('ok') }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Gérer l'inscription avec Facebook
  const handleFacebookRegistration = async () => {
    if (offlineMode) {
      setSnackbarMessage(t('feature_unavailable_offline'));
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);
    try {
      await auth.registerWithFacebook();
      logger.info("✅ Facebook registration successful");
    } catch (error: any) {
      logger.error("❌ Facebook registration error:", error);
      Alert.alert(
        t('registration_failed'),
        error?.message || t('facebook_registration_failed'),
        [{ text: t('ok') }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Title style={styles.title}>
          {t('register_title')}
        </Title>

        {/* Indicateur de mode hors ligne */}
        {offlineMode && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>
              {t('offline_mode')}
            </Text>
          </View>
        )}

        <TextInput
          label={t('display_name')}
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.input}
          error={!!errors.displayName}
          disabled={loading || offlineMode}
        />
        {errors.displayName && (
          <HelperText type="error" visible={!!errors.displayName}>
            {errors.displayName}
          </HelperText>
        )}

        <TextInput
          label={t('email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          error={!!errors.email}
          disabled={loading || offlineMode}
        />
        {errors.email && (
          <HelperText type="error" visible={!!errors.email}>
            {errors.email}
          </HelperText>
        )}

        <TextInput
          label={t('phone_number')}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          style={styles.input}
          disabled={loading || offlineMode}
        />

        <TextInput
          label={t('password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          style={styles.input}
          error={!!errors.password}
          disabled={loading || offlineMode}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
        />
        {errors.password && (
          <HelperText type="error" visible={!!errors.password}>
            {errors.password}
          </HelperText>
        )}

        <TextInput
          label={t('confirm_password')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
          style={styles.input}
          error={!!errors.confirmPassword}
          disabled={loading || offlineMode}
        />
        {errors.confirmPassword && (
          <HelperText type="error" visible={!!errors.confirmPassword}>
            {errors.confirmPassword}
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={handleRegister}
          style={styles.registerButton}
          loading={loading || auth.loading}
          disabled={loading || offlineMode || auth.loading}
        >
          {t('register')}
        </Button>

        <View style={styles.separator}>
          <View style={styles.line} />
          <Text style={styles.orText}>{t('or')}</Text>
          <View style={styles.line} />
        </View>

        {/* Boutons d'inscription sociale */}
        <Button
          mode="outlined"
          icon="google"
          onPress={handleGoogleRegistration}
          style={styles.socialButton}
          disabled={offlineMode || loading || auth.loading}
          labelStyle={styles.socialButtonText}
        >
          {t('register_with_google')}
        </Button>

        <Button
          mode="outlined"
          icon="facebook"
          onPress={handleFacebookRegistration}
          style={[styles.socialButton, styles.facebookButton]}
          disabled={offlineMode || loading || auth.loading}
          labelStyle={[styles.socialButtonText, styles.facebookButtonText]}
        >
          {t('register_with_facebook')}
        </Button>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>
            {t('already_have_account')}
          </Text>
          <Button
            mode="text"
            onPress={handleLogin}
            style={styles.loginButton}
          >
            {t('login')}
          </Button>
        </View>
      </ScrollView>

      {/* Snackbar pour les notifications */}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  registerButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  orText: {
    marginHorizontal: 16,
    color: '#888',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#666',
  },
  loginButton: {
    marginLeft: 8,
  },
  offlineBanner: {
    backgroundColor: '#FF9800',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  offlineBannerText: {
    color: 'white',
    fontWeight: 'bold',
  },
  socialButton: {
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
  },
  socialButtonText: {
    fontSize: 14,
  },
  facebookButton: {
    borderColor: '#3b5998',
    backgroundColor: '#3b5998',
  },
  facebookButtonText: {
    color: 'white',
  },
});

export default RegisterScreen;