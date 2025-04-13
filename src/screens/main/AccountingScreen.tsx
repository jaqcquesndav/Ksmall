import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, List, Chip, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { MainStackParamList } from '../../navigation/types';
import AppHeader from '../../components/common/AppHeader';
import { accountingMockData } from '../../data/mockData';
import logger from '../../utils/logger';

const AccountingScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [accountingData, setAccountingData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('transactions');

  useEffect(() => {
    setTimeout(() => {
      setAccountingData(accountingMockData);
      setLoading(false);
    }, 1000);
  }, []);

  const handleJournalEntryPress = (entryId: string) => {
    navigation.navigate('JournalEntryDetails', { entryId });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AppHeader title={t('accounting')} />
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title={t('accounting')} />
      
      <View style={styles.tabContainer}>
        <Chip
          selected={activeTab === 'transactions'}
          onPress={() => setActiveTab('transactions')}
          style={styles.tab}
        >
          {t('transactions')}
        </Chip>
        <Chip
          selected={activeTab === 'reports'}
          onPress={() => setActiveTab('reports')}
          style={styles.tab}
        >
          {t('reports')}
        </Chip>
        <Chip
          selected={activeTab === 'accounts'}
          onPress={() => setActiveTab('accounts')}
          style={styles.tab}
        >
          {t('accounts')}
        </Chip>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'transactions' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('journal_entries')}</Text>
              <Button mode="contained-tonal" onPress={() => {/* Navigate to create new entry */}}>
                {t('new_entry')}
              </Button>
            </View>
            
            <Card style={styles.card}>
              <Card.Content>
                {accountingData.journalEntries.map((entry: any) => (
                  <View key={entry.id}>
                    <List.Item
                      title={entry.description}
                      description={`${entry.date} • ${entry.reference}`}
                      left={props => <List.Icon {...props} icon="notebook" />}
                      right={props => (
                        <View style={styles.entryStatusContainer}>
                          <Text style={styles.entryAmount}>
                            ${entry.lines.reduce((sum: number, line: any) => sum + line.debit, 0).toLocaleString()}
                          </Text>
                          <Chip
                            compact
                            mode="flat"
                            style={[
                              styles.statusChip,
                              { backgroundColor: entry.status === 'validated' ? '#E8F5E9' : '#FFF3E0' }
                            ]}
                          >
                            {entry.status === 'validated' ? t('validated') : t('pending')}
                          </Chip>
                        </View>
                      )}
                      onPress={() => handleJournalEntryPress(entry.id)}
                    />
                    {accountingData.journalEntries.indexOf(entry) < accountingData.journalEntries.length - 1 && (
                      <View style={styles.listDivider} />
                    )}
                  </View>
                ))}
              </Card.Content>
            </Card>
          </View>
        )}

        {activeTab === 'reports' && (
          <View>
            <Card style={styles.card}>
              <Card.Title title={t('financial_reports')} />
              <Card.Content>
                <List.Item
                  title={t('income_statement')}
                  description={t('income_statement_description')}
                  left={props => <List.Icon {...props} icon="chart-line" />}
                  onPress={() => {}}
                />
                <View style={styles.listDivider} />
                <List.Item
                  title={t('balance_sheet')}
                  description={t('balance_sheet_description')}
                  left={props => <List.Icon {...props} icon="scale-balance" />}
                  onPress={() => {}}
                />
                <View style={styles.listDivider} />
                <List.Item
                  title={t('cash_flow')}
                  description={t('cash_flow_description')}
                  left={props => <List.Icon {...props} icon="cash-multiple" />}
                  onPress={() => {}}
                />
              </Card.Content>
            </Card>
          </View>
        )}

        {activeTab === 'accounts' && (
          <View>
            <Card style={styles.card}>
              <Card.Title title={t('chart_of_accounts')} />
              <Card.Content>
                {accountingData.chartOfAccounts
                  .filter((account: any) => account.type === 'header')
                  .map((header: any) => (
                    <View key={header.code}>
                      <List.Item
                        title={header.name}
                        description={header.code}
                        left={props => <List.Icon {...props} icon="folder" />}
                        onPress={() => {}}
                      />
                    </View>
                  ))}
              </Card.Content>
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tab: {
    marginRight: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
  },
  listDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
    marginLeft: 56,
  },
  entryStatusContainer: {
    alignItems: 'flex-end',
  },
  entryAmount: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusChip: {
    height: 24,
  },
});

export default AccountingScreen;
