import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Avatar, useTheme, Button, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Transaction } from '../../data/transactionsMockData';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/types';
import { formatCurrency } from '../../utils/formatters';

interface RecentTransactionsWidgetProps {
  transactions: Transaction[];
}

const RecentTransactionsWidget: React.FC<RecentTransactionsWidgetProps> = ({ transactions }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income': return 'arrow-down';
      case 'expense': return 'arrow-up';
      case 'transfer': return 'swap-horizontal';
      default: return 'currency-usd';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'income': return theme.colors.primary; // Replace with a valid color from the theme
      case 'expense': return theme.colors.error;
      case 'transfer': return theme.colors.primary;
      default: return theme.colors.primary;
    }
  };

  const handleTransactionPress = (transaction: Transaction) => {
    navigation.navigate('TransactionDetails', { 
      transactionId: transaction.id 
    });
  };

  const viewAllTransactions = () => {
    navigation.navigate('MainTabs', { screen: 'Accounting' });
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => handleTransactionPress(item)}
    >
      <Avatar.Icon
        size={40}
        icon={getTransactionIcon(item.type)}
        style={{ backgroundColor: getTransactionColor(item.type) + '20' }} // Couleur avec opacité
        color={getTransactionColor(item.type)}
      />
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription} numberOfLines={1}>
          {item.description}
        </Text>
        <Text style={styles.transactionReference}>
          {item.reference} • {item.date}
        </Text>
      </View>
      <View style={styles.transactionAmount}>
        <Text
          style={[
            styles.amount,
            { color: getTransactionColor(item.type) }
          ]}
        >
          {item.type === 'expense' ? '-' : '+'} {formatCurrency(item.amount)}
        </Text>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  item.status === 'completed'
                    ? theme.colors.primary // Replace with a valid color from the theme
                    : item.status === 'pending'
                    ? theme.colors.secondary // Replace with a valid color from the theme
                    : theme.colors.error
              }
            ]}
          />
          <Text style={styles.statusText}>
            {t(item.status)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="refresh" 
              size={40} 
              color={theme.colors.primary} 
            />
            <Text style={styles.emptyText}>
              {t('no_recent_transactions')}
            </Text>
          </View>
        )}
      />
      <Button 
        mode="text"
        onPress={viewAllTransactions}
        style={styles.viewAllButton}
        labelStyle={{ color: theme.colors.primary }}
      >
        {t('view_all')}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionDetails: {
    flex: 1,
    marginHorizontal: 12,
  },
  transactionDescription: {
    fontWeight: '500',
    fontSize: 14,
    marginBottom: 2,
  },
  transactionReference: {
    fontSize: 12,
    color: '#666',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  viewAllButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
});

export default RecentTransactionsWidget;
