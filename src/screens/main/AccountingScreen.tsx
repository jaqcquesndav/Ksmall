import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, List, Chip, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useMainNavigation } from '../../hooks/useAppNavigation';
import AppHeader from '../../components/common/AppHeader';
import DatabaseService from '../../services/DatabaseService';
import logger from '../../utils/logger';
import useOrientation from '../../hooks/useOrientation';
import OrientationAwareView from '../../components/common/OrientationAwareView';

const AccountingScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useMainNavigation();
  const { isLandscape } = useOrientation();
  const [isLoading, setIsLoading] = useState(true);
  const [accountData, setAccountData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('transactions');

  useEffect(() => {
    const loadAccountingData = async () => {
      try {
        logger.info("Loading accounting data");
        setIsLoading(true);

        const db = await DatabaseService.getDBConnection();

        const [tables] = await DatabaseService.executeQuery(
          db,
          "SELECT name FROM sqlite_master WHERE type='table'",
          []
        );

        if (tables && tables.rows.length > 0) {
          logger.debug("Database tables:");
          for (let i = 0; i < tables.rows.length; i++) {
            logger.debug(`- ${tables.rows.item(i).name}`);
          }
        }

        const [accountsResult] = await DatabaseService.executeQuery(
          db,
          'SELECT * FROM accounts ORDER BY name',
          []
        );

        if (accountsResult && accountsResult.rows.length > 0) {
          const accounts = [];
          for (let i = 0; i < accountsResult.rows.length; i++) {
            accounts.push(accountsResult.rows.item(i));
          }
          setAccountData(accounts);
        }

      } catch (error) {
        logger.error("Error loading accounting data:", error);
        setAccountData([
          { id: 1, name: 'Compte Bancaire', type: 'cash', balance: 1500000 },
          { id: 2, name: 'Caisse', type: 'cash', balance: 250000 },
          { id: 3, name: 'Clients', type: 'receivable', balance: 750000 }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAccountingData();
  }, []);

  const handleNavigateToEntry = (entryId: string) => {
    navigation.navigate('JournalEntryDetails', { entryId });
  };

  const handleNewEntry = () => {
    navigation.navigate('AddJournalEntry');
  };

  if (isLoading) {
    return (
      <OrientationAwareView style={styles.loadingContainer}>
        <AppHeader title={t('accounting')} />
        <ActivityIndicator size="large" color="#6200EE" />
      </OrientationAwareView>
    );
  }

  // Rendu pour le mode paysage
  const renderLandscapeContent = () => {
    return (
      <View style={styles.landscapeContentWrapper}>
        <View style={styles.landscapeSidebar}>
          <Card style={styles.landscapeTabCard}>
            <Card.Content>
              <List.Item
                title={t('transactions')}
                left={props => <List.Icon {...props} icon="swap-horizontal" />}
                onPress={() => setActiveTab('transactions')}
                style={activeTab === 'transactions' ? styles.activeTabItem : null}
              />
              <List.Item
                title={t('reports')}
                left={props => <List.Icon {...props} icon="file-chart" />}
                onPress={() => setActiveTab('reports')}
                style={activeTab === 'reports' ? styles.activeTabItem : null}
              />
              <List.Item
                title={t('accounts')}
                left={props => <List.Icon {...props} icon="bank" />}
                onPress={() => setActiveTab('accounts')}
                style={activeTab === 'accounts' ? styles.activeTabItem : null}
              />
            </Card.Content>
          </Card>
          
          {activeTab === 'transactions' && (
            <Button 
              mode="contained" 
              onPress={handleNewEntry}
              icon="plus"
              style={styles.landscapeActionButton}
            >
              {t('new_entry')}
            </Button>
          )}
        </View>

        <View style={styles.landscapeMainContent}>
          {activeTab === 'transactions' && (
            <Card style={styles.landscapeCard}>
              <Card.Title title={t('journal_entries')} />
              <Card.Content>
                <Text>Card content here</Text>
              </Card.Content>
            </Card>
          )}

          {activeTab === 'reports' && (
            <Card style={styles.landscapeCard}>
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
          )}

          {activeTab === 'accounts' && (
            <Card style={styles.landscapeCard}>
              <Card.Title title={t('chart_of_accounts')} />
              <Card.Content>
                {accountData.map((account: any) => (
                  <View key={account.id}>
                    <List.Item
                      title={account.name}
                      description={`Balance: $${account.balance.toLocaleString()}`}
                      left={props => <List.Icon {...props} icon="folder" />}
                      onPress={() => {}}
                    />
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}
        </View>
      </View>
    );
  };

  // Rendu pour le mode portrait (existant)
  const renderPortraitContent = () => {
    return (
      <>
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
                <Button mode="contained-tonal" onPress={handleNewEntry}>
                  {t('new_entry')}
                </Button>
              </View>
              
              <Card style={styles.card}>
                <Card.Content>
                  <Text>Card content here</Text>
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
                  {accountData.map((account: any) => (
                    <View key={account.id}>
                      <List.Item
                        title={account.name}
                        description={`Balance: $${account.balance.toLocaleString()}`}
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
      </>
    );
  };

  return (
    <OrientationAwareView style={styles.container}>
      <AppHeader title={t('accounting')} />
      {isLandscape ? renderLandscapeContent() : renderPortraitContent()}
    </OrientationAwareView>
  );
};

// Styles existants
const existingStyles = StyleSheet.create({
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
});

// Styles pour le mode paysage
const landscapeStyles = StyleSheet.create({
  landscapeContentWrapper: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  landscapeSidebar: {
    width: 220,
    marginRight: 8,
  },
  landscapeTabCard: {
    marginBottom: 8,
  },
  landscapeMainContent: {
    flex: 1,
  },
  landscapeCard: {
    marginBottom: 8,
  },
  activeTabItem: {
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
    borderRadius: 4,
  },
  landscapeActionButton: {
    marginTop: 8,
  },
});

const styles = {
  ...existingStyles,
  ...landscapeStyles,
};

export default AccountingScreen;
