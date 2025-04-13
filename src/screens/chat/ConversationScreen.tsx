import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import AppHeader from '../../components/common/AppHeader';
import { useTranslation } from 'react-i18next';

const ConversationScreen: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <View style={styles.container}>
      <AppHeader title={t('conversation')} showBack />
      <View style={styles.content}>
        <Text>Conversation Screen</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ConversationScreen;
