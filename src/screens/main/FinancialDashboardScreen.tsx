import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Title, Button, List, Avatar, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { formatDate } from '../../utils/formatters';
import FinancialService from '../../services/FinancialService';
import { Colors } from '../../constants/Colors';
import AppHeader from '../../components/common/AppHeader';
import CurrencyAmount from '../../components/common/CurrencyAmount';

// Interface pour les données financières
interface FinancialData {
  financialStatements: {
    balanceSheet: {
      assets: {
        currentAssets: {
          cash: number;
          bank: number;
          accountsReceivable: number;
          inventory: number;
          total: number;
        };
        fixedAssets: {
          equipment: number;
          buildings: number;
          land: number;
          total: number;
        };
        totalAssets: number;
      };
      liabilities: {
        currentLiabilities: {
          accountsPayable: number;
          shortTermLoans: number;
          total: number;
        };
        longTermLiabilities: {
          longTermDebt: number;
          total: number;
        };
        totalLiabilities: number;
      };
      equity: {
        capital: number;
        retainedEarnings: number;
        total: number;
      };
    };
    incomeStatement: {
      revenue: number;
      costOfGoodsSold: number;
      grossProfit: number;
      expenses: {
        salaries: number;
        rent: number;
        utilities: number;
        other: number;
        total: number;
      };
      operatingProfit: number;
      interestExpense: number;
      taxExpense: number;
      netIncome: number;
    };
  };
}

// Interface pour les données d'abonnement
interface SubscriptionData {
  plan: string;
  expiryDate: Date;
  usedTokens: number;
  remainingTokens: number;
  totalTokens: number;
  creditScore: number;
}

const FinancialDashboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  
  // États pour les données
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Charger les données financières
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les données financières
        const financialStatementsData = await FinancialService.getFinancialStatements();
        setFinancialData(financialStatementsData);
        
        // Récupérer les transactions récentes
        const recentTransactionsData = await FinancialService.getRecentTransactions();
        setRecentTransactions(recentTransactionsData);
        
        // Récupérer les données d'abonnement
        const subscriptionInfo = await FinancialService.getSubscriptionInfo();
        setSubscriptionData(subscriptionInfo);
      } catch (error) {
        console.error('Error fetching financial data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Navigation vers les écrans liés
  const handleNavigateToJournalEntry = (id: string) => {
    navigation.navigate('JournalEntryDetails', { id });
  };
  
  const handleNavigateToSubscriptions = () => {
    navigation.navigate('Subscriptions');
  };
  
  const handleNavigateToTokenPurchase = () => {
    navigation.navigate('TokenPurchase');
  };
  
  const handleNavigateToFinancialStatements = () => {
    navigation.navigate('FinancialStatements');
  };
  
  // Rendu conditionnel des données financières
  const renderFinancialData = () => {
    if (!financialData) return null;
    
    return (
      <>
        {/* Account Balance Card */}
        <Card style={styles.card}>
          <Card.Title 
            title={t('account_balances')} 
            subtitle={t('current_month')} 
          />
          <Card.Content>
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>{t('cash')}</Text>
              <CurrencyAmount 
                amount={financialData?.financialStatements?.balanceSheet?.assets?.currentAssets?.cash || 0}
                style={styles.balanceAmount}
              />
            </View>
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>{t('bank')}</Text>
              <CurrencyAmount 
                amount={financialData?.financialStatements?.balanceSheet?.assets?.currentAssets?.bank || 0}
                style={styles.balanceAmount}
              />
            </View>
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>{t('accounts_receivable')}</Text>
              <CurrencyAmount 
                amount={financialData?.financialStatements?.balanceSheet?.assets?.currentAssets?.accountsReceivable || 0}
                style={styles.balanceAmount}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>{t('net_position')}</Text>
              <CurrencyAmount 
                amount={
                  (financialData?.financialStatements?.balanceSheet?.assets?.totalAssets || 0) - 
                  (financialData?.financialStatements?.balanceSheet?.liabilities?.totalLiabilities || 0)
                }
                style={styles.totalAmount}
              />
            </View>
          </Card.Content>
          <Card.Actions>
            <Button onPress={handleNavigateToFinancialStatements}>
              {t('view_financial_statements')}
            </Button>
          </Card.Actions>
        </Card>
        
        {/* Income Statement Card */}
        <Card style={styles.card}>
          <Card.Title 
            title={t('income_statement')} 
            subtitle={t('current_month')} 
          />
          <Card.Content>
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>{t('revenue')}</Text>
              <CurrencyAmount 
                amount={financialData?.financialStatements?.incomeStatement?.revenue || 0}
                style={styles.balanceAmount}
              />
            </View>
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>{t('expenses')}</Text>
              <CurrencyAmount 
                amount={financialData?.financialStatements?.incomeStatement?.expenses?.total || 0}
                style={styles.balanceAmount}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>{t('net_income')}</Text>
              <CurrencyAmount 
                amount={financialData?.financialStatements?.incomeStatement?.netIncome || 0}
                style={[
                  styles.totalAmount,
                  { color: (financialData?.financialStatements?.incomeStatement?.netIncome || 0) >= 0 
                    ? '#4CAF50' 
                    : '#F44336' 
                  }
                ]}
              />
            </View>
          </Card.Content>
        </Card>
      </>
    );
  };
  
  // Rendu de la carte des transactions récentes
  const renderRecentTransactions = () => {
    return (
      <Card style={styles.card}>
        <Card.Title 
          title={t('recent_transactions')} 
          subtitle={t('last_entries')} 
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
                    <CurrencyAmount
                      amount={entry.lines.reduce((sum: number, line: any) => sum + (line.debit - line.credit), 0)}
                      style={styles.amount}
                    />
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
    );
  };
  
  // Rendu de la carte d'abonnement et de tokens
  const renderSubscriptionCard = () => {
    if (!subscriptionData) return null;
    
    return (
      <Card style={styles.card}>
        <Card.Title 
          title={t('subscription_tokens')}
        />
        <Card.Content>
          <View style={styles.subscriptionRow}>
            <Text style={styles.subscriptionLabel}>{t('plan')}:</Text>
            <Text style={styles.subscriptionValue}>{subscriptionData.plan}</Text>
          </View>
          <View style={styles.subscriptionRow}>
            <Text style={styles.subscriptionLabel}>{t('expires')}:</Text>
            <Text style={styles.subscriptionValue}>
              {formatDate(subscriptionData.expiryDate.toISOString())}
            </Text>
          </View>
          <View style={styles.subscriptionRow}>
            <Text style={styles.subscriptionLabel}>{t('status')}:</Text>
            <View style={[styles.statusBadge, { backgroundColor: Colors.primary + '30' }]}>
              <Text style={{ color: Colors.primary }}>{t('active')}</Text>
            </View>
          </View>
          
          <Divider style={{ marginVertical: 10 }} />
          
          <Text style={styles.sectionTitle}>{t('tokens')}</Text>
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
        <Card.Actions style={styles.cardActions}>
          <Button onPress={handleNavigateToTokenPurchase}>
            {t('buy_tokens')}
          </Button>
          <Button onPress={handleNavigateToSubscriptions}>
            {t('manage_subscription')}
          </Button>
        </Card.Actions>
      </Card>
    );
  };
  
  return (
    <View style={styles.container}>
      <AppHeader title={t('financial_dashboard')} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {renderSubscriptionCard()}
        {renderFinancialData()}
        {renderRecentTransactions()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
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
    marginVertical: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
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
    marginVertical: 8,
  },
  tokenText: {
    fontSize: 14,
  },
  creditScoreContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  creditScoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  creditScoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  creditScoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  creditScoreDescription: {
    fontSize: 14,
  },
  cardActions: {
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
});

export default FinancialDashboardScreen;
