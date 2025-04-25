import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme as useNavigationTheme } from '@react-navigation/native';
import eventEmitter from '../../utils/EventEmitter';
import { SYNC_EVENTS } from '../../services/api/ApiService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ConflictItem {
  id: string;
  entity: string;
  entityId: string;
  localData: any;
  serverData: any;
  resolved: boolean;
  resolution?: 'local' | 'server' | 'merge';
}

interface ConflictsData {
  conflicts: ConflictItem[];
}

interface SyncConflictModalProps {
  onResolveConflict: (conflict: ConflictItem, resolution: 'local' | 'server' | 'merge') => void;
  onResolveAll: (resolution: 'local' | 'server') => void;
}

// Cette constante est déjà définie dans SYNC_EVENTS, utilisons la référence
const { SYNC_CONFLICTS_DETECTED } = SYNC_EVENTS;

const SyncConflictModal: React.FC<SyncConflictModalProps> = ({
  onResolveConflict,
  onResolveAll,
}) => {
  const theme = useNavigationTheme();
  const { colors } = theme;
  const [visible, setVisible] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<ConflictItem | null>(null);
  
  // Couleurs personnalisées définies localement pour éviter les erreurs TypeScript
  const customColors = {
    backgroundHover: 'rgba(0, 0, 0, 0.05)',
    secondary: '#2196F3',
    accent: '#FF9800',
    cardBackground: colors.card,
    textSecondary: 'rgba(0, 0, 0, 0.6)',
    success: '#4CAF50'
  };
  
  useEffect(() => {
    const conflictsListener = eventEmitter.on(
      SYNC_CONFLICTS_DETECTED,
      (data: ConflictsData) => {
        setConflicts(data.conflicts);
        setVisible(true);
      }
    );

    return () => {
      conflictsListener();
    };
  }, []);

  const handleResolveConflict = (conflict: ConflictItem, resolution: 'local' | 'server' | 'merge') => {
    onResolveConflict(conflict, resolution);
    
    // Mise à jour de l'état local
    setConflicts(prev => 
      prev.map(c => c.id === conflict.id 
        ? { ...c, resolved: true, resolution } 
        : c
      )
    );
    
    // Fermer la modal si tous les conflits sont résolus
    if (conflicts.every(c => c.id === conflict.id || c.resolved)) {
      setTimeout(() => setVisible(false), 500);
    }
  };

  const handleResolveAll = (resolution: 'local' | 'server') => {
    onResolveAll(resolution);
    
    // Marquer tous les conflits comme résolus
    setConflicts(prev => 
      prev.map(c => ({ ...c, resolved: true, resolution }))
    );
    
    // Fermer la modal
    setTimeout(() => setVisible(false), 500);
  };

  const renderConflictItem = ({ item }: { item: ConflictItem }) => (
    <TouchableOpacity
      style={[
        styles.conflictItem,
        selectedConflict?.id === item.id && { backgroundColor: customColors.backgroundHover },
        item.resolved && styles.resolvedItem
      ]}
      onPress={() => setSelectedConflict(item)}
      disabled={item.resolved}
    >
      <View style={styles.conflictHeader}>
        <Text style={[styles.entityText, { color: colors.text }]}>
          {item.entity} #{item.entityId.substring(0, 8)}
        </Text>
        {item.resolved && (
          <View style={styles.resolvedBadge}>
            <Text style={styles.resolvedText}>
              {item.resolution === 'local' ? 'Local' : 
               item.resolution === 'server' ? 'Serveur' : 'Fusionné'}
            </Text>
          </View>
        )}
      </View>
      
      {selectedConflict?.id === item.id && !item.resolved && (
        <View style={styles.conflictDetails}>
          <View style={styles.comparisonSection}>
            <View style={styles.dataColumn}>
              <Text style={[styles.dataHeader, { color: colors.primary }]}>Local</Text>
              <ScrollView style={styles.dataContainer}>
                <Text style={{ color: colors.text }}>
                  {JSON.stringify(item.localData, null, 2)}
                </Text>
              </ScrollView>
              <TouchableOpacity
                style={[styles.resolutionButton, { backgroundColor: colors.primary }]}
                onPress={() => handleResolveConflict(item, 'local')}
              >
                <Text style={styles.buttonText}>Garder local</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.dataColumn}>
              <Text style={[styles.dataHeader, { color: customColors.secondary }]}>Serveur</Text>
              <ScrollView style={styles.dataContainer}>
                <Text style={{ color: colors.text }}>
                  {JSON.stringify(item.serverData, null, 2)}
                </Text>
              </ScrollView>
              <TouchableOpacity
                style={[styles.resolutionButton, { backgroundColor: customColors.secondary }]}
                onPress={() => handleResolveConflict(item, 'server')}
              >
                <Text style={styles.buttonText}>Garder serveur</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.mergeButton, { backgroundColor: customColors.accent }]}
            onPress={() => handleResolveConflict(item, 'merge')}
          >
            <Text style={styles.buttonText}>Fusionner intelligemment</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        // Ne ferme pas automatiquement si des conflits non résolus
        if (conflicts.every(c => c.resolved)) setVisible(false);
      }}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Conflits de synchronisation détectés
            </Text>
            {conflicts.every(c => c.resolved) && (
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={[styles.modalDescription, { color: colors.text }]}>
            {conflicts.filter(c => !c.resolved).length} conflit(s) en attente de résolution.
            Veuillez examiner et choisir la version à conserver pour chaque élément.
          </Text>
          
          {!conflicts.every(c => c.resolved) && (
            <View style={styles.bulkActions}>
              <TouchableOpacity
                style={[styles.bulkButton, { backgroundColor: colors.primary }]}
                onPress={() => handleResolveAll('local')}
              >
                <Text style={styles.buttonText}>Tout garder en local</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bulkButton, { backgroundColor: customColors.secondary }]}
                onPress={() => handleResolveAll('server')}
              >
                <Text style={styles.buttonText}>Tout garder du serveur</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <FlatList
            data={conflicts}
            renderItem={renderConflictItem}
            keyExtractor={item => item.id}
            style={styles.conflictsList}
            contentContainerStyle={styles.conflictsContent}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 15,
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  bulkButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
  conflictsList: {
    flexGrow: 1,
  },
  conflictsContent: {
    paddingBottom: 10,
  },
  conflictItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  resolvedItem: {
    opacity: 0.7,
  },
  conflictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entityText: {
    fontWeight: '500',
    fontSize: 16,
  },
  resolvedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
  },
  resolvedText: {
    color: 'white',
    fontSize: 12,
  },
  conflictDetails: {
    marginTop: 15,
  },
  comparisonSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dataColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  dataHeader: {
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  dataContainer: {
    height: 120,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 5,
    marginBottom: 10,
  },
  resolutionButton: {
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  mergeButton: {
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
});

export default SyncConflictModal;