import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, Title, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AppHeader from '../../components/common/AppHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const AccountingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  
  return (
    <View style={styles.container}>
      <AppHeader title={t('accounting')} />
      
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>{t('journal_entries')}</Title>
            <Text>{t('manage_journal_entries')}</Text>
          </Card.Content>
          <Card.Actions>
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('JournalEntry' as any)}
            >
              {t('view')}
            </Button>
          </Card.Actions>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Title>{t('ledger')}</Title>
            <Text>{t('view_general_ledger')}</Text>
          </Card.Content>
          <Card.Actions>
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('Ledger' as any)}
            >
              {t('view')}
            </Button>
          </Card.Actions>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Title>{t('financial_reports')}</Title>
            <Text>{t('generate_financial_statements')}</Text>
          </Card.Content>
          <Card.Actions>
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('FinancialStatements' as any)}
            >
              {t('view')}
            </Button>
          </Card.Actions>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content style={styles.settingsCardContent}>
            <View style={styles.titleIconContainer}>
              <MaterialCommunityIcons name="cog-outline" size={24} color="#6200ee" style={styles.settingsIcon} />
              <Title>{t('accounting_settings') || 'Paramètres comptables'}</Title>
            </View>
            <Text>{t('configure_accounting_settings') || 'Configurer les paramètres de comptabilité, devises, taxes et exercices fiscaux'}</Text>
          </Card.Content>
          <Card.Actions>
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('AccountingSettings' as any)}
              icon="settings"
            >
              {t('configure') || 'Configurer'}
            </Button>
          </Card.Actions>
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
  settingsCardContent: {
    paddingBottom: 8,
  },
  titleIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingsIcon: {
    marginRight: 8,
  },
});

export default AccountingScreen;
