import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { TextInput, Button, Text, Title, useTheme, HelperText } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  
  // Make sure we destructure and store the login function at the component level
  const auth = useAuth();
  const { login } = auth;
  
  console.log("🛠️ Auth object check:", { 
    authExists: !!auth, 
    loginFunction: typeof login === 'function' ? 'Available' : 'NOT AVAILABLE' 
  });
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation d'email simple
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    console.log("🖱️ Login button pressed");
    console.log("📝 Form data:", { email, password: password.replace(/./g, '*') });
    
    // Reset des erreurs
    setErrors({});
    
    // Validation
    let isValid = true;
    const newErrors: {email?: string; password?: string} = {};
    
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
    }
    
    if (!isValid) {
      console.log("⚠️ Form validation failed:", newErrors);
      setErrors(newErrors);
      return;
    }
    
    console.log("✅ Form validation passed, attempting login");
    
    // Vérifier si la fonction login existe
    if (typeof login !== 'function') {
      console.error("❌ Login function is not available:", login);
      Alert.alert(
        "Erreur",
        "Impossible de se connecter: service d'authentification non disponible."
      );
      return;
    }
    
    // Tentative de connexion
    setLoading(true);
    try {
      console.log("🔄 Login function type:", typeof login);
      await login(email, password);
      console.log("✅ Login successful");
    } catch (error: any) {
      console.error("❌ Login function threw an exception:", error);
      Alert.alert(
        t('login_failed'),
        error?.message || t('invalid_credentials'),
        [{ text: t('ok') }]
      );
    } finally {
      console.log("🔄 Login process complete, setting loading to false");
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleSignup = () => {
    navigation.navigate('Signup');
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
        >
          {t('forgot_password')}
        </Button>

        <Button
          mode="contained"
          onPress={handleLogin}
          style={styles.loginButton}
          loading={loading}
          disabled={loading}
        >
          {t('login')}
        </Button>

        <View style={styles.separator}>
          <View style={styles.line} />
          <Text style={styles.orText}>{t('or')}</Text>
          <View style={styles.line} />
        </View>

        <Button
          mode="outlined"
          icon="google"
          onPress={() => {}}
          style={styles.googleButton}
        >
          {t('login_with_google')}
        </Button>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>
            {t('dont_have_account')}
          </Text>
          <Button
            mode="text"
            onPress={handleSignup}
            style={styles.signupButton}
          >
            {t('sign_up')}
          </Button>
        </View>
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
});

export default LoginScreen;
