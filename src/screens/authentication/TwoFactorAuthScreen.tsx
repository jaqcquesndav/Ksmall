import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  TouchableOpacity,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  ScrollView
} from 'react-native';
import { Button, Text, Title, HelperText, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';

type TwoFactorAuthScreenProps = NativeStackScreenProps<AuthStackParamList, 'TwoFactorAuth'>;

const CODE_LENGTH = 6;

const TwoFactorAuthScreen: React.FC<TwoFactorAuthScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { verifyTwoFactorCode, loading: authLoading } = useAuth();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<(RNTextInput | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    setTimeout(() => {
      inputsRef.current[0]?.focus();
    }, 100);
  }, []);

  const handleChange = (value: string, index: number) => {
    // Allow only digits
    const digit = value.replace(/[^0-9]/g, '');
    
    if (digit !== '') {
      const newCode = [...code];
      newCode[index] = digit;
      setCode(newCode);
      
      // Move to next input
      if (index < CODE_LENGTH - 1) {
        inputsRef.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    const key = e.nativeEvent.key;
    
    // Handle backspace
    if (key === 'Backspace' && index > 0 && !code[index]) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const fullCode = code.join('');
    
    if (fullCode.length !== CODE_LENGTH) {
      setError(t('invalid_code_length'));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await verifyTwoFactorCode(fullCode);
      // Navigation will be handled by the auth state change if login is successful
    } catch (error: any) {
      setError(t('verification_failed'));
      console.error('2FA verification failed:', error);
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
          {t('two_factor_auth_title')}
        </Title>
        
        <Text style={styles.subtitle}>
          {t('two_factor_auth_subtitle')} {route.params?.email || ''}
        </Text>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <View
              key={index}
              style={[
                styles.cell,
                !!digit && styles.cellFilled,
              ]}
            >
              <RNTextInput
                ref={(el: any) => (inputsRef.current[index] = el)}
                style={styles.cellText}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(value) => handleChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
              />
            </View>
          ))}
        </View>

        {error && (
          <HelperText type="error" visible={!!error} style={styles.errorText}>
            {error}
          </HelperText>
        )}
        
        {authLoading && (
          <Text style={styles.loadingText}>
            {t('verifying_code')}
          </Text>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading || authLoading}
          disabled={loading || authLoading || code.some(digit => digit === '')}
          style={styles.button}
        >
          {t('verify_code')}
        </Button>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>
            {t('didnt_receive_code')}
          </Text>
          
          <Button
            mode="text"
            onPress={() => console.log('Resend code...')}
            style={styles.resendButton}
          >
            {t('resend_code')}
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
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
  },
  cell: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFilled: {
    borderColor: '#6200EE',
    backgroundColor: 'rgba(98, 0, 238, 0.05)',
  },
  cellText: {
    fontSize: 24,
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  errorText: {
    marginBottom: 16,
    fontSize: 14,
  },
  loadingText: {
    marginBottom: 16,
    color: '#6200EE',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    paddingVertical: 6,
    marginBottom: 24,
  },
  resendContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  resendText: {
    marginBottom: 8,
    color: '#666',
  },
  resendButton: {
    marginTop: 0,
  },
});

export default TwoFactorAuthScreen;
