import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, List, Avatar, Divider } from 'react-native-paper';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CurrencyService from '../../services/CurrencyService';

// Types pour les transactions
interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  status: string;
  account?: string;
  reference?: string;
}

interface RecentTransactionsWidgetProps {
  transactions: Transaction[];
}

// Type pour les noms d'icônes de MaterialCommunityIcons
type MaterialCommunityIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * Composant pour afficher les transactions récentes sur le dashboard
 */
const RecentTransactionsWidget: React.FC<RecentTransactionsWidgetProps> = ({ transactions }) => {
  const navigation = useNavigation<any>();
  const [currencyFormatter, setCurrencyFormatter] = useState<(amount: number) => string>(
    (amount) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount)
  );
  
  // Charger le formateur de devise au chargement du composant
  useEffect(() => {
    const loadCurrencyFormatter = async () => {
      try {
        const currencyInfo = await CurrencyService.getSelectedCurrencyInfo();
        setCurrencyFormatter(() => currencyInfo.format);
      } catch (error) {
        console.error('Erreur lors du chargement des informations de devise:', error);
      }
    };
    
    loadCurrencyFormatter();
  }, []);

  // Formater la date
  const formatDate = (date: Date): string => {
    return format(date, 'dd MMM yyyy', { locale: fr });
  };

  // Obtenir l'icône en fonction du type de compte
  const getAccountIcon = (accountCode?: string): MaterialCommunityIconName => {
    if (!accountCode) return 'bank';
    
    if (accountCode.startsWith('5')) return 'bank'; // Comptes de trésorerie
    if (accountCode.startsWith('4')) {
      if (accountCode.startsWith('41')) return 'account-arrow-left'; // Clients
      if (accountCode.startsWith('40')) return 'account-arrow-right'; // Fournisseurs
      return 'account'; // Autres comptes de tiers
    }
    if (accountCode.startsWith('7')) return 'cash-plus'; // Produits
    if (accountCode.startsWith('6')) return 'cash-minus'; // Charges
    
    return 'cash';
  };

  // Obtenir la couleur en fonction du type de compte
  const getAccountColor = (accountCode?: string): string => {
    if (!accountCode) return '#607D8B';
    
    if (accountCode.startsWith('5')) return '#2196F3'; // Comptes de trésorerie
    if (accountCode.startsWith('41')) return '#4CAF50'; // Clients (actif)
    if (accountCode.startsWith('40')) return '#F44336'; // Fournisseurs (passif)
    if (accountCode.startsWith('7')) return '#4CAF50'; // Produits
    if (accountCode.startsWith('6')) return '#F44336'; // Charges
    
    return '#607D8B';
  };

  // Gérer le clic sur une transaction
  const handleTransactionPress = (transactionId: string) => {
    console.log(`Navigation vers TransactionDetails avec ID: ${transactionId}`);
    // Utiliser une navigation imbriquée pour accéder à TransactionDetails depuis l'onglet Accounting
    navigation.navigate('MainTabs', {
      screen: 'Accounting',
      params: { 
        screen: 'TransactionDetails',
        params: { transactionId }
      }
    });
  };

  // Si pas de transactions, afficher un message
  if (!transactions || transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucune transaction récente</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {transactions.map((transaction, index) => (
        <React.Fragment key={transaction.id}>
          <List.Item
            title={transaction.description}
            description={`${formatDate(transaction.date)} • ${transaction.reference || 'Sans référence'}`}
            left={props => (
              <Avatar.Icon 
                {...props} 
                icon={() => (
                  <MaterialCommunityIcons 
                    name={getAccountIcon(transaction.account)} 
                    size={24} 
                    color="white"
                  />
                )}
                style={{backgroundColor: getAccountColor(transaction.account)}}
              />
            )}
            right={props => (
              <View style={styles.amountContainer}>
                <Text style={[
                  styles.amount,
                  transaction.amount >= 0 ? styles.positiveAmount : styles.negativeAmount
                ]}>
                  {currencyFormatter(transaction.amount)}
                </Text>
                <Text style={styles.status}>
                  {transaction.status === 'posted' ? 'Validé' : 
                   transaction.status === 'pending' ? 'En attente' : 'Annulé'}
                </Text>
              </View>
            )}
            onPress={() => handleTransactionPress(transaction.id)}
            style={styles.listItem}
          />
          {index < transactions.length - 1 && <Divider style={styles.divider} />}
        </React.Fragment>
      ))}
      
      <View style={styles.viewAllContainer}>
        <Text 
          style={styles.viewAll}
          onPress={() => navigation.navigate('MainTabs', { 
            screen: 'Accounting',
            params: { screen: 'JournalEntry' }
          })}
        >
          Voir toutes les transactions
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  listItem: {
    paddingLeft: 0,
  },
  divider: {
    marginVertical: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  positiveAmount: {
    color: '#4CAF50',
  },
  negativeAmount: {
    color: '#F44336',
  },
  status: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#757575',
    fontStyle: 'italic',
  },
  viewAllContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  viewAll: {
    color: '#2196F3',
    fontSize: 14,
  }
});

export default RecentTransactionsWidget;
