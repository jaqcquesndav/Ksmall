import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, List, Avatar, Portal, Modal, IconButton, ProgressBar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { MainStackParamList } from '../../navigation/types';
import AppHeader from '../../components/common/AppHeader';
import { accountingMockData } from '../../data/mockData';
import logger from '../../utils/logger';

const FinancialDashboardScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [financialData, setFinancialData] = useState<any>(null);
  const [subscriptionData, setSubscriptionData] = useState({
    isActive: true,
    expiresAt: '2023-12-31',
    plan: 'Professional',
    monthlyTokens: 1000000,
    usedTokens: 236540,
    remainingTokens: 763460,
    creditScore: 85,
  });

  // Load mock data when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setFinancialData(accountingMockData);
      } catch (error) {
        logger.error('Failed to load financial data', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleNavigateToJournalEntry = (entryId: string) => {
    navigation.navigate('JournalEntryDetails', { entryId });
  };

  const handleNavigateToAccounting = () => {
    // @ts-ignore - We need to fix the Tabs navigation type
    navigation.navigate('Tabs', { screen: 'Accounting' });
  };
  
  const handleNavigateToInventory = () => {
    // @ts-ignore - We need to fix the Tabs navigation type
    navigation.navigate('Tabs', { screen: 'Inventory' });
  };

  const recentTransactions = financialData?.journalEntries?.slice(0, 5) || [];

  return (
    <View style={styles.container}>
      <AppHeader 
        title={t('financial_dashboard')}
        subtitle={user?.company}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Subscription Status Card */}
        <Card style={styles.card}>
          <Card.Title 
            title={t('subscription_status')} 
            right={(props) => (
              <Button 
                mode="text"
                onPress={() => navigation.navigate('PaymentMethods')}
              >
                {t('manage')}
              </Button>
            )}
          />
          <Card.Content>
            <View style={styles.subscriptionRow}>
              <Text style={styles.subscriptionLabel}>{t('status')}</Text>
              <View style={[
                styles.statusBadge, 
                {backgroundColor: subscriptionData.isActive ? '#E8F5E9' : '#FFEBEE'}
              ]}>
                <Text style={{
                  color: subscriptionData.isActive ? '#2E7D32' : '#C62828',
                  fontWeight: 'bold'
                }}>
                  {subscriptionData.isActive ? t('active') : t('inactive')}
                </Text>
              </View>
            </View>
            
            <View style={styles.subscriptionRow}>
              <Text style={styles.subscriptionLabel}>{t('plan')}</Text>
              <Text style={styles.subscriptionValue}>{subscriptionData.plan}</Text>
            </View>
            
            <View style={styles.subscriptionRow}>
              <Text style={styles.subscriptionLabel}>{t('expires')}</Text>
              <Text style={styles.subscriptionValue}>{subscriptionData.expiresAt}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <Text style={styles.sectionTitle}>{t('token_usage')}</Text>
            
            <ProgressBar 
              progress={subscriptionData.usedTokens / subscriptionData.monthlyTokens} 
              color="#6200EE" 
              style={styles.progressBar}
            />
            
            <View style={styles.tokenRow}>
              <Text style={styles.tokenText}>{t('used')}: {subscriptionData.usedTokens.toLocaleString()}</Text>
              <Text style={styles.tokenText}>{t('remaining')}: {subscriptionData.remainingTokens.toLocaleString()}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.creditScoreContainer}>
              <Text style={styles.creditScoreLabel}>{t('credit_score')}</Text>
              <View style={styles.creditScoreCircle}>
                <Text style={styles.creditScoreValue}>{subscriptionData.creditScore}</Text>
              </View>
              <Text style={styles.creditScoreDescription}>
                {subscriptionData.creditScore > 80 ? t('excellent_credit') : 
                 subscriptionData.creditScore > 60 ? t('good_credit') : t('fair_credit')}
              </Text>
            </View>
          </Card.Content>
        </Card>
        
        {/* Account Balance Card */}
        <Card style={styles.card}>
          <Card.Title 
            title={t('account_balances')} 
            subtitle={t('current_month')} 
          />
          <Card.Content>
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>{t('cash')}</Text>
              <Text style={styles.balanceAmount}>
                ${financialData?.financialStatements?.balanceSheet?.assets?.currentAssets?.cash?.toLocaleString() || '0'}
              </Text>
            </View>
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>{t('bank')}</Text>
              <Text style={styles.balanceAmount}>
                ${financialData?.financialStatements?.balanceSheet?.assets?.currentAssets?.bank?.toLocaleString() || '0'}
              </Text>
            </View>
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>{t('accounts_receivable')}</Text>
              <Text style={styles.balanceAmount}>
                ${financialData?.financialStatements?.balanceSheet?.assets?.currentAssets?.accountsReceivable?.toLocaleString() || '0'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>{t('total')}</Text>
              <Text style={styles.totalAmount}>
                ${financialData?.financialStatements?.balanceSheet?.assets?.currentAssets?.totalCurrentAssets?.toLocaleString() || '0'}
              </Text>
            </View>
          </Card.Content>
        </Card>
        
        {/* Quick Actions Button */}
        <View style={styles.quickActionsButtonContainer}>
          <IconButton
            icon="plus"
            mode="contained"
            size={24}
            onPress={() => setQuickActionsVisible(true)}
          />
          <Text style={styles.quickActionsText}>{t('quick_actions')}</Text>
        </View>
        
        {/* Recent Activity Card */}
        <Card style={styles.card}>
          <Card.Title 
            title={t('recent_activity')} 
            subtitle={t('last_transactions')} 
            right={(props) => (
              <IconButton
                {...props}
                icon="arrow-right"
                onPress={handleNavigateToAccounting}
              />
            )}
          />
          <Card.Content>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((entry: any) => (
                <List.Item
                  key={entry.id}
                  title={entry.description}
                  description={entry.date}
                  left={props => (
                    <Avatar.Icon
                      {...props}
                      size={40}
                      icon="file-document-outline"
                      style={{ backgroundColor: entry.status === 'pending' ? '#FFA726' : '#4CAF50' }}
                    />
                  )}
                  right={() => (
                    <View style={styles.amountContainer}>
                      <Text style={styles.amount}>
                        ${entry.lines.reduce((sum: number, line: any) => sum + (line.debit - line.credit), 0).toLocaleString()}
                      </Text>
                      <Text style={styles.status}>
                        {entry.status === 'pending' ? t('pending') : t('completed')}
                      </Text>
                    </View>
                  )}
                  onPress={() => handleNavigateToJournalEntry(entry.id)}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>{t('no_recent_transactions')}</Text>
            )}
          </Card.Content>
        </Card>
        
        {/* Quick Stats Card */}
        <Card style={styles.card}>
          <Card.Title title={t('quick_stats')} />
          <Card.Content>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('revenue')}</Text>
                <Text style={styles.statValue}>
                  ${financialData?.financialStatements?.incomeStatement?.revenue?.totalRevenue?.toLocaleString() || '0'}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('expenses')}</Text>
                <Text style={styles.statValue}>
                  ${financialData?.financialStatements?.incomeStatement?.expenses?.totalExpenses?.toLocaleString() || '0'}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('profit')}</Text>
                <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                  ${financialData?.financialStatements?.incomeStatement?.netProfit?.toLocaleString() || '0'}
                </Text>
              </View>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button
              onPress={handleNavigateToAccounting}
            >
              {t('view_reports')}
            </Button>
          </Card.Actions>
        </Card>
      </ScrollView>

      {/* Quick Actions Modal */}
      <Portal>
        <Modal
          visible={quickActionsVisible}
          onDismiss={() => setQuickActionsVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>{t('quick_actions')}</Text>
          <View style={styles.quickActionsGrid}>
            <Button 
              mode="outlined" 
              icon="file-plus" 
              style={styles.quickActionButton}
              onPress={() => {
                setQuickActionsVisible(false);
                handleNavigateToAccounting();
              }}
            >
              {t('new_transaction')}
            </Button>
            <Button 
              mode="outlined" 
              icon="account-cash" 
              style={styles.quickActionButton}
              onPress={() => {
                setQuickActionsVisible(false);
                handleNavigateToAccounting();
              }}
            >
              {t('record_payment')}
            </Button>
            <Button 
              mode="outlined" 
              icon="store" 
              style={styles.quickActionButton}
              onPress={() => {
                setQuickActionsVisible(false);
                handleNavigateToInventory();
              }}
            >
              {t('add_product')}
            </Button>
            <Button 
              mode="outlined" 
              icon="receipt" 
              style={styles.quickActionButton}
              onPress={() => {
                setQuickActionsVisible(false);
                handleNavigateToInventory();
              }}
            >
              {t('create_invoice')}
            </Button>
          </View>
          <Button 
            mode="contained"
            onPress={() => setQuickActionsVisible(false)}
            style={styles.closeButton}
          >
            {t('close')}
          </Button>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  status: {
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex:1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActionsButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  quickActionsText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6200EE',
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickActionButton: {
    width: '48%',
    marginBottom: 16,
  },
  closeButton: {
    marginTop: 8,
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  subscriptionLabel: {
    fontSize: 14,
    color: '#666',
  },
  subscriptionValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tokenText: {
    fontSize: 12,
    color: '#666',
  },
  creditScoreContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  creditScoreLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  creditScoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6200EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  creditScoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  creditScoreDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default FinancialDashboardScreen;
