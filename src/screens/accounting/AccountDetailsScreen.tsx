import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Divider, List, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRoute, RouteProp } from '@react-navigation/native';
import AppHeader from '../../components/common/AppHeader';
import { MainStackParamList } from '../../navigation/types';
import Chart from '../../components/common/Chart';

type AccountDetailsRouteProp = RouteProp<MainStackParamList, 'AccountDetails'>;

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  reference: string;
}

const AccountDetailsScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<AccountDetailsRouteProp>();
  const { accountId } = route.params;
  
  // Mock account data - in a real app, this would come from an API or database
  const [account, setAccount] = useState({
    id: accountId,
    code: '512000',
    name: 'Compte Bancaire Principal',
    type: 'asset',
    category: 'cash_and_cash_equivalents',
    balance: 1250000,
    currency: 'XOF',
    description: 'Compte bancaire principal pour les opérations quotidiennes',
    openingDate: '2023-01-01',
    status: 'active'
  });
  
  // Mock transaction history
  const [transactions, setTransactions] = useState<Transaction[]>([
    { 
      id: '1', 
      date: '2023-04-15', 
      description: 'Paiement client ABC Corp', 
      amount: 450000, 
      type: 'credit',
      reference: 'INV-2023-042' 
    },
    { 
      id: '2', 
      date: '2023-04-12', 
      description: 'Achat fournitures bureau', 
      amount: 75000, 
      type: 'debit',
      reference: 'PO-2023-105' 
    },
    { 
      id: '3', 
      date: '2023-04-10', 
      description: 'Paiement salaires', 
      amount: 850000, 
      type: 'debit',
      reference: 'SAL-APR-2023' 
    },
    { 
      id: '4', 
      date: '2023-04-05', 
      description: 'Paiement client XYZ Ltd', 
      amount: 320000, 
      type: 'credit',
      reference: 'INV-2023-039' 
    },
    { 
      id: '5', 
      date: '2023-04-01', 
      description: 'Frais bancaires mensuels', 
      amount: 15000, 
      type: 'debit',
      reference: 'BANK-FEE-APR' 
    },
  ]);
  
  // Chart data
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [1100000, 1250000, 950000, 1450000, 1250000, 1450000],
        color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'asset': return t('asset');
      case 'liability': return t('liability');
      case 'equity': return t('equity');
      case 'revenue': return t('revenue');
      case 'expense': return t('expense');
      default: return type;
    }
  };
  
  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <List.Item
      title={item.description}
      description={item.reference}
      left={props => <List.Icon {...props} icon={item.type === 'credit' ? 'arrow-down' : 'arrow-up'} />}
      right={props => (
        <View style={styles.transactionAmount}>
          <Text style={{ 
            color: item.type === 'credit' ? '#4CAF50' : '#F44336',
            fontWeight: 'bold'
          }}>
            {item.type === 'credit' ? '+' : '-'} {formatCurrency(item.amount)}
          </Text>
          <Text style={styles.transactionDate}>{item.date}</Text>
        </View>
      )}
    />
  );
  
  return (
    <View style={styles.container}>
      <AppHeader title={t('account_details')} showBack />
      
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.accountHeader}>
              <View>
                <Title style={styles.accountName}>{account.name}</Title>
                <Paragraph style={styles.accountCode}>{account.code}</Paragraph>
              </View>
              <Chip mode="outlined">{getAccountTypeLabel(account.type)}</Chip>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.balanceSection}>
              <Text style={styles.balanceLabel}>{t('current_balance')}</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(account.balance)}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <Text style={styles.sectionTitle}>{t('account_information')}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('description')}</Text>
              <Text style={styles.infoValue}>{account.description}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('category')}</Text>
              <Text style={styles.infoValue}>{account.category.replace('_', ' ')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('opening_date')}</Text>
              <Text style={styles.infoValue}>{account.openingDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('status')}</Text>
              <Text style={styles.infoValue}>{account.status}</Text>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Title>{t('balance_history')}</Title>
            <Chart
              data={chartData}
              width={300}
              height={220}
              type="line"
            />
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.transactionsTitle}>{t('recent_transactions')}</Title>
          </Card.Content>
          <Divider />
          <FlatList
            data={transactions}
            keyExtractor={item => item.id}
            renderItem={renderTransactionItem}
            scrollEnabled={false}
          />
          <Button 
            mode="text" 
            onPress={() => console.log('View all transactions')}
            style={styles.viewAllButton}
          >
            {t('view_all_transactions')}
          </Button>
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            icon="plus" 
            onPress={() => console.log('Add transaction')}
            style={styles.mainButton}
          >
            {t('add_transaction')}
          </Button>
          <Button 
            mode="outlined"
            icon="pencil"
            onPress={() => console.log('Edit account')}
            style={styles.secondaryButton}
          >
            {t('edit_account')}
          </Button>
        </View>
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
  card: {
    margin: 16,
    marginBottom: 8,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  accountName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  accountCode: {
    color: '#666',
  },
  divider: {
    marginVertical: 16,
  },
  balanceSection: {
    alignItems: 'center',
    marginVertical: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    color: '#666',
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
  },
  transactionsTitle: {
    marginBottom: 8,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  viewAllButton: {
    margin: 8,
  },
  buttonContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  mainButton: {
    marginBottom: 8,
  },
  secondaryButton: {
  },
});

export default AccountDetailsScreen;
