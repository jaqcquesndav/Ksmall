import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Card, Text, Title, Divider, Button, Dialog, Portal, Paragraph } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import AppHeader from '../../components/common/AppHeader';
import AccountingService from '../../services/AccountingService';
import { Colors } from '../../constants/Colors';
import { formatCurrency } from '../../utils/formatters';

type RouteParams = {
  TransactionDetails: {
    transactionId: string;
  };
};

interface JournalEntry {
  accountNumber: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

interface Transaction {
  id: string;
  reference: string;
  date: string; // Changement du type Date à string pour correspondre à l'API
  description: string;
  status: 'pending' | 'validated' | 'canceled';
  entries: JournalEntry[];
  createdBy: string;
  createdAt: string; // Changement du type Date à string
  updatedBy?: string;
  updatedAt?: string; // Changement du type Date à string
  validatedBy?: string;
  validatedAt?: string; // Changement du type Date à string
}

const TransactionDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RouteParams, 'TransactionDetails'>>();
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  
  const transactionId = route.params?.transactionId || 'unknown';
  
  // Charger les détails de la transaction
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        const data = await AccountingService.getTransactionById(transactionId);
        setTransaction(data);
      } catch (error) {
        console.error('Erreur lors du chargement de la transaction:', error);
        Alert.alert(
          'Erreur',
          'Impossible de charger les détails de la transaction.'
        );
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransaction();
  }, [transactionId]);
  
  // Calcul des totaux
  const totalDebit = transaction?.entries.reduce((sum, entry) => sum + entry.debit, 0) || 0;
  const totalCredit = transaction?.entries.reduce((sum, entry) => sum + entry.credit, 0) || 0;
  const isBalanced = totalDebit === totalCredit;
  
  // Formatage de la date
  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
  };
  
  // Gestion des actions sur la transaction
  const handleValidateTransaction = async () => {
    try {
      setProcessingAction(true);
      await AccountingService.validateTransaction(transactionId);
      // Recharger la transaction après validation
      const updatedTransaction = await AccountingService.getTransactionById(transactionId);
      setTransaction(updatedTransaction);
      setShowValidateDialog(false);
      Alert.alert('Succès', 'La transaction a été validée avec succès.');
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      Alert.alert('Erreur', 'Impossible de valider la transaction.');
    } finally {
      setProcessingAction(false);
    }
  };
  
  const handleDeleteTransaction = async () => {
    try {
      setProcessingAction(true);
      await AccountingService.deleteTransaction(transactionId);
      setShowDeleteDialog(false);
      Alert.alert('Succès', 'La transaction a été supprimée avec succès.');
      navigation.goBack();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      Alert.alert('Erreur', 'Impossible de supprimer la transaction.');
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Rendu des options d'action selon le statut
  const renderActions = () => {
    if (!transaction) return null;
    
    return (
      <View style={styles.actionsContainer}>
        {transaction.status === 'pending' && (
          <>
            <Button 
              mode="contained" 
              style={styles.validateButton}
              icon={({size, color}) => (
                <MaterialIcons name="check-circle" size={size} color={color} />
              )}
              onPress={() => setShowValidateDialog(true)}
              disabled={!isBalanced}
            >
              Valider
            </Button>
            
            <Button 
              mode="outlined" 
              style={styles.deleteButton}
              icon={({size, color}) => (
                <MaterialIcons name="delete" size={size} color={color} />
              )}
              onPress={() => setShowDeleteDialog(true)}
              color={Colors.error}
              labelStyle={{ color: Colors.error }}
            >
              Supprimer
            </Button>
          </>
        )}
        
        {transaction.status === 'validated' && (
          <Button 
            mode="outlined" 
            style={styles.exportButton}
            icon={({size, color}) => (
              <MaterialCommunityIcons name="file-export" size={size} color={color} />
            )}
            onPress={() => Alert.alert('Export', 'Fonctionnalité d\'export en développement')}
          >
            Exporter
          </Button>
        )}
      </View>
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AppHeader 
          title={t('transaction_details')}
          onBack={() => navigation.goBack()}
        />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement des détails...</Text>
      </View>
    );
  }
  
  if (!transaction) {
    return (
      <View style={styles.container}>
        <AppHeader 
          title={t('transaction_details')}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={Colors.error} />
          <Text style={styles.errorText}>Transaction introuvable</Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.goBack()}
            style={styles.returnButton}
          >
            Retour
          </Button>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <AppHeader 
        title="Détail de l'Écriture"
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content}>
        {/* En-tête avec statut et référence */}
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            <View>
              <Title style={styles.reference}>{transaction.reference}</Title>
              <Text style={styles.date}>{formatDate(transaction.date)}</Text>
            </View>
            <View style={[
              styles.statusBadge, 
              transaction.status === 'validated' ? styles.statusValidated : 
              transaction.status === 'pending' ? styles.statusPending : styles.statusCanceled
            ]}>
              <Text style={styles.statusText}>
                {transaction.status === 'validated' ? 'Validée' :
                 transaction.status === 'pending' ? 'En attente' : 'Annulée'}
              </Text>
            </View>
          </Card.Content>
        </Card>
        
        {/* Détails généraux */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Informations générales</Title>
            <Divider style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Référence:</Text>
              <Text style={styles.infoValue}>{transaction.reference}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={styles.infoValue}>{formatDate(transaction.date)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Statut:</Text>
              <Text style={[
                styles.infoValue, 
                transaction.status === 'validated' ? styles.textValidated : 
                transaction.status === 'pending' ? styles.textPending : styles.textCanceled
              ]}>
                {transaction.status === 'validated' ? 'Validée' :
                 transaction.status === 'pending' ? 'En attente' : 'Annulée'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Montant:</Text>
              <Text style={styles.infoValue}>{formatCurrency(totalDebit)}</Text>
            </View>
            
            <View style={styles.descriptionContainer}>
              <Text style={styles.infoLabel}>Description:</Text>
              <Text style={styles.descriptionText}>{transaction.description}</Text>
            </View>
          </Card.Content>
        </Card>
        
        {/* Détails des écritures */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Détails des écritures</Title>
            <Divider style={styles.divider} />
            
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.accountNumberCell]}>Compte</Text>
              <Text style={[styles.tableHeaderCell, styles.accountNameCell]}>Intitulé</Text>
              <Text style={[styles.tableHeaderCell, styles.amountCell]}>Débit</Text>
              <Text style={[styles.tableHeaderCell, styles.amountCell]}>Crédit</Text>
            </View>
            
            {transaction.entries.map((entry, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.accountNumberCell]}>{entry.accountNumber}</Text>
                <Text style={[styles.tableCell, styles.accountNameCell]} numberOfLines={2}>
                  {entry.accountName}
                </Text>
                <Text style={[styles.tableCell, styles.amountCell]}>
                  {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                </Text>
                <Text style={[styles.tableCell, styles.amountCell]}>
                  {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                </Text>
              </View>
            ))}
            
            <Divider style={styles.totalDivider} />
            
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.accountNumberCell, styles.totalRow]}>
                {' \u00A0 '}
              </Text>
              <Text style={[styles.tableCell, styles.accountNameCell, styles.totalRow]}>Total</Text>
              <Text style={[styles.tableCell, styles.amountCell, styles.totalRow]}>
                {formatCurrency(totalDebit)}
              </Text>
              <Text style={[styles.tableCell, styles.amountCell, styles.totalRow]}>
                {formatCurrency(totalCredit)}
              </Text>
            </View>
            
            {!isBalanced && (
              <View style={styles.errorMessageContainer}>
                <MaterialIcons name="error-outline" size={16} color={Colors.error} />
                <Text style={styles.errorMessageText}>
                  L'écriture n'est pas équilibrée. Le total du débit doit être égal au total du crédit.
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
        
        {/* Information de création/validation */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Audit</Title>
            <Divider style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Créé par:</Text>
              <Text style={styles.infoValue}>{transaction.createdBy}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Créé le:</Text>
              <Text style={styles.infoValue}>
                {formatDate(transaction.createdAt)}
              </Text>
            </View>
            
            {transaction.updatedBy && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Modifié par:</Text>
                <Text style={styles.infoValue}>{transaction.updatedBy}</Text>
              </View>
            )}
            
            {transaction.updatedAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Modifié le:</Text>
                <Text style={styles.infoValue}>
                  {formatDate(transaction.updatedAt)}
                </Text>
              </View>
            )}
            
            {transaction.validatedBy && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Validé par:</Text>
                <Text style={styles.infoValue}>{transaction.validatedBy}</Text>
              </View>
            )}
            
            {transaction.validatedAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Validé le:</Text>
                <Text style={styles.infoValue}>
                  {formatDate(transaction.validatedAt)}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
        
        {/* Actions */}
        {renderActions()}
      </ScrollView>
      
      {/* Dialogue de confirmation de validation */}
      <Portal>
        <Dialog visible={showValidateDialog} onDismiss={() => setShowValidateDialog(false)}>
          <Dialog.Title>Valider la transaction</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Êtes-vous sûr de vouloir valider cette transaction ? 
              Cette action est irréversible.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowValidateDialog(false)}>Annuler</Button>
            <Button 
              onPress={handleValidateTransaction} 
              loading={processingAction}
              disabled={processingAction}
            >
              Valider
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Dialogue de confirmation de suppression */}
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Supprimer la transaction</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Êtes-vous sûr de vouloir supprimer cette transaction ? 
              Cette action est irréversible.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Annuler</Button>
            <Button 
              onPress={handleDeleteTransaction} 
              loading={processingAction}
              disabled={processingAction}
              color={Colors.error}
            >
              Supprimer
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginVertical: 16,
  },
  returnButton: {
    marginTop: 16,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reference: {
    fontSize: 18,
  },
  date: {
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusValidated: {
    backgroundColor: '#e6f7ed', // Light green
  },
  statusPending: {
    backgroundColor: '#fff7e6', // Light yellow
  },
  statusCanceled: {
    backgroundColor: '#ffe6e6', // Light red
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  textValidated: {
    color: '#00a651', // Green
  },
  textPending: {
    color: '#f39c12', // Amber
  },
  textCanceled: {
    color: '#e74c3c', // Red
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#666',
    flex: 1,
  },
  infoValue: {
    flex: 2,
    textAlign: 'right',
  },
  descriptionContainer: {
    paddingVertical: 8,
  },
  descriptionText: {
    marginTop: 8,
    color: '#333',
    lineHeight: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#666',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableCell: {
    fontSize: 14,
  },
  accountNumberCell: {
    width: '20%',
  },
  accountNameCell: {
    width: '40%',
  },
  amountCell: {
    width: '20%',
    textAlign: 'right',
  },
  totalDivider: {
    marginVertical: 8,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  totalRow: {
    fontWeight: 'bold',
  },
  errorMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe6e6',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  errorMessageText: {
    color: Colors.error,
    fontSize: 12,
    marginLeft: 8,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  validateButton: {
    marginBottom: 8,
    backgroundColor: Colors.success,
  },
  deleteButton: {
    borderColor: Colors.error,
  },
  exportButton: {
    borderColor: Colors.primary,
  },
});

export default TransactionDetailsScreen;
