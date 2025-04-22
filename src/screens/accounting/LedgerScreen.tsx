import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Divider, Searchbar, Button, Menu, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import useOrientation from '../../hooks/useOrientation';

import AppHeader from '../../components/common/AppHeader';
import EmptyState from '../../components/common/EmptyState';
import { Colors } from '../../constants/Colors';
import AccountingService from '../../services/AccountingService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import CurrencyAmount from '../../components/common/CurrencyAmount';
import { useTranslation } from 'react-i18next';

// Types pour le grand livre
interface LedgerAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  openingBalance: number;
  currentBalance: number;
  transactions: LedgerTransaction[];
}

interface LedgerTransaction {
  id: string;
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface FiscalYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

const LedgerScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { t } = useTranslation();
  const { orientation } = useOrientation();
  
  // États pour les filtres et la recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<LedgerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<FiscalYear | null>(null);
  const [fiscalYearMenuVisible, setFiscalYearMenuVisible] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: new Date(), endDate: new Date() });
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [customDateRangeActive, setCustomDateRangeActive] = useState(false);

  // Charger les données des exercices fiscaux
  useEffect(() => {
    const loadFiscalYears = async () => {
      try {
        // En réel, appeler le service avec : const years = await AccountingService.getFiscalYears();
        // Pour l'instant, on utilise des données mockées
        const mockYears: FiscalYear[] = [
          {
            id: '1',
            name: 'Exercice 2025',
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            isCurrent: true
          },
          {
            id: '2',
            name: 'Exercice 2024',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            isCurrent: false
          },
          {
            id: '3',
            name: 'Exercice 2023',
            startDate: '2023-01-01',
            endDate: '2023-12-31',
            isCurrent: false
          }
        ];
        
        setFiscalYears(mockYears);
        const currentYear = mockYears.find(year => year.isCurrent);
        if (currentYear) {
          setSelectedFiscalYear(currentYear);
          setDateRange({
            startDate: new Date(currentYear.startDate),
            endDate: new Date(currentYear.endDate)
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement des exercices fiscaux:", error);
      }
    };
    
    loadFiscalYears();
  }, []);

  // Charger les comptes du grand livre lorsque l'exercice fiscal change
  useEffect(() => {
    loadLedgerAccounts();
  }, [selectedFiscalYear, customDateRangeActive, dateRange]);

  // Fonction pour charger les comptes du grand livre
  const loadLedgerAccounts = async () => {
    if (!selectedFiscalYear && !customDateRangeActive) {
      return;
    }
    
    setLoading(true);
    try {
      // En réel, appeler le service avec :
      // const ledgerData = await AccountingService.getLedgerAccounts(startDate, endDate);
      
      // Pour l'instant, on utilise des données mockées
      const mockLedgerAccounts: LedgerAccount[] = [
        {
          id: '1',
          accountNumber: '52000000',
          accountName: 'Banque',
          openingBalance: 1250000,
          currentBalance: 1735000,
          transactions: [
            {
              id: 't1',
              date: '2025-01-05',
              reference: 'INV-2025-001',
              description: 'Paiement client ABC Corp',
              debit: 450000,
              credit: 0,
              balance: 1700000
            },
            {
              id: 't2',
              date: '2025-01-12',
              reference: 'PO-2025-001',
              description: 'Achat fournitures bureau',
              debit: 0,
              credit: 75000,
              balance: 1625000
            },
            {
              id: 't3',
              date: '2025-02-01',
              reference: 'INV-2025-008',
              description: 'Paiement client XYZ Ltd',
              debit: 320000,
              credit: 0,
              balance: 1945000
            },
            {
              id: 't4',
              date: '2025-02-15',
              reference: 'SAL-FEB-2025',
              description: 'Paiement salaires',
              debit: 0,
              credit: 850000,
              balance: 1095000
            },
            {
              id: 't5',
              date: '2025-03-01',
              reference: 'BANK-FEE-MAR',
              description: 'Frais bancaires mensuels',
              debit: 0,
              credit: 15000,
              balance: 1080000
            },
            {
              id: 't6',
              date: '2025-03-10',
              reference: 'INV-2025-015',
              description: 'Paiement client DEF Inc',
              debit: 655000,
              credit: 0,
              balance: 1735000
            }
          ]
        },
        {
          id: '2',
          accountNumber: '41000000',
          accountName: 'Clients',
          openingBalance: 750000,
          currentBalance: 450000,
          transactions: [
            {
              id: 't7',
              date: '2025-01-05',
              reference: 'INV-2025-001',
              description: 'Facture client ABC Corp',
              debit: 450000,
              credit: 0,
              balance: 1200000
            },
            {
              id: 't8',
              date: '2025-01-05',
              reference: 'INV-2025-001',
              description: 'Paiement client ABC Corp',
              debit: 0,
              credit: 450000,
              balance: 750000
            },
            {
              id: 't9',
              date: '2025-02-01',
              reference: 'INV-2025-008',
              description: 'Facture client XYZ Ltd',
              debit: 320000,
              credit: 0,
              balance: 1070000
            },
            {
              id: 't10',
              date: '2025-02-01',
              reference: 'INV-2025-008',
              description: 'Paiement client XYZ Ltd',
              debit: 0,
              credit: 320000,
              balance: 750000
            },
            {
              id: 't11',
              date: '2025-03-10',
              reference: 'INV-2025-015',
              description: 'Facture client DEF Inc',
              debit: 655000,
              credit: 0,
              balance: 1405000
            },
            {
              id: 't12',
              date: '2025-03-10',
              reference: 'INV-2025-015',
              description: 'Paiement client DEF Inc',
              debit: 0,
              credit: 655000,
              balance: 750000
            }
          ]
        },
        {
          id: '3',
          accountNumber: '60000000',
          accountName: 'Achats',
          openingBalance: 0,
          currentBalance: 75000,
          transactions: [
            {
              id: 't13',
              date: '2025-01-12',
              reference: 'PO-2025-001',
              description: 'Achat fournitures bureau',
              debit: 75000,
              credit: 0,
              balance: 75000
            }
          ]
        },
        {
          id: '4',
          accountNumber: '64000000',
          accountName: 'Charges de personnel',
          openingBalance: 0,
          currentBalance: 850000,
          transactions: [
            {
              id: 't14',
              date: '2025-02-15',
              reference: 'SAL-FEB-2025',
              description: 'Paiement salaires',
              debit: 850000,
              credit: 0,
              balance: 850000
            }
          ]
        },
        {
          id: '5',
          accountNumber: '66000000',
          accountName: 'Charges financières',
          openingBalance: 0,
          currentBalance: 15000,
          transactions: [
            {
              id: 't15',
              date: '2025-03-01',
              reference: 'BANK-FEE-MAR',
              description: 'Frais bancaires mensuels',
              debit: 15000,
              credit: 0,
              balance: 15000
            }
          ]
        },
        {
          id: '6',
          accountNumber: '70000000',
          accountName: 'Ventes de produits',
          openingBalance: 0,
          currentBalance: 1425000,
          transactions: [
            {
              id: 't16',
              date: '2025-01-05',
              reference: 'INV-2025-001',
              description: 'Facture client ABC Corp',
              debit: 0,
              credit: 450000,
              balance: 450000
            },
            {
              id: 't17',
              date: '2025-02-01',
              reference: 'INV-2025-008',
              description: 'Facture client XYZ Ltd',
              debit: 0,
              credit: 320000,
              balance: 770000
            },
            {
              id: 't18',
              date: '2025-03-10',
              reference: 'INV-2025-015',
              description: 'Facture client DEF Inc',
              debit: 0,
              credit: 655000,
              balance: 1425000
            }
          ]
        }
      ];
      
      setAccounts(mockLedgerAccounts);
      setFilteredAccounts(mockLedgerAccounts);
    } catch (error) {
      console.error("Erreur lors du chargement des données du grand livre:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les comptes en fonction de la recherche
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAccounts(accounts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = accounts.filter(
        account => 
          account.accountNumber.toLowerCase().includes(query) || 
          account.accountName.toLowerCase().includes(query)
      );
      setFilteredAccounts(filtered);
    }
  }, [searchQuery, accounts]);

  // Gérer le changement de date
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (!selectedDate) {
      setShowDatePicker(null);
      return;
    }
    
    if (showDatePicker === 'start') {
      setDateRange(prev => ({ ...prev, startDate: selectedDate }));
    } else {
      setDateRange(prev => ({ ...prev, endDate: selectedDate }));
    }
    
    setShowDatePicker(null);
  };

  // Gérer le changement d'exercice fiscal
  const handleSelectFiscalYear = (year: FiscalYear) => {
    setSelectedFiscalYear(year);
    setCustomDateRangeActive(false);
    setDateRange({
      startDate: new Date(year.startDate),
      endDate: new Date(year.endDate)
    });
    setFiscalYearMenuVisible(false);
  };

  // Activer l'intervalle de date personnalisé
  const activateCustomDateRange = () => {
    setSelectedFiscalYear(null);
    setCustomDateRangeActive(true);
    setFiscalYearMenuVisible(false);
  };

  // Rendu d'un élément de compte
  const renderAccountItem = ({ item: account }: { item: LedgerAccount }) => {
    const isExpanded = expandedAccountId === account.id;
    
    return (
      <Card style={styles.accountCard}>
        <TouchableOpacity 
          style={styles.accountHeader}
          onPress={() => setExpandedAccountId(isExpanded ? null : account.id)}
        >
          <View style={styles.accountInfo}>
            <Text style={styles.accountNumber}>{account.accountNumber}</Text>
            <Text style={styles.accountName}>{account.accountName}</Text>
          </View>
          <View style={styles.balanceInfo}>
            <CurrencyAmount 
              amount={account.currentBalance}
              style={styles.balanceAmount}
            />
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#666" 
            />
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.transactionsContainer}>
            <View style={styles.accountSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t('opening_balance')}:</Text>
                <CurrencyAmount 
                  amount={account.openingBalance}
                  style={styles.summaryValue}
                />
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t('final_balance')}:</Text>
                <CurrencyAmount
                  amount={account.currentBalance}
                  style={[styles.summaryValue, styles.finalBalance]}
                />
              </View>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.transactionHeader}>
              <Text style={[styles.transactionHeaderCell, { flex: 1 }]}>{t('date')}</Text>
              <Text style={[styles.transactionHeaderCell, { flex: 1 }]}>{t('reference')}</Text>
              <Text style={[styles.transactionHeaderCell, { flex: 2 }]}>{t('description')}</Text>
              <Text style={[styles.transactionHeaderCell, { flex: 1, textAlign: 'right' }]}>{t('debit')}</Text>
              <Text style={[styles.transactionHeaderCell, { flex: 1, textAlign: 'right' }]}>{t('credit')}</Text>
              <Text style={[styles.transactionHeaderCell, { flex: 1, textAlign: 'right' }]}>{t('balance')}</Text>
            </View>
            
            {account.transactions.map(transaction => (
              <View key={transaction.id} style={styles.transactionRow}>
                <Text style={[styles.transactionCell, { flex: 1 }]}>
                  {formatDate(transaction.date)}
                </Text>
                <Text style={[styles.transactionCell, { flex: 1 }]}>
                  {transaction.reference}
                </Text>
                <Text style={[styles.transactionCell, { flex: 2 }]} numberOfLines={1}>
                  {transaction.description}
                </Text>
                <Text style={[styles.transactionCell, { flex: 1, textAlign: 'right' }]}>
                  {transaction.debit > 0 ? <CurrencyAmount amount={transaction.debit} showSymbol={false} /> : ''}
                </Text>
                <Text style={[styles.transactionCell, { flex: 1, textAlign: 'right' }]}>
                  {transaction.credit > 0 ? <CurrencyAmount amount={transaction.credit} showSymbol={false} /> : ''}
                </Text>
                <Text style={[styles.transactionCell, { flex: 1, textAlign: 'right', fontWeight: 'bold' }]}>
                  <CurrencyAmount amount={transaction.balance} showSymbol={false} />
                </Text>
              </View>
            ))}
            
            <View style={styles.transactionTotals}>
              <Text style={[styles.totalLabel, { flex: 4 }]}>{t('totals')}</Text>
              <Text style={[styles.totalValue, { flex: 1, textAlign: 'right' }]}>
                <CurrencyAmount 
                  amount={account.transactions.reduce((sum, t) => sum + t.debit, 0)} 
                  showSymbol={false}
                />
              </Text>
              <Text style={[styles.totalValue, { flex: 1, textAlign: 'right' }]}>
                <CurrencyAmount 
                  amount={account.transactions.reduce((sum, t) => sum + t.credit, 0)} 
                  showSymbol={false}
                />
              </Text>
              <Text style={[styles.totalValue, { flex: 1 }]} />
            </View>
            
            <View style={styles.viewTransactionsButtonContainer}>
              <Button 
                mode="outlined" 
                onPress={() => navigation.navigate('AccountDetails', { accountId: account.id })}
              >
                {t('account_details')}
              </Button>
            </View>
          </View>
        )}
      </Card>
    );
  };

  // Rendu du composant principal
  return (
    <View style={[styles.container, orientation === 'landscape' ? styles.containerLandscape : {}]}>
      <AppHeader 
        title={t('general_ledger')} 
        onBack={() => navigation.goBack()}
      />
      
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <Menu
            visible={fiscalYearMenuVisible}
            onDismiss={() => setFiscalYearMenuVisible(false)}
            anchor={
              <TouchableOpacity 
                style={styles.fiscalYearSelector} 
                onPress={() => setFiscalYearMenuVisible(true)}
              >
                <Text style={styles.fiscalYearText}>
                  {selectedFiscalYear 
                    ? selectedFiscalYear.name 
                    : customDateRangeActive 
                      ? "Période personnalisée" 
                      : "Sélectionner un exercice"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            }
          >
            {fiscalYears.map(year => (
              <Menu.Item
                key={year.id}
                title={year.name}
                onPress={() => handleSelectFiscalYear(year)}
              />
            ))}
            <Divider />
            <Menu.Item
              title="Période personnalisée"
              onPress={activateCustomDateRange}
            />
          </Menu>
          
          {customDateRangeActive && (
            <View style={styles.dateRangeContainer}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowDatePicker('start')}
              >
                <Text style={styles.dateButtonLabel}>Du: </Text>
                <Text>{formatDate(dateRange.startDate.toISOString())}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowDatePicker('end')}
              >
                <Text style={styles.dateButtonLabel}>Au: </Text>
                <Text>{formatDate(dateRange.endDate.toISOString())}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <Searchbar
          placeholder="Rechercher un compte..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={{ fontSize: 14 }}
        />
      </View>
      
      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === 'start' ? dateRange.startDate : dateRange.endDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement des données...</Text>
        </View>
      ) : filteredAccounts.length > 0 ? (
        <FlatList
          data={filteredAccounts}
          renderItem={renderAccountItem}
          keyExtractor={account => account.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <EmptyState
            message="Aucun compte trouvé"
            subMessage="Aucun compte ne correspond à votre recherche ou il n'y a pas de transactions pour cette période."
          />
        </ScrollView>
      )}
      
      <View style={styles.actionsContainer}>
        <Button 
          mode="contained" 
          style={styles.actionButton}
          icon="file-export" 
          onPress={() => {
            // Fonctionnalité d'export
            console.log('Export du grand livre');
          }}
        >
          Exporter
        </Button>
        
        <Button 
          mode="contained" 
          style={styles.actionButton}
          icon="printer" 
          onPress={() => {
            // Fonctionnalité d'impression
            console.log('Impression du grand livre');
          }}
        >
          Imprimer
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  containerLandscape: {
    paddingHorizontal: 20,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterRow: {
    marginBottom: 10,
  },
  fiscalYearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
  fiscalYearText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 5,
    flex: 0.48,
  },
  dateButtonLabel: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  searchBar: {
    marginTop: 5,
    borderRadius: 5,
    height: 40,
    elevation: 0,
    backgroundColor: '#f0f0f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  listContent: {
    padding: 10,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  accountCard: {
    marginBottom: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
  },
  accountInfo: {
    flex: 1,
  },
  accountNumber: {
    fontSize: 14,
    color: '#666',
  },
  accountName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    color: Colors.primary,
  },
  transactionsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  accountSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingTop: 5,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  finalBalance: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 10,
  },
  transactionHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  transactionHeaderCell: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
    paddingHorizontal: 5,
  },
  transactionRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionCell: {
    fontSize: 12,
    color: '#333',
    paddingHorizontal: 5,
  },
  transactionTotals: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 5,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 5,
  },
  viewTransactionsButtonContainer: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    minWidth: 120,
  },
});

export default LedgerScreen;
