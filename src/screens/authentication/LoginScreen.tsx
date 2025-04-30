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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetInfo } from '@react-native-community/netinfo';
import * as LocalAuthentication from 'expo-local-authentication';
import logger from '../../utils/logger';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const netInfo = useNetInfo();
  const isConnected = netInfo.isConnected;
  
  // Contexte d'authentification
  const auth = useAuth();
  
  // États
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [savedCredentials, setSavedCredentials] = useState<{email: string; password: string} | null>(null);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  // Vérifier la disponibilité de l'authentification biométrique
  useEffect(() => {
    const checkBiometrics = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricsAvailable(compatible && enrolled);
    };
    
    checkBiometrics();
  }, []);

  // Vérifier si des identifiants ont été sauvegardés pour le mode hors ligne
  useEffect(() => {
    const checkSavedCredentials = async () => {
      try {
        const credentials = await AsyncStorage.getItem('saved_credentials');
        if (credentials) {
          const parsed = JSON.parse(credentials);
          setSavedCredentials(parsed);
          
          // Pré-remplir l'email si disponible
          if (parsed.email) {
            setEmail(parsed.email);
          }
        }
      } catch (error) {
        logger.error('Erreur lors de la récupération des identifiants sauvegardés:', error);
      }
    };
    
    checkSavedCredentials();
  }, []);

  // Afficher une notification si l'utilisateur est hors ligne
  useEffect(() => {
    if (isConnected === false) {
      setOfflineMode(true);
      setSnackbarMessage(t('offline_mode_login'));
      setSnackbarVisible(true);
    } else {
      setOfflineMode(false);
    }
  }, [isConnected, t]);

  // Validation d'email simple
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Fonction pour tenter l'authentification biométrique
  const authenticateWithBiometrics = async () => {
    if (!savedCredentials) {
      setSnackbarMessage(t('no_saved_credentials'));
      setSnackbarVisible(true);
      return;
    }
    
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('biometric_login'),
        fallbackLabel: t('use_password'),
        disableDeviceFallback: false
      });
      
      if (result.success) {
        // Si l'authentification biométrique réussit, utiliser les identifiants sauvegardés
        setEmail(savedCredentials.email);
        setPassword(savedCredentials.password);
        
        // Connecter l'utilisateur avec les identifiants sauvegardés
        handleLogin(true);
      }
    } catch (error) {
      logger.error('Erreur lors de l\'authentification biométrique:', error);
      setSnackbarMessage(t('biometric_error'));
      setSnackbarVisible(true);
    }
  };

  const handleLogin = async (isBiometric = false) => {
    // Si c'est une authentification biométrique, nous avons déjà les identifiants
    const loginEmail = isBiometric ? savedCredentials?.email || email : email;
    const loginPassword = isBiometric ? savedCredentials?.password || password : password;
    
    logger.info("🖱️ Login button pressed");
    
    // Reset des erreurs
    setErrors({});
    
    // Validation
    let isValid = true;
    const newErrors: {email?: string; password?: string} = {};
    
    if (!loginEmail) {
      newErrors.email = t('email_required');
      isValid = false;
    } else if (!validateEmail(loginEmail)) {
      newErrors.email = t('invalid_email');
      isValid = false;
    }
    
    if (!loginPassword) {
      newErrors.password = t('password_required');
      isValid = false;
    }
    
    if (!isValid) {
      logger.warn("⚠️ Form validation failed:", newErrors);
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    
    try {
      // Connexion avec Auth0 via notre contexte d'authentification
      await auth.login(loginEmail, loginPassword);
      
      // Sauvegarder les identifiants pour une utilisation hors ligne
      if (!isBiometric) {
        await AsyncStorage.setItem('saved_credentials', JSON.stringify({
          email: loginEmail,
          password: loginPassword
        }));
      }
      
      // Si nous arrivons ici, la connexion a réussi
      logger.info("✅ Login successful");
    } catch (error: any) {
      logger.error("❌ Login error:", error);
      
      // Cas spécial pour le compte de démonstration
      if (loginEmail === 'jacquesndav@gmail.com' && loginPassword === 'root12345') {
        try {
          // Essayer la connexion démo directement
          await auth.demoLogin();
          logger.info("✅ Demo login successful");
          return;
        } catch (demoError) {
          logger.error("Demo login failed:", demoError);
          // Continuer avec la gestion normale des erreurs
        }
      }
      
      // Afficher un message différent selon le mode
      const errorMessage = offlineMode 
        ? t('offline_invalid_credentials') 
        : error?.message || t('invalid_credentials');
      
      Alert.alert(
        t('login_failed'),
        errorMessage,
        [{ text: t('ok') }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (offlineMode) {
      setSnackbarMessage(t('feature_unavailable_offline'));
      setSnackbarVisible(true);
      return;
    }
    navigation.navigate('ForgotPassword');
  };

  const handleSignup = () => {
    if (offlineMode) {
      setSnackbarMessage(t('feature_unavailable_offline'));
      setSnackbarVisible(true);
      return;
    }
    navigation.navigate('Register');
  };

  // Gestion de la connexion Google
  const handleGoogleLogin = async () => {
    if (offlineMode) {
      setSnackbarMessage(t('feature_unavailable_offline'));
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);
    try {
      await auth.loginWithGoogle();
      logger.info("✅ Google login successful");
    } catch (error: any) {
      logger.error("❌ Google login error:", error);
      Alert.alert(
        t('login_failed'),
        error?.message || t('google_login_failed'),
        [{ text: t('ok') }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Gestion de la connexion Facebook
  const handleFacebookLogin = async () => {
    if (offlineMode) {
      setSnackbarMessage(t('feature_unavailable_offline'));
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);
    try {
      await auth.loginWithFacebook();
      logger.info("✅ Facebook login successful");
    } catch (error: any) {
      logger.error("❌ Facebook login error:", error);
      Alert.alert(
        t('login_failed'),
        error?.message || t('facebook_login_failed'),
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
        <Title style={styles.title}>
          {t('login_title')}
        </Title>

        {/* Indicateur de mode hors ligne */}
        {offlineMode && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>
              {t('offline_mode')}
            </Text>
          </View>
        )}

        {/* Message informatif pour le compte de démonstration */}
        <View style={styles.demoAccountInfo}>
          <Text style={styles.demoText}>
            Pour tester l'application, utilisez le compte de démonstration :
          </Text>
          <Text style={styles.demoCredentials}>
            Email: jacquesndav@gmail.com
          </Text>
          <Text style={styles.demoCredentials}>
            Mot de passe: root12345
          </Text>
        </View>

        <TextInput
          label={t('email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          error={!!errors.email}
          disabled={loading}
        />
        {errors.email && (
          <HelperText type="error" visible={!!errors.email}>
            {errors.email}
          </HelperText>
        )}

        <TextInput
          label={t('password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          style={styles.input}
          error={!!errors.password}
          disabled={loading}
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

        <Button
          mode="text"
          onPress={handleForgotPassword}
          style={styles.forgotPasswordButton}
          disabled={offlineMode || loading}
        >
          {t('forgot_password')}
        </Button>

        <Button
          mode="contained"
          onPress={() => handleLogin(false)}
          style={styles.loginButton}
          loading={loading || auth.loading}
          disabled={loading || auth.loading}
        >
          {t('login')}
        </Button>

        {/* Bouton d'authentification biométrique si disponible et des identifiants sont sauvegardés */}
        {biometricsAvailable && savedCredentials && (
          <Button
            mode="outlined"
            icon="fingerprint"
            onPress={authenticateWithBiometrics}
            style={styles.biometricButton}
            disabled={loading || auth.loading}
          >
            {t('login_with_biometrics')}
          </Button>
        )}

        <View style={styles.separator}>
          <View style={styles.line} />
          <Text style={styles.orText}>{t('or')}</Text>
          <View style={styles.line} />
        </View>

        {/* Social Login Buttons */}
        <Button
          mode="outlined"
          icon="google"
          onPress={handleGoogleLogin}
          style={styles.socialButton}
          disabled={offlineMode || loading || auth.loading}
          labelStyle={styles.socialButtonText}
        >
          {t('login_with_google')}
        </Button>

        <Button
          mode="outlined"
          icon="facebook"
          onPress={handleFacebookLogin}
          style={[styles.socialButton, styles.facebookButton]}
          disabled={offlineMode || loading || auth.loading}
          labelStyle={[styles.socialButtonText, styles.facebookButtonText]}
        >
          {t('login_with_facebook')}
        </Button>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>
            {t('dont_have_account')}
          </Text>
          <Button
            mode="text"
            onPress={handleSignup}
            style={styles.signupButton}
            disabled={offlineMode || loading || auth.loading}
          >
            {t('sign_up')}
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
  demoAccountInfo: {
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#6200EE',
    alignSelf: 'stretch',
  },
  demoText: {
    marginBottom: 8,
    fontWeight: '500',
  },
  demoCredentials: {
    fontFamily: 'monospace',
    color: '#333',
    marginBottom: 4,
  },
  input: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginVertical: 8,
  },
  loginButton: {
    width: '100%',
    marginTop: 16,
    paddingVertical: 8,
  },
  biometricButton: {
    width: '100%',
    marginTop: 16,
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
  googleButton: {
    width: '100%',
    marginBottom: 24,
  },
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  signupText: {
    color: '#666',
  },
  signupButton: {
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

export default LoginScreen;
