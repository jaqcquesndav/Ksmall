import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

const LoadingScreen: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6200ee" style={styles.spinner} />
      <Text style={styles.text}>{t('loading')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  spinner: {
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
  },
});

export default LoadingScreen;
