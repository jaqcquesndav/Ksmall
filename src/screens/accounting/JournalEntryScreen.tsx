import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card, Portal, Dialog, Button as PaperButton, Paragraph } from 'react-native-paper';

import AppHeader from '../../components/common/AppHeader';
import AccountingService, { Transaction } from '../../services/AccountingService';
import { formatDate } from '../../utils/formatters';
import { Colors } from '../../constants/Colors';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Divider from '../../components/common/Divider';
import Chip from '../../components/common/Chip';
import SearchBar from '../../components/common/SearchBar';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../hooks/useCurrency';
import useOrientation from '../../hooks/useOrientation';

// Interface pour les filtres exportables
interface JournalFilter {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  status: 'all' | 'pending' | 'validated' | 'canceled';
  searchQuery: string;
}

const JournalEntryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const { orientation } = useOrientation();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'validated' | 'canceled'>('all');
  const [showDatePicker, setShowDatePicker] = useState<null | 'start' | 'end'>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  
  // États pour le tri
  const [sortField, setSortField] = useState<'date' | 'reference' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // Afficher les plus récents d'abord

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await AccountingService.getTransactions(
        dateRange.startDate, // Pass Date object directly
        dateRange.endDate,   // Pass Date object directly
        selectedStatus === 'all' ? undefined : selectedStatus,
      );

      let fetchedTransactions = response.map(transaction => ({
        ...transaction,
        // No conversion needed here as Transaction interface expects string dates
      }));

      // Appliquer la recherche si nécessaire
      if (searchQuery) {
        fetchedTransactions = fetchedTransactions.filter(
          transaction => 
            transaction.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
            transaction.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Trier les transactions
      const sortedTransactions = [...fetchedTransactions].sort((a, b) => {
        if (sortField === 'date') {
          // Ensure we're working with proper date values by converting string dates to Date objects
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }
        
        if (sortField === 'reference') {
          return sortDirection === 'asc' 
            ? a.reference.localeCompare(b.reference)
            : b.reference.localeCompare(a.reference);
        }
        
        if (sortField === 'amount') {
          const amountA = a.entries.reduce((sum, entry) => sum + entry.debit, 0);
          const amountB = b.entries.reduce((sum, entry) => sum + entry.debit, 0);
          return sortDirection === 'asc' ? amountA - amountB : amountB - amountA;
        }
        
        return 0;
      });
      
      setTransactions(sortedTransactions);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
      Alert.alert(
        'Erreur de chargement',
        'Impossible de récupérer les transactions. Veuillez réessayer plus tard.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange, selectedStatus, searchQuery, sortField, sortDirection]);
  
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };
  
  const handleFilterChange = () => {
    setFilterVisible(false);
    loadTransactions();
  };
  
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
  const handleChangeSortField = (field: 'date' | 'reference' | 'amount') => {
    if (sortField === field) {
      toggleSortDirection();
    } else {
      setSortField(field);
      setSortDirection('desc'); // Par défaut, on commence par ordre descendant
    }
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      if (showDatePicker === 'start') {
        setDateRange(prev => ({ ...prev, startDate: selectedDate }));
      } else {
        setDateRange(prev => ({ ...prev, endDate: selectedDate }));
      }
    }
    setShowDatePicker(null);
  };
  
  const handleLongPressTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowActionDialog(true);
  };
  
  const handleValidateTransaction = async () => {
    if (!selectedTransaction) return;
    
    try {
      setProcessingAction(true);
      await AccountingService.validateTransaction(selectedTransaction.id);
      Alert.alert('Succès', 'La transaction a été validée avec succès');
      navigation.goBack();
    } catch (error) {
      console.error('Erreur de validation:', error);
      Alert.alert('Erreur', 'Impossible de valider cette transaction');
    } finally {
      setProcessingAction(false);
      setSelectedTransaction(null);
    }
  };
  
  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;
    
    try {
      setProcessingAction(true);
      await AccountingService.deleteTransaction(selectedTransaction.id);
      Alert.alert('Succès', 'La transaction a été supprimée avec succès');
      navigation.goBack();
    } catch (error) {
      console.error('Erreur de suppression:', error);
      Alert.alert('Erreur', 'Impossible de supprimer cette transaction');
    } finally {
      setProcessingAction(false);
      setSelectedTransaction(null);
    }
  };
  
  const handleExportJournal = () => {
    Alert.alert(
      'Export du journal',
      'Voulez-vous exporter le journal avec les filtres actuels?',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Exporter',
          onPress: () => {
            // Utiliser les filtres actuels pour l'export
            const currentFilter: JournalFilter = {
              dateRange,
              status: selectedStatus,
              searchQuery
            };
            
            // Appel à la fonction d'export (à implémenter dans AccountingService)
            Alert.alert(
              'Export en cours',
              'La fonctionnalité d\'export sera disponible dans une prochaine mise à jour.'
            );
          }
        }
      ]
    );
  };
  
  const renderItem = ({ item }: { item: Transaction }) => {
    // Total des débits (qui est égal au total des crédits si l'écriture est équilibrée)
    const totalDebit = item.entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = item.entries.reduce((sum, entry) => sum + entry.credit, 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01; // Tolérance pour les erreurs d'arrondi
    
    return (
      <TouchableOpacity 
        style={styles.transactionCard}
        onPress={() => {
          console.log(`Navigating to TransactionDetails with ID: ${item.id}`);
          navigation.navigate('TransactionDetails', { transactionId: item.id });
        }}
        onLongPress={() => handleLongPressTransaction(item)}
      >
        <View style={styles.cardHeader}>
          <View>
            <View style={styles.referenceContainer}>
              <Text style={styles.reference}>{item.reference}</Text>
              {!isBalanced && (
                <MaterialIcons name="error-outline" size={16} color={Colors.error} style={styles.errorIcon} />
              )}
            </View>
            <Text style={styles.date}>{formatDate(item.date)}</Text>
          </View>
          <View>
            <Chip 
              label={
                item.status === 'validated' ? 'Validée' : 
                item.status === 'pending' ? 'En attente' : 'Annulée'
              } 
              color={
                item.status === 'validated' ? Colors.success :
                item.status === 'pending' ? Colors.warning : Colors.error
              } 
              textColor="#fff"
              size="small"
            />
          </View>
        </View>
        
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
        
        <Divider style={styles.divider} />
        
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.accountNumberCol]}>Compte</Text>
          <Text style={[styles.headerCell, styles.accountNameCol]}>Intitulé</Text>
          <Text style={[styles.headerCell, styles.amountCol]}>Débit</Text>
          <Text style={[styles.headerCell, styles.amountCol]}>Crédit</Text>
        </View>
        
        <View style={styles.entriesContainer}>
          <FlatList
            data={item.entries.slice(0, 2)} // Limiter à 2 écritures pour la prévisualisation
            keyExtractor={(entry, index) => `${item.id}-entry-${index}`}
            scrollEnabled={false}
            renderItem={({ item: entry }) => (
              <View style={styles.entryRow}>
                <Text style={[styles.entryText, styles.accountNumberCol]}>
                  {entry.accountNumber}
                </Text>
                <Text style={[styles.entryText, styles.accountNameCol]} numberOfLines={1}>
                  {entry.accountName}
                </Text>
                <Text style={[styles.entryText, styles.amountCol, styles.amountColRight]}>
                  {entry.debit > 0 ? formatAmount(entry.debit) : ''}
                </Text>
                <Text style={[styles.entryText, styles.amountCol, styles.amountColRight]}>
                  {entry.credit > 0 ? formatAmount(entry.credit) : ''}
                </Text>
              </View>
            )}
          />
          
          {item.entries.length > 2 && (
            <View style={styles.moreEntriesContainer}>
              <Text style={styles.moreEntries}>
                +{item.entries.length - 2} écritures supplémentaires
              </Text>
            </View>
          )}
        </View>
        
        <Divider style={styles.totalDivider} />
        
        <View style={styles.totalContainer}>
          <Text style={[styles.totalText, styles.accountNumberCol]}></Text>
          <Text style={[styles.totalText, styles.accountNameCol]}>TOTAL</Text>
          <Text style={[styles.totalText, styles.amountCol, styles.amountColRight]}>
            {formatAmount(totalDebit)}
          </Text>
          <Text style={[styles.totalText, styles.amountCol, styles.amountColRight]}>
            {formatAmount(totalCredit)}
          </Text>
        </View>
        
        {!isBalanced && (
          <View style={styles.warningContainer}>
            <MaterialIcons name="error-outline" size={14} color={Colors.error} />
            <Text style={styles.warningText}>Écriture déséquilibrée</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderRightComponent = () => (
    <View style={styles.headerActions}>
      <TouchableOpacity 
        style={styles.filterButton}
        onPress={() => setFilterVisible(!filterVisible)}
      >
        <Ionicons name="filter" size={24} color={Colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.exportButton}
        onPress={handleExportJournal}
      >
        <MaterialCommunityIcons name="export" size={24} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
  
  const renderSortBar = () => (
    <View style={styles.sortBarContainer}>
      <TouchableOpacity 
        style={[styles.sortButton, sortField === 'date' && styles.activeSortButton]}
        onPress={() => handleChangeSortField('date')}
      >
        <Text style={[
          styles.sortButtonText, 
          sortField === 'date' && styles.activeSortButtonText
        ]}>
          Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.sortButton, sortField === 'reference' && styles.activeSortButton]}
        onPress={() => handleChangeSortField('reference')}
      >
        <Text style={[
          styles.sortButtonText, 
          sortField === 'reference' && styles.activeSortButtonText
        ]}>
          Référence {sortField === 'reference' && (sortDirection === 'asc' ? '↑' : '↓')}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.sortButton, sortField === 'amount' && styles.activeSortButton]}
        onPress={() => handleChangeSortField('amount')}
      >
        <Text style={[
          styles.sortButtonText, 
          sortField === 'amount' && styles.activeSortButtonText
        ]}>
          Montant {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderFilterSummary = () => {
    if (!filterVisible && (selectedStatus !== 'all' || searchQuery !== '')) {
      return (
        <View style={styles.filterSummaryContainer}>
          {searchQuery !== '' && (
            <Chip 
              label={`Recherche: ${searchQuery}`}
              style={{ backgroundColor: '#f0f0f0' }}
              textStyle={{ color: '#333' }}
              onPress={() => {
                setSearchQuery('');
                loadTransactions();
              }}
            />
          )}
          
          {selectedStatus !== 'all' && (
            <Chip 
              label={`Statut: ${
                selectedStatus === 'validated' ? 'Validée' : 
                selectedStatus === 'pending' ? 'En attente' : 'Annulée'
              }`}
              style={{ backgroundColor: '#f0f0f0' }}
              textStyle={{ color: '#333' }}
              onPress={() => {
                setSelectedStatus('all');
                loadTransactions();
              }}
            />
          )}
          
          <TouchableOpacity
            onPress={() => {
              setSelectedStatus('all');
              setSearchQuery('');
              loadTransactions();
            }}
          >
            <Text style={styles.clearFilterText}>Effacer tous les filtres</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };
  
  return (
    <View style={[styles.container, orientation === 'landscape' ? styles.containerLandscape : {}]}>
      <AppHeader 
        title="Journal Comptable SYSCOHADA" 
        onBack={() => navigation.goBack()}
        rightAction={renderRightComponent()}
      />
      
      {filterVisible && (
        <View style={styles.filterContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher par référence ou description..."
            onSubmitEditing={loadTransactions}
          />
          
          <View style={styles.dateFilterContainer}>
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
          
          <View style={styles.statusFilterContainer}>
            <Text style={styles.filterLabel}>Statut:</Text>
            <View style={styles.chipContainer}>
              <Chip
                label={t('pending')}
                style={{ backgroundColor: Colors.warningLight }}
                textStyle={{ color: Colors.warningDark }}
                onPress={() => setSelectedStatus('pending')}
              />
              
              <Chip
                label={t('validated')}
                style={{ backgroundColor: Colors.successLight }}
                textStyle={{ color: Colors.successDark }}
                onPress={() => setSelectedStatus('validated')}
              />
            </View>
          </View>
          
          <Button
            title="Appliquer les filtres"
            onPress={handleFilterChange}
            style={styles.applyButton}
          />
          
          {showDatePicker && (
            <DateTimePicker
              value={showDatePicker === 'start' ? dateRange.startDate : dateRange.endDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>
      )}
      
      {renderFilterSummary()}
      {renderSortBar()}
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement des écritures comptables...</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <>
              <View style={styles.emptyStateIconContainer}>
                <MaterialCommunityIcons name="book-account" size={80} color={Colors.primary} />
              </View>
              <EmptyState
                message="Aucune écriture trouvée"
                subMessage={
                  searchQuery || selectedStatus !== 'all'
                    ? "Aucune écriture comptable ne correspond aux critères sélectionnés."
                    : "Le journal comptable ne contient aucune écriture pour la période sélectionnée."
                }
                containerStyle={styles.emptyStateContainer}
              />
            </>
          }
        />
      )}
      
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => navigation.navigate('AddJournalEntry')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Dialogue d'actions sur une transaction */}
      <Portal>
        <Dialog 
          visible={showActionDialog} 
          onDismiss={() => {
            setShowActionDialog(false);
            setSelectedTransaction(null);
          }}
        >
          <Dialog.Title>Actions sur l'écriture</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              {selectedTransaction?.reference || 'Sélectionnez une action pour cette écriture:'}
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <PaperButton 
              icon="eye" 
              mode="outlined"
              onPress={() => {
                setShowActionDialog(false);
                if (selectedTransaction) {
                  navigation.navigate('TransactionDetails', { transactionId: selectedTransaction.id });
                }
              }}
              style={styles.dialogButton}
            >
              Voir détails
            </PaperButton>
            
            {selectedTransaction?.status === 'pending' && (
              <>
                <PaperButton 
                  icon="check-circle" 
                  mode="contained"
                  color={Colors.success}
                  onPress={handleValidateTransaction}
                  loading={processingAction}
                  disabled={processingAction}
                  style={styles.dialogButton}
                >
                  Valider
                </PaperButton>
                
                <PaperButton 
                  icon="delete" 
                  mode="contained"
                  color={Colors.error}
                  onPress={handleDeleteTransaction}
                  loading={processingAction}
                  disabled={processingAction}
                  style={styles.dialogButton}
                >
                  Supprimer
                </PaperButton>
              </>
            )}
            
            {selectedTransaction?.status === 'validated' && (
              <PaperButton 
                icon="file-export" 
                mode="outlined"
                color={Colors.primary}
                onPress={() => {
                  setShowActionDialog(false);
                  Alert.alert(
                    'Export',
                    'Fonctionnalité d\'export en développement'
                  );
                }}
                style={styles.dialogButton}
              >
                Exporter
              </PaperButton>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  containerLandscape: {
    flexDirection: 'row',
  },
  headerActions: {
    flexDirection: 'row',
  },
  filterButton: {
    padding: 10,
  },
  exportButton: {
    padding: 10,
  },
  filterContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterSummaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  clearFilterText: {
    color: Colors.primary,
    marginLeft: 10,
    textDecorationLine: 'underline',
  },
  sortBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  activeSortButton: {
    backgroundColor: Colors.primary,
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
  },
  activeSortButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    flex: 0.48,
  },
  dateButtonLabel: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  statusFilterContainer: {
    marginVertical: 10,
  },
  filterLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusChip: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedChip: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    color: '#333',
  },
  selectedChipText: {
    color: '#fff',
  },
  applyButton: {
    marginTop: 10,
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
    paddingBottom: 80, // Pour éviter que le FAB ne cache les éléments
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reference: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorIcon: {
    marginLeft: 5,
  },
  date: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  description: {
    color: '#333',
    marginBottom: 10,
  },
  divider: {
    marginVertical: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerCell: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  entriesContainer: {
    marginBottom: 10,
  },
  entryRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  entryText: {
    fontSize: 13,
    color: '#333',
  },
  accountNumberCol: {
    width: '20%',
  },
  accountNameCol: {
    width: '40%',
  },
  amountCol: {
    width: '20%',
  },
  amountColRight: {
    textAlign: 'right',
  },
  moreEntriesContainer: {
    alignItems: 'center',
    paddingVertical: 5,
  },
  moreEntries: {
    fontSize: 12,
    color: Colors.primary,
  },
  totalDivider: {
    marginVertical: 5,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  totalContainer: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  totalText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  warningText: {
    color: Colors.error,
    fontSize: 12,
    marginLeft: 5,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fab: {
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  emptyStateContainer: {
    marginTop: 20,
  },
  emptyStateIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  dialogActions: {
    flexDirection: 'column',
    padding: 15,
  },
  dialogButton: {
    marginBottom: 8,
  },
});

export default JournalEntryScreen;
