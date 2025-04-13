import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Title, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import AppHeader from '../../components/common/AppHeader';

type RouteParams = {
  TransactionDetails: {
    id: string;
  };
};

const TransactionDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RouteParams, 'TransactionDetails'>>();
  
  // This would normally fetch transaction details from an API or local storage
  const transactionId = route.params?.id || 'unknown';
  
  return (
    <View style={styles.container}>
      <AppHeader 
        title={t('transaction_details')}
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>{t('transaction')} #{transactionId}</Title>
            <Divider style={styles.divider} />
            
            <Text style={styles.label}>{t('date')}:</Text>
            <Text style={styles.value}>01/01/2023</Text>
            
            <Text style={styles.label}>{t('description')}:</Text>
            <Text style={styles.value}>{t('transaction_placeholder_description')}</Text>
            
            <Text style={styles.label}>{t('amount')}:</Text>
            <Text style={styles.value}>1,000.00 €</Text>
            
            <Text style={styles.label}>{t('status')}:</Text>
            <Text style={styles.value}>{t('completed')}</Text>
          </Card.Content>
        </Card>
      </ScrollView>
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
  },
  card: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#555',
  },
  value: {
    fontSize: 16,
    marginBottom: 8,
  },
});

export default TransactionDetailsScreen;
