import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Title, useTheme, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  TwoFactorAuth: { email: string };
  ForgotPassword: undefined;
  Onboarding: undefined;
};

type SignupScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

const SignupScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<SignupScreenNavigationProp>();
  
  const { control, handleSubmit, formState: { errors } } = useForm();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // API call would go here
      // For now, just simulate a signup process
      setTimeout(() => {
        navigation.navigate('TwoFactorAuth', { email: data.email });
      }, 1500);
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Title style={styles.title}>{t('create_account')}</Title>
        </View>
        <Text style={styles.subtitle}>{t('signup_subtitle')}</Text>

        {/* Name Input */}
        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label={t('full_name')}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={!!errors.name}
              style={styles.input}
              autoCapitalize="words"
            />
          )}
          name="name"
        />
        {errors.name && (
          <Text style={styles.errorText}>
            {errors.name.message?.toString() || 'Invalid name'}
          </Text>
        )}

        {/* Email Input */}
        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label={t('email')}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={!!errors.email}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
          name="email"
        />
        {errors.email && (
          <Text style={styles.errorText}>
            {errors.email.message?.toString() || 'Invalid email'}
          </Text>
        )}

        {/* Password Input */}
        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label={t('password')}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={!!errors.password}
              style={styles.input}
              secureTextEntry={!isPasswordVisible}
              right={
                <TextInput.Icon
                  icon={isPasswordVisible ? 'eye-off' : 'eye'}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                />
              }
            />
          )}
          name="password"
        />
        {errors.password && (
          <Text style={styles.errorText}>
            {errors.password.message?.toString() || 'Invalid password'}
          </Text>
        )}

        {/* Confirm Password Input */}
        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label={t('confirm_password')}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={!!errors.confirmPassword}
              style={styles.input}
              secureTextEntry={!isConfirmPasswordVisible}
              right={
                <TextInput.Icon
                  icon={isConfirmPasswordVisible ? 'eye-off' : 'eye'}
                  onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                />
              }
            />
          )}
          name="confirmPassword"
        />
        {errors.confirmPassword && (
          <Text style={styles.errorText}>
            {errors.confirmPassword.message?.toString() || 'Passwords must match'}
          </Text>
        )}

        {/* Signup Button */}
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          style={styles.button}
          loading={loading || authLoading}
          disabled={loading || authLoading}
        >
          {t('sign_up')}
        </Button>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text>{t('already_have_account')}</Text>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            compact
          >
            {t('login')}
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 12,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  footerText: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  backButton: {
    position: 'absolute',
    left: 0,
  },
});

export default SignupScreen;
