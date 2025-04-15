import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Card, Searchbar, FAB, ActivityIndicator, Dialog, Portal, TextInput, Divider, IconButton, Chip, Menu } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import AppHeader from '../../components/common/AppHeader';
import EmptyState from '../../components/common/EmptyState';
import { Colors } from '../../constants/Colors';
import DatabaseService from '../../services/DatabaseService';
import logger from '../../utils/logger';
import { formatCurrency } from '../../utils/formatters';

// Interface pour un compte du plan comptable
interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | 'other';
  balance: number;
  isActive: boolean;
  parent?: string;
  level: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Types de comptes pour le filtre
const ACCOUNT_TYPES = [
  { label: 'Actif', value: 'asset', color: '#4CAF50' },
  { label: 'Passif', value: 'liability', color: '#F44336' },
  { label: 'Capitaux', value: 'equity', color: '#9C27B0' },
  { label: 'Produit', value: 'revenue', color: '#2196F3' },
  { label: 'Charge', value: 'expense', color: '#FF9800' },
  { label: 'Autre', value: 'other', color: '#607D8B' }
];

const ChartOfAccountsScreen: React.FC = () => {
  const navigation = useNavigation();
  
  // États
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  // États des champs du formulaire
  const [accountCode, setAccountCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | 'other'>('asset');
  const [accountDescription, setAccountDescription] = useState('');
  const [accountParent, setAccountParent] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  
  // Menu de sélection du type de compte
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  
  // Menu de sélection du compte parent
  const [parentMenuVisible, setParentMenuVisible] = useState(false);
  
  // Filtres
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  
  // Charger les comptes au démarrage
  useEffect(() => {
    loadAccounts();
  }, []);
  
  // Filtrer les comptes lorsque la recherche ou les filtres changent
  useEffect(() => {
    filterAccounts();
  }, [searchQuery, selectedTypes, showInactive, accounts]);
  
  // Fonction pour charger les comptes
  const loadAccounts = async () => {
    try {
      setLoading(true);
      
      // Utiliser DatabaseService pour obtenir les comptes du plan comptable
      const db = await DatabaseService.getDBConnection();
      const [result] = await DatabaseService.executeQuery(
        db,
        `SELECT * FROM accounting_accounts ORDER BY code`,
        []
      );
      
      if (result && result.rows && result.rows._array) {
        setAccounts(result.rows._array.map(row => ({
          ...row,
          isActive: row.is_active === 1,
          level: calculateLevel(row.code)
        })));
      } else {
        // Si pas de comptes, charger les comptes par défaut
        await initializeDefaultAccounts();
        await loadAccounts(); // Recharger après initialisation
        return;
      }
    } catch (error) {
      logger.error('Erreur lors du chargement du plan comptable:', error);
      Alert.alert(
        'Erreur',
        'Impossible de charger le plan comptable. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Calcule le niveau hiérarchique basé sur le code du compte
  const calculateLevel = (code: string): number => {
    // Par exemple pour SYSCOHADA: 2 chiffres = classe, 4 chiffres = compte, 8 chiffres = sous-compte
    if (code.length <= 2) return 1;
    if (code.length <= 4) return 2;
    return 3;
  };
  
  // Initialiser les comptes par défaut (SYSCOHADA)
  const initializeDefaultAccounts = async () => {
    try {
      const db = await DatabaseService.getDBConnection();
      
      // Création de comptes de base selon le plan comptable SYSCOHADA
      const defaultAccounts = [
        // Classes
        { code: '1', name: 'Comptes de ressources durables', type: 'equity', parent: null },
        { code: '2', name: 'Comptes d\'actifs immobilisés', type: 'asset', parent: null },
        { code: '3', name: 'Comptes de stocks', type: 'asset', parent: null },
        { code: '4', name: 'Comptes de tiers', type: 'other', parent: null },
        { code: '5', name: 'Comptes de trésorerie', type: 'asset', parent: null },
        { code: '6', name: 'Comptes de charges', type: 'expense', parent: null },
        { code: '7', name: 'Comptes de produits', type: 'revenue', parent: null },
        
        // Quelques comptes de base (premiers niveaux)
        { code: '10', name: 'Capital', type: 'equity', parent: '1' },
        { code: '11', name: 'Réserves', type: 'equity', parent: '1' },
        { code: '12', name: 'Report à nouveau', type: 'equity', parent: '1' },
        { code: '41', name: 'Clients', type: 'asset', parent: '4' },
        { code: '40', name: 'Fournisseurs', type: 'liability', parent: '4' },
        { code: '52', name: 'Banques', type: 'asset', parent: '5' },
        { code: '57', name: 'Caisse', type: 'asset', parent: '5' },
        { code: '60', name: 'Achats', type: 'expense', parent: '6' },
        { code: '70', name: 'Ventes', type: 'revenue', parent: '7' },
        
        // Quelques sous-comptes
        { code: '52000000', name: 'Banque XYZ', type: 'asset', parent: '52' },
        { code: '57000000', name: 'Caisse principale', type: 'asset', parent: '57' },
        { code: '41000000', name: 'Clients généraux', type: 'asset', parent: '41' },
        { code: '40000000', name: 'Fournisseurs généraux', type: 'liability', parent: '40' },
      ];
      
      for (const account of defaultAccounts) {
        await DatabaseService.executeQuery(
          db,
          `INSERT INTO accounting_accounts (id, code, name, type, balance, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `account-${account.code}`,
            account.code,
            account.name,
            account.type,
            0,
            1,
            new Date().toISOString(),
            new Date().toISOString()
          ]
        );
      }
      
      logger.info('Comptes par défaut initialisés avec succès');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation des comptes par défaut:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'initialiser les comptes par défaut. Veuillez réessayer.'
      );
    }
  };
  
  // Filtrer les comptes selon la recherche et les filtres
  const filterAccounts = () => {
    let filtered = [...accounts];
    
    // Filtrer par recherche
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(account => 
        account.code.toLowerCase().includes(query) || 
        account.name.toLowerCase().includes(query)
      );
    }
    
    // Filtrer par type de compte
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(account => 
        selectedTypes.includes(account.type)
      );
    }
    
    // Filtrer les comptes inactifs
    if (!showInactive) {
      filtered = filtered.filter(account => account.isActive);
    }
    
    setFilteredAccounts(filtered);
  };
  
  // Ouvrir le dialogue pour créer un compte
  const showAddDialog = () => {
    setEditMode(false);
    setSelectedAccountId(null);
    setAccountCode('');
    setAccountName('');
    setAccountType('asset');
    setAccountDescription('');
    setAccountParent(null);
    setIsActive(true);
    setDialogVisible(true);
  };
  
  // Ouvrir le dialogue pour modifier un compte
  const showEditDialog = (account: Account) => {
    setEditMode(true);
    setSelectedAccountId(account.id);
    setAccountCode(account.code);
    setAccountName(account.name);
    setAccountType(account.type);
    setAccountDescription(account.description || '');
    setAccountParent(account.parent || null);
    setIsActive(account.isActive);
    setDialogVisible(true);
  };
  
  // Confirmer la suppression d'un compte
  const confirmDeleteAccount = (accountId: string) => {
    setSelectedAccountId(accountId);
    setDeleteDialogVisible(true);
  };
  
  // Supprimer un compte
  const handleDeleteAccount = async () => {
    if (!selectedAccountId) return;
    
    try {
      const db = await DatabaseService.getDBConnection();
      
      // Vérifier si des transactions utilisent ce compte
      const account = accounts.find(a => a.id === selectedAccountId);
      if (account) {
        const [result] = await DatabaseService.executeQuery(
          db,
          'SELECT COUNT(*) as count FROM accounting_entries WHERE account_code = ?',
          [account.code]
        );
        
        if (result && result.rows && result.rows.item(0).count > 0) {
          Alert.alert(
            'Action impossible',
            'Ce compte est utilisé dans des écritures comptables. Désactivez-le plutôt que de le supprimer.'
          );
          setDeleteDialogVisible(false);
          return;
        }
      }
      
      // Supprimer le compte
      await DatabaseService.executeQuery(
        db,
        'DELETE FROM accounting_accounts WHERE id = ?',
        [selectedAccountId]
      );
      
      // Mettre à jour l'interface
      setAccounts(accounts.filter(account => account.id !== selectedAccountId));
      setDeleteDialogVisible(false);
      
      // Notification de succès
      Alert.alert('Succès', 'Le compte a été supprimé avec succès.');
    } catch (error) {
      logger.error('Erreur lors de la suppression du compte:', error);
      Alert.alert(
        'Erreur',
        'Impossible de supprimer le compte. Veuillez réessayer.'
      );
      setDeleteDialogVisible(false);
    }
  };
  
  // Sauvegarder un compte
  const handleSaveAccount = async () => {
    // Validation des champs
    if (!accountCode.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un code pour le compte.');
      return;
    }
    
    if (!accountName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour le compte.');
      return;
    }
    
    try {
      const db = await DatabaseService.getDBConnection();
      const now = new Date().toISOString();
      
      if (editMode && selectedAccountId) {
        // Mettre à jour un compte existant
        await DatabaseService.executeQuery(
          db,
          `UPDATE accounting_accounts 
           SET code = ?, name = ?, type = ?, description = ?, is_active = ?, updated_at = ?
           WHERE id = ?`,
          [
            accountCode,
            accountName,
            accountType,
            accountDescription,
            isActive ? 1 : 0,
            now,
            selectedAccountId
          ]
        );
      } else {
        // Créer un nouveau compte
        const id = `account-${Date.now()}`;
        
        await DatabaseService.executeQuery(
          db,
          `INSERT INTO accounting_accounts (id, code, name, type, description, balance, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            accountCode,
            accountName,
            accountType,
            accountDescription,
            0, // Solde initial à 0
            isActive ? 1 : 0,
            now,
            now
          ]
        );
      }
      
      // Recharger les comptes
      loadAccounts();
      
      // Fermer le dialogue
      setDialogVisible(false);
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde du compte:', error);
      Alert.alert(
        'Erreur',
        'Impossible de sauvegarder le compte. Veuillez réessayer.'
      );
    }
  };
  
  // Gérer la sélection d'un type de compte pour le filtre
  const toggleTypeFilter = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };
  
  // Obtenir la couleur du type de compte
  const getTypeColor = (type: string): string => {
    const found = ACCOUNT_TYPES.find(t => t.value === type);
    return found ? found.color : '#607D8B';
  };
  
  // Obtenir le libellé du type de compte
  const getTypeLabel = (type: string): string => {
    const found = ACCOUNT_TYPES.find(t => t.value === type);
    return found ? found.label : 'Autre';
  };
  
  // Rendu d'un élément de la liste des comptes
  const renderAccountItem = ({ item: account }: { item: Account }) => {
    const paddingLeft = 10 + (account.level - 1) * 20; // Indentation selon le niveau hiérarchique
    const typeColor = getTypeColor(account.type);
    
    return (
      <Card 
        style={[
          styles.accountCard, 
          !account.isActive && styles.inactiveAccount,
          { marginLeft: paddingLeft }
        ]}
        onPress={() => showEditDialog(account)}
      >
        <Card.Content style={styles.accountContent}>
          <View style={styles.accountMain}>
            <View style={styles.accountCodeContainer}>
              <Text style={styles.accountCode}>{account.code}</Text>
              {!account.isActive && (
                <Chip style={styles.inactiveChip} textStyle={{fontSize: 10}}>Inactif</Chip>
              )}
            </View>
            <Text style={styles.accountName}>{account.name}</Text>
            <Chip style={[styles.typeChip, { backgroundColor: `${typeColor}20` }]}>
              <Text style={[styles.typeText, { color: typeColor }]}>
                {getTypeLabel(account.type)}
              </Text>
            </Chip>
          </View>
          
          <View style={styles.accountActions}>
            <Text style={styles.accountBalance}>
              {formatCurrency(account.balance)}
            </Text>
            <TouchableOpacity
              onPress={() => confirmDeleteAccount(account.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  // Rendu de l'en-tête avec les filtres
  const renderHeader = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.typeFilters}>
        {ACCOUNT_TYPES.map(type => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.typeFilterButton,
              selectedTypes.includes(type.value) && { backgroundColor: `${type.color}30` }
            ]}
            onPress={() => toggleTypeFilter(type.value)}
          >
            <Text
              style={[
                styles.typeFilterText,
                selectedTypes.includes(type.value) && { color: type.color }
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity
        style={styles.showInactiveButton}
        onPress={() => setShowInactive(!showInactive)}
      >
        <Text style={styles.showInactiveText}>
          {showInactive ? 'Masquer inactifs' : 'Afficher inactifs'}
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <AppHeader
        title="Plan comptable"
        onBack={() => navigation.goBack()}
      />
      
      <Searchbar
        placeholder="Rechercher un compte..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement du plan comptable...</Text>
        </View>
      ) : (
        <>
          {filteredAccounts.length > 0 ? (
            <FlatList
              data={filteredAccounts}
              renderItem={renderAccountItem}
              keyExtractor={account => account.id}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={renderHeader}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <EmptyState
                message="Aucun compte trouvé"
                subMessage={
                  searchQuery || selectedTypes.length > 0
                    ? "Aucun compte ne correspond à votre recherche ou à vos filtres."
                    : "Ajoutez votre premier compte pour commencer."
                }
              />
            </View>
          )}
          
          <FAB
            style={styles.fab}
            icon="plus"
            label="Ajouter un compte"
            onPress={showAddDialog}
          />
        </>
      )}
      
      {/* Dialogue pour ajouter/modifier un compte */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>
            {editMode ? 'Modifier un compte' : 'Ajouter un compte'}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Code du compte"
              value={accountCode}
              onChangeText={setAccountCode}
              style={styles.dialogInput}
              disabled={editMode} // Ne pas permettre de modifier le code en mode édition
            />
            
            <TextInput
              label="Nom du compte"
              value={accountName}
              onChangeText={setAccountName}
              style={styles.dialogInput}
            />
            
            <TouchableOpacity
              style={styles.typeSelector}
              onPress={() => setTypeMenuVisible(true)}
            >
              <Text style={styles.typeSelectorLabel}>Type de compte:</Text>
              <View style={styles.typeSelectorValue}>
                <Chip
                  style={[styles.typeChip, { backgroundColor: `${getTypeColor(accountType)}20` }]}
                >
                  <Text style={[styles.typeText, { color: getTypeColor(accountType) }]}>
                    {getTypeLabel(accountType)}
                  </Text>
                </Chip>
              </View>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
            
            <Menu
              visible={typeMenuVisible}
              onDismiss={() => setTypeMenuVisible(false)}
              anchor={<View />}
              style={styles.typeMenu}
            >
              {ACCOUNT_TYPES.map(type => (
                <Menu.Item
                  key={type.value}
                  onPress={() => {
                    setAccountType(type.value as any);
                    setTypeMenuVisible(false);
                  }}
                  title={type.label}
                  leadingIcon={() => (
                    <View style={[styles.menuIconCircle, { backgroundColor: type.color }]} />
                  )}
                />
              ))}
            </Menu>
            
            <TextInput
              label="Description (optionnelle)"
              value={accountDescription}
              onChangeText={setAccountDescription}
              style={styles.dialogInput}
              multiline
              numberOfLines={2}
            />
            
            <View style={styles.switchContainer}>
              <Text>Compte actif</Text>
              <IconButton
                icon={isActive ? "checkbox-marked" : "checkbox-blank-outline"}
                size={24}
                onPress={() => setIsActive(!isActive)}
                iconColor={isActive ? Colors.primary : "#666"}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Annuler</Button>
            <Button onPress={handleSaveAccount}>Enregistrer</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Dialogue de confirmation pour la suppression */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Confirmation de suppression</Dialog.Title>
          <Dialog.Content>
            <Text>
              Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible.
              {'\n\n'}
              Note: Si ce compte a déjà été utilisé dans des transactions, vous devriez plutôt le désactiver.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Annuler</Button>
            <Button onPress={handleDeleteAccount} textColor="#ff6b6b">Supprimer</Button>
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
  searchBar: {
    margin: 10,
    elevation: 2,
  },
  filtersContainer: {
    padding: 10,
    backgroundColor: '#fff',
  },
  typeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  typeFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: '#f0f0f0',
  },
  typeFilterText: {
    fontSize: 12,
    color: '#666',
  },
  showInactiveButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  showInactiveText: {
    fontSize: 12,
    color: Colors.primary,
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
    paddingBottom: 80, // Espace pour le FAB
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountCard: {
    marginHorizontal: 10,
    marginVertical: 5,
  },
  inactiveAccount: {
    opacity: 0.6,
  },
  accountContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountMain: {
    flex: 1,
  },
  accountCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountCode: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 4,
  },
  accountActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountBalance: {
    fontWeight: '600',
    fontSize: 16,
    marginRight: 10,
  },
  deleteButton: {
    padding: 5,
  },
  inactiveChip: {
    backgroundColor: '#f0f0f0',
    height: 20,
  },
  typeChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
    height: 24,
    justifyContent: 'center',
  },
  typeText: {
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
  },
  dialogInput: {
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  typeSelectorLabel: {
    color: '#666',
    marginRight: 8,
  },
  typeSelectorValue: {
    flex: 1,
  },
  typeMenu: {
    marginTop: 40,
  },
  menuIconCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
});

export default ChartOfAccountsScreen;