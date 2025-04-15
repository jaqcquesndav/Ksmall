import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Button, Card, FAB, ActivityIndicator, Dialog, Portal, TextInput, Switch, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

import AppHeader from '../../components/common/AppHeader';
import EmptyState from '../../components/common/EmptyState';
import { Colors } from '../../constants/Colors';
import DatabaseService from '../../services/DatabaseService';
import logger from '../../utils/logger';

// Interface pour une taxe
interface Tax {
  id: string;
  name: string;
  code: string;
  rate: number;
  isDefault: boolean;
  isActive: boolean;
  accountingAccountCode?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

const TaxSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  
  // États
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedTaxId, setSelectedTaxId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  // États des champs du formulaire
  const [taxName, setTaxName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [taxDescription, setTaxDescription] = useState('');
  const [accountingCode, setAccountingCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  // Charger les taxes au démarrage
  useEffect(() => {
    loadTaxes();
  }, []);
  
  // Fonction pour charger les taxes
  const loadTaxes = async () => {
    try {
      setLoading(true);
      
      // Initialiser la table si elle n'existe pas
      await initTaxesTable();
      
      // Charger les taxes
      const db = await DatabaseService.getDBConnection();
      const [result] = await DatabaseService.executeQuery(
        db,
        'SELECT * FROM tax_rates ORDER BY is_default DESC, rate ASC',
        []
      );
      
      if (result && result.rows && result.rows._array) {
        setTaxes(result.rows._array.map(row => ({
          ...row,
          isDefault: row.is_default === 1,
          isActive: row.is_active === 1
        })));
      } else {
        setTaxes([]);
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des taxes:', error);
      Alert.alert(
        'Erreur', 
        'Impossible de charger les taxes. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour initialiser la table des taxes
  const initTaxesTable = async () => {
    try {
      const db = await DatabaseService.getDBConnection();
      
      // Créer la table tax_rates si elle n'existe pas
      await DatabaseService.executeQuery(
        db,
        `CREATE TABLE IF NOT EXISTS tax_rates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          code TEXT NOT NULL,
          rate REAL NOT NULL,
          is_default INTEGER NOT NULL DEFAULT 0,
          is_active INTEGER NOT NULL DEFAULT 1,
          accounting_account_code TEXT,
          description TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`,
        []
      );
      
      // Vérifier s'il y a déjà des taxes
      const [result] = await DatabaseService.executeQuery(
        db,
        'SELECT COUNT(*) as count FROM tax_rates',
        []
      );
      
      // Si pas de taxes, créer les taxes par défaut pour certains pays africains
      if (result && result.rows && result.rows.item(0).count === 0) {
        const now = new Date().toISOString();
        const defaultTaxes = [
          { id: 'tax-tva-18', name: 'TVA Côte d\'Ivoire', code: 'TVA-18', rate: 18, isDefault: true },
          { id: 'tax-tva-0', name: 'Exonéré TVA', code: 'TVA-0', rate: 0, isDefault: false },
          { id: 'tax-tva-reduced', name: 'TVA Taux Réduit', code: 'TVA-9', rate: 9, isDefault: false },
          { id: 'tax-tsr-5', name: 'TSR', code: 'TSR-5', rate: 5, isDefault: false }
        ];
        
        for (const tax of defaultTaxes) {
          await DatabaseService.executeQuery(
            db,
            `INSERT INTO tax_rates (id, name, code, rate, is_default, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              tax.id,
              tax.name,
              tax.code,
              tax.rate,
              tax.isDefault ? 1 : 0,
              1, // actif par défaut
              now,
              now
            ]
          );
        }
      }
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation de la table des taxes:', error);
      throw error;
    }
  };
  
  // Ouvrir le dialogue pour créer une taxe
  const showAddDialog = () => {
    setEditMode(false);
    setSelectedTaxId(null);
    setTaxName('');
    setTaxCode('');
    setTaxRate('');
    setTaxDescription('');
    setAccountingCode('');
    setIsDefault(false);
    setIsActive(true);
    setDialogVisible(true);
  };
  
  // Ouvrir le dialogue pour modifier une taxe
  const showEditDialog = (tax: Tax) => {
    setEditMode(true);
    setSelectedTaxId(tax.id);
    setTaxName(tax.name);
    setTaxCode(tax.code);
    setTaxRate(tax.rate.toString());
    setTaxDescription(tax.description || '');
    setAccountingCode(tax.accountingAccountCode || '');
    setIsDefault(tax.isDefault);
    setIsActive(tax.isActive);
    setDialogVisible(true);
  };
  
  // Confirmer la suppression d'une taxe
  const confirmDeleteTax = (id: string) => {
    setSelectedTaxId(id);
    setDeleteDialogVisible(true);
  };
  
  // Supprimer une taxe
  const handleDeleteTax = async () => {
    if (!selectedTaxId) return;
    
    try {
      const db = await DatabaseService.getDBConnection();
      
      // Vérifier si des transactions utilisent cette taxe
      const [result] = await DatabaseService.executeQuery(
        db,
        'SELECT COUNT(*) as count FROM accounting_entries WHERE tax_id = ?',
        [selectedTaxId]
      );
      
      if (result && result.rows && result.rows.item(0).count > 0) {
        Alert.alert(
          'Action impossible',
          'Cette taxe est utilisée dans des transactions. Veuillez plutôt la désactiver.'
        );
        setDeleteDialogVisible(false);
        return;
      }
      
      // Supprimer la taxe
      await DatabaseService.executeQuery(
        db,
        'DELETE FROM tax_rates WHERE id = ?',
        [selectedTaxId]
      );
      
      // Mettre à jour l'interface
      setTaxes(taxes.filter(tax => tax.id !== selectedTaxId));
      setDeleteDialogVisible(false);
      
      // Notification de succès
      Alert.alert('Succès', 'La taxe a été supprimée avec succès.');
    } catch (error) {
      logger.error('Erreur lors de la suppression de la taxe:', error);
      Alert.alert(
        'Erreur',
        'Impossible de supprimer la taxe. Veuillez réessayer.'
      );
      setDeleteDialogVisible(false);
    }
  };
  
  // Sauvegarder une taxe
  const handleSaveTax = async () => {
    // Validation des champs
    if (!taxName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour la taxe.');
      return;
    }
    
    if (!taxCode.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un code pour la taxe.');
      return;
    }
    
    const rate = parseFloat(taxRate);
    if (isNaN(rate) || rate < 0) {
      Alert.alert('Erreur', 'Veuillez entrer un taux valide (≥ 0).');
      return;
    }
    
    try {
      const db = await DatabaseService.getDBConnection();
      const now = new Date().toISOString();
      
      // Si cette taxe est définie comme par défaut, mettre à jour les autres taxes
      if (isDefault) {
        await DatabaseService.executeQuery(
          db,
          'UPDATE tax_rates SET is_default = 0',
          []
        );
      }
      
      if (editMode && selectedTaxId) {
        // Mettre à jour une taxe existante
        await DatabaseService.executeQuery(
          db,
          `UPDATE tax_rates 
           SET name = ?, code = ?, rate = ?, is_default = ?, is_active = ?, 
               accounting_account_code = ?, description = ?, updated_at = ?
           WHERE id = ?`,
          [
            taxName,
            taxCode,
            rate,
            isDefault ? 1 : 0,
            isActive ? 1 : 0,
            accountingCode,
            taxDescription,
            now,
            selectedTaxId
          ]
        );
      } else {
        // Créer une nouvelle taxe
        const id = `tax-${Date.now()}`;
        
        await DatabaseService.executeQuery(
          db,
          `INSERT INTO tax_rates (id, name, code, rate, is_default, is_active,
                                accounting_account_code, description, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            taxName,
            taxCode,
            rate,
            isDefault ? 1 : 0,
            isActive ? 1 : 0,
            accountingCode,
            taxDescription,
            now,
            now
          ]
        );
      }
      
      // Recharger les taxes
      loadTaxes();
      
      // Fermer le dialogue
      setDialogVisible(false);
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde de la taxe:', error);
      Alert.alert(
        'Erreur',
        'Impossible de sauvegarder la taxe. Veuillez réessayer.'
      );
    }
  };
  
  // Définir une taxe comme défaut
  const setAsDefault = async (id: string) => {
    try {
      const db = await DatabaseService.getDBConnection();
      
      // Mettre toutes les taxes à non défaut
      await DatabaseService.executeQuery(
        db,
        'UPDATE tax_rates SET is_default = 0',
        []
      );
      
      // Définir la taxe sélectionnée comme défaut
      await DatabaseService.executeQuery(
        db,
        'UPDATE tax_rates SET is_default = 1 WHERE id = ?',
        [id]
      );
      
      // Mettre à jour l'interface
      setTaxes(
        taxes.map(tax => ({
          ...tax,
          isDefault: tax.id === id
        }))
      );
      
      // Notification de succès
      Alert.alert('Succès', 'La taxe par défaut a été mise à jour.');
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de la taxe par défaut:', error);
      Alert.alert(
        'Erreur',
        'Impossible de mettre à jour la taxe par défaut. Veuillez réessayer.'
      );
    }
  };
  
  // Activer/désactiver une taxe
  const toggleActiveTax = async (tax: Tax) => {
    try {
      const db = await DatabaseService.getDBConnection();
      const newActiveState = !tax.isActive;
      
      await DatabaseService.executeQuery(
        db,
        'UPDATE tax_rates SET is_active = ? WHERE id = ?',
        [newActiveState ? 1 : 0, tax.id]
      );
      
      // Mettre à jour l'interface
      setTaxes(
        taxes.map(t => t.id === tax.id ? { ...t, isActive: newActiveState } : t)
      );
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du statut de la taxe:', error);
      Alert.alert(
        'Erreur',
        'Impossible de mettre à jour le statut de la taxe. Veuillez réessayer.'
      );
    }
  };
  
  // Rendu d'un élément dans la liste des taxes
  const renderTaxItem = ({ item: tax }: { item: Tax }) => {
    return (
      <Card 
        style={[styles.taxCard, !tax.isActive && styles.inactiveTax]}
        onPress={() => showEditDialog(tax)}
      >
        <Card.Content>
          <View style={styles.taxHeader}>
            <View style={styles.taxInfo}>
              <Text style={styles.taxName}>{tax.name}</Text>
              <View style={styles.taxCodeContainer}>
                <Text style={styles.taxCode}>{tax.code}</Text>
                {tax.isDefault && (
                  <Text style={styles.defaultBadge}>Par défaut</Text>
                )}
              </View>
            </View>
            <Text style={styles.taxRate}>{tax.rate}%</Text>
          </View>
          
          {tax.description && (
            <Text style={styles.taxDescription}>{tax.description}</Text>
          )}
          
          <View style={styles.taxActions}>
            <Button
              compact
              mode="text"
              onPress={() => showEditDialog(tax)}
              style={styles.actionButton}
            >
              Modifier
            </Button>
            
            {!tax.isDefault && (
              <Button
                compact
                mode="text"
                onPress={() => setAsDefault(tax.id)}
                style={styles.actionButton}
              >
                Définir comme défaut
              </Button>
            )}
            
            <Button
              compact
              mode="text"
              onPress={() => toggleActiveTax(tax)}
              style={styles.actionButton}
            >
              {tax.isActive ? 'Désactiver' : 'Activer'}
            </Button>
            
            {!tax.isDefault && (
              <Button
                compact
                mode="text"
                onPress={() => confirmDeleteTax(tax.id)}
                textColor="#ff6b6b"
                style={styles.actionButton}
              >
                Supprimer
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  return (
    <View style={styles.container}>
      <AppHeader
        title="Configuration des taxes"
        onBack={() => navigation.goBack()}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement des taxes...</Text>
        </View>
      ) : (
        <>
          {taxes.length > 0 ? (
            <FlatList
              data={taxes}
              renderItem={renderTaxItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                <View style={styles.headerContainer}>
                  <Text style={styles.headerText}>
                    Configurez les taux de TVA et autres taxes applicables à vos transactions.
                  </Text>
                </View>
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <EmptyState
                message="Aucune taxe configurée"
                subMessage="Ajoutez votre première taxe pour commencer."
              />
            </View>
          )}
          
          <FAB
            style={styles.fab}
            icon="plus"
            label="Ajouter une taxe"
            onPress={showAddDialog}
          />
        </>
      )}
      
      {/* Dialogue pour ajouter/modifier une taxe */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>
            {editMode ? 'Modifier la taxe' : 'Ajouter une taxe'}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nom de la taxe"
              value={taxName}
              onChangeText={setTaxName}
              style={styles.dialogInput}
            />
            
            <TextInput
              label="Code (ex: TVA-18)"
              value={taxCode}
              onChangeText={setTaxCode}
              style={styles.dialogInput}
            />
            
            <TextInput
              label="Taux (%)"
              value={taxRate}
              onChangeText={setTaxRate}
              style={styles.dialogInput}
              keyboardType="numeric"
            />
            
            <TextInput
              label="Code compte comptable associé (optionnel)"
              value={accountingCode}
              onChangeText={setAccountingCode}
              style={styles.dialogInput}
            />
            
            <TextInput
              label="Description (optionnelle)"
              value={taxDescription}
              onChangeText={setTaxDescription}
              style={styles.dialogInput}
              multiline
              numberOfLines={2}
            />
            
            <View style={styles.switchRow}>
              <Text>Définir comme taxe par défaut</Text>
              <Switch
                value={isDefault}
                onValueChange={setIsDefault}
              />
            </View>
            
            <View style={styles.switchRow}>
              <Text>Taxe active</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Annuler</Button>
            <Button onPress={handleSaveTax}>Enregistrer</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Dialogue de confirmation pour la suppression */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Confirmation de suppression</Dialog.Title>
          <Dialog.Content>
            <Text>
              Êtes-vous sûr de vouloir supprimer cette taxe ? Cette action est irréversible.
              {'\n\n'}
              Note: Si cette taxe a déjà été utilisée dans des transactions, vous devriez plutôt la désactiver.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Annuler</Button>
            <Button onPress={handleDeleteTax} textColor="#ff6b6b">Supprimer</Button>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  listContent: {
    padding: 10,
    paddingBottom: 80, // Espace pour le FAB
  },
  taxCard: {
    marginBottom: 10,
    elevation: 2,
  },
  inactiveTax: {
    opacity: 0.6,
  },
  taxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taxInfo: {
    flex: 1,
  },
  taxName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  taxCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  taxCode: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  defaultBadge: {
    fontSize: 12,
    backgroundColor: Colors.primary,
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  taxRate: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  taxDescription: {
    fontSize: 14,
    color: '#666',
    marginVertical: 8,
    fontStyle: 'italic',
  },
  taxActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  actionButton: {
    marginRight: 10,
    marginBottom: 5,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
});

export default TaxSettingsScreen;