import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Modal, Portal, Text, Button, RadioButton, Divider, Card, Title, Paragraph } from 'react-native-paper';
import { useTheme } from '@react-navigation/native';
import ApiService, { SYNC_EVENTS } from '../../services/api/ApiService';
import eventEmitter from '../../utils/EventEmitter';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ConflictItem {
  id: string;
  entityType: string;
  localData: any;
  serverData: any;
  createdAt: string;
}

/**
 * Composant modal pour afficher et résoudre les conflits de données
 */
const ConflictResolutionModal: React.FC = () => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<ConflictItem | null>(null);
  const [resolutionStrategy, setResolutionStrategy] = useState<'client' | 'server' | 'merge'>('server');
  const [customData, setCustomData] = useState<any>(null);
  const [isCustomEdit, setIsCustomEdit] = useState(false);
  
  useEffect(() => {
    // Écouter les événements de conflits
    const conflictListener = eventEmitter.on(SYNC_EVENTS.SYNC_CONFLICT, (conflictData: any) => {
      loadPendingConflicts();
      setVisible(true);
    });
    
    // Charger les conflits en attente au démarrage
    loadPendingConflicts();
    
    return () => {
      conflictListener();
    };
  }, []);
  
  /**
   * Charge les conflits en attente depuis le service API
   */
  const loadPendingConflicts = async () => {
    const pendingConflicts = await ApiService.getPendingConflicts();
    setConflicts(pendingConflicts);
    
    // Si des conflits sont trouvés, afficher le modal
    if (pendingConflicts.length > 0 && !visible) {
      setVisible(true);
      setSelectedConflict(pendingConflicts[0]);
      // Définir les données par défaut pour l'édition personnalisée
      setCustomData(pendingConflicts[0]?.serverData || null);
    }
  };
  
  /**
   * Sélectionne un conflit pour résolution
   */
  const handleSelectConflict = (conflict: ConflictItem) => {
    setSelectedConflict(conflict);
    setCustomData(conflict.serverData);
    setResolutionStrategy('server');
    setIsCustomEdit(false);
  };
  
  /**
   * Résout le conflit avec la stratégie sélectionnée
   */
  const handleResolveConflict = async () => {
    if (!selectedConflict) return;
    
    let resolvedData;
    
    switch (resolutionStrategy) {
      case 'client':
        resolvedData = selectedConflict.localData;
        break;
      case 'server':
        resolvedData = selectedConflict.serverData;
        break;
      case 'merge':
        resolvedData = { ...selectedConflict.serverData, ...selectedConflict.localData };
        break;
      default:
        resolvedData = customData;
    }
    
    const success = await ApiService.resolveManualConflict(selectedConflict.id, resolvedData);
    
    if (success) {
      // Rafraîchir la liste des conflits
      await loadPendingConflicts();
      
      // S'il n'y a plus de conflits, fermer le modal
      if (conflicts.length === 0) {
        setVisible(false);
        setSelectedConflict(null);
      } else {
        // Sélectionner le conflit suivant
        setSelectedConflict(conflicts[0]);
        setCustomData(conflicts[0].serverData);
        setResolutionStrategy('server');
        setIsCustomEdit(false);
      }
    }
  };

  /**
   * Format une date ISO en chaîne lisible
   */
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString();
    } catch {
      return isoString;
    }
  };
  
  /**
   * Rendu de l'aperçu des données pour un conflit
   */
  const renderDataPreview = (data: any) => {
    if (!data) return <Text>Aucune donnée</Text>;
    
    // Afficher un aperçu des données de manière plus lisible
    return (
      <Card style={styles.dataCard}>
        <Card.Content>
          {Object.entries(data).map(([key, value]) => {
            // Ne pas afficher les données trop volumineuses
            if (typeof value === 'object' && value !== null) {
              return (
                <View key={key} style={styles.dataItem}>
                  <Text style={styles.dataKey}>{key}:</Text>
                  <Text style={styles.dataValue}>{JSON.stringify(value).substring(0, 50)}...</Text>
                </View>
              );
            }
            return (
              <View key={key} style={styles.dataItem}>
                <Text style={styles.dataKey}>{key}:</Text>
                <Text style={styles.dataValue}>{String(value)}</Text>
              </View>
            );
          })}
        </Card.Content>
      </Card>
    );
  };
  
  const hideModal = () => {
    setVisible(false);
  };

  return (
    <Portal>
      <Modal 
        visible={visible} 
        onDismiss={hideModal}
        contentContainerStyle={[styles.modalContainer, {backgroundColor: theme.colors.background}]}
      >
        <Title style={styles.title}>Résolution des conflits de données</Title>
        
        {conflicts.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="check-circle-outline" size={48} color={theme.colors.primary} />
            <Paragraph style={styles.emptyText}>Aucun conflit à résoudre</Paragraph>
            <Button mode="contained" onPress={hideModal} style={styles.closeButton}>
              Fermer
            </Button>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.conflictList}>
              <Text style={styles.sectionTitle}>Conflits ({conflicts.length})</Text>
              <ScrollView style={styles.conflictsScroll}>
                {conflicts.map((conflict, index) => (
                  <TouchableOpacity
                    key={conflict.id}
                    style={[
                      styles.conflictItem,
                      selectedConflict?.id === conflict.id && styles.selectedConflict
                    ]}
                    onPress={() => handleSelectConflict(conflict)}
                  >
                    <Text style={styles.conflictName}>
                      {conflict.entityType} - {formatDate(conflict.createdAt)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {selectedConflict && (
              <View style={styles.resolutionContainer}>
                <Text style={styles.sectionTitle}>
                  Résolution pour {selectedConflict.entityType}
                </Text>
                
                <View style={styles.comparisonContainer}>
                  <View style={styles.dataColumn}>
                    <Text style={styles.columnTitle}>Données locales</Text>
                    {renderDataPreview(selectedConflict.localData)}
                  </View>
                  
                  <View style={styles.dataColumn}>
                    <Text style={styles.columnTitle}>Données serveur</Text>
                    {renderDataPreview(selectedConflict.serverData)}
                  </View>
                </View>
                
                <Divider style={styles.divider} />
                
                <Text style={styles.sectionTitle}>Stratégie de résolution</Text>
                
                <RadioButton.Group 
                  onValueChange={(value) => {
                    setResolutionStrategy(value as any);
                    setIsCustomEdit(false);
                  }}
                  value={resolutionStrategy}
                >
                  <View style={styles.radioItem}>
                    <RadioButton value="server" />
                    <Text style={styles.radioLabel}>Utiliser la version du serveur</Text>
                  </View>
                  <View style={styles.radioItem}>
                    <RadioButton value="client" />
                    <Text style={styles.radioLabel}>Utiliser la version locale</Text>
                  </View>
                  <View style={styles.radioItem}>
                    <RadioButton value="merge" />
                    <Text style={styles.radioLabel}>Fusionner les deux versions</Text>
                  </View>
                </RadioButton.Group>
                
                <Button 
                  mode="contained" 
                  onPress={handleResolveConflict}
                  style={styles.resolveButton}
                >
                  Résoudre ce conflit
                </Button>
              </View>
            )}
          </View>
        )}
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 10,
    padding: 20,
    flex: 0.9,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  conflictList: {
    width: '30%',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    paddingRight: 10,
  },
  conflictsScroll: {
    flex: 1,
  },
  conflictItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedConflict: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  conflictName: {
    fontSize: 14,
  },
  resolutionContainer: {
    flex: 1,
    paddingLeft: 20,
  },
  comparisonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dataColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  columnTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  dataCard: {
    maxHeight: 250,
  },
  dataItem: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  dataKey: {
    fontWeight: 'bold',
    marginRight: 5,
    minWidth: 80,
  },
  dataValue: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginVertical: 10,
  },
  divider: {
    marginVertical: 15,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  radioLabel: {
    marginLeft: 8,
  },
  resolveButton: {
    marginTop: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginVertical: 20,
    fontSize: 16,
  },
  closeButton: {
    marginTop: 20,
  },
});

export default ConflictResolutionModal;