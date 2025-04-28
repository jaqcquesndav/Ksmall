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

type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const netInfo = useNetInfo();
  const isConnected = netInfo.isConnected;
  
  // Context d'authentification
  const { register, registerWithGoogle, registerWithFacebook, loading: authLoading } = useAuth();
  
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
  }, [isConnected]);

  // Validation d'email simple
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    if (offlineMode) {
      setSnackbarMessage(t('feature_unavailable_offline'));
      setSnackbarVisible(true);
      return;
    }
    
    console.log("🖱️ Register button pressed");
    
    // Reset des erreurs
    setErrors({});
    
    // Validation
    let isValid = true;
    const newErrors: {
      email?: string; 
      password?: string;
      confirmPassword?: string;
      displayName?: string;
    } = {};
    
    if (!email) {
      newErrors.email = t('email_required');
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = t('invalid_email');
      isValid = false;
    }
    
    if (!password) {
      newErrors.password = t('password_required');
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = t('password_too_short');
      isValid = false;
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = t('confirm_password_required');
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t('passwords_dont_match');
      isValid = false;
    }
    
    if (!displayName) {
      newErrors.displayName = t('display_name_required');
      isValid = false;
    }
    
    if (!isValid) {
      console.log("⚠️ Form validation failed:", newErrors);
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    
    try {
      await register(email, password, displayName);
      console.log("✅ Registration successful");
      
      // Afficher un message de succès
      Alert.alert(
        t('registration_successful'),
        t('registration_success_message'),
        [{ text: t('ok') }]
      );
      
      // Rediriger vers la page de connexion
      navigation.navigate('Login');
    } catch (error: any) {
      console.error("❌ Registration error:", error);
      
      Alert.alert(
        t('registration_failed'),
        error?.message || t('registration_error'),
        [{ text: t('ok') }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Google registration
  const handleGoogleRegistration = async () => {
    if (offlineMode) {
      setSnackbarMessage(t('feature_unavailable_offline'));
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);
    try {
      await registerWithGoogle();
      console.log("✅ Google registration successful");
    } catch (error: any) {
      console.error("❌ Google registration error:", error);
      Alert.alert(
        t('registration_failed'),
        error?.message || t('google_registration_failed'),
        [{ text: t('ok') }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Facebook registration
  const handleFacebookRegistration = async () => {
    if (offlineMode) {
      setSnackbarMessage(t('feature_unavailable_offline'));
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);
    try {
      await registerWithFacebook();
      console.log("✅ Facebook registration successful");
    } catch (error: any) {
      console.error("❌ Facebook registration error:", error);
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
          loading={loading}
          disabled={loading || offlineMode}
        >
          {t('register')}
        </Button>

        <View style={styles.separator}>
          <View style={styles.line} />
          <Text style={styles.orText}>{t('or')}</Text>
          <View style={styles.line} />
        </View>

        {/* Social Registration Buttons */}
        <Button
          mode="outlined"
          icon="google"
          onPress={handleGoogleRegistration}
          style={styles.socialButton}
          disabled={offlineMode || loading}
          labelStyle={styles.socialButtonText}
        >
          {t('register_with_google')}
        </Button>

        <Button
          mode="outlined"
          icon="facebook"
          onPress={handleFacebookRegistration}
          style={[styles.socialButton, styles.facebookButton]}
          disabled={offlineMode || loading}
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
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    alignSelf: 'center',
  },
  input: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  registerButton: {
    width: '100%',
    marginTop: 16,
    paddingVertical: 8,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
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