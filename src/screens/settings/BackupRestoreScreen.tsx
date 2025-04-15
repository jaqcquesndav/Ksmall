import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Text, Divider, Button, List, ActivityIndicator, useTheme } from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

import AppHeader from '../../components/common/AppHeader';
import { Colors } from '../../constants/Colors';

const BackupRestoreScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  
  // Function to create backup
  const createBackup = async () => {
    setIsBackingUp(true);
    try {
      // Simulation of backup creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, you would:
      // 1. Collect data from your database/storage
      // 2. Format it appropriately
      // 3. Save it to a file
      // 4. Allow the user to share/save it
      
      const backupDate = new Date().toISOString();
      const backupFileName = `ksmall_backup_${backupDate.split('T')[0]}.json`;
      const backupFilePath = `${FileSystem.documentDirectory}${backupFileName}`;
      
      // Mock backup data
      const backupData = {
        timestamp: backupDate,
        version: '1.0',
        data: {
          // Your app data would go here
          accounts: [],
          transactions: [],
          settings: {}
        }
      };
      
      await FileSystem.writeAsStringAsync(
        backupFilePath, 
        JSON.stringify(backupData)
      );
      
      // Save backup date
      setLastBackupDate(backupDate);
      
      // Share the file
      if (await FileSystem.getInfoAsync(backupFilePath)) {
        Alert.alert(
          'Sauvegarde créée',
          'La sauvegarde a été créée avec succès. Voulez-vous la partager?',
          [
            { 
              text: 'Partager', 
              onPress: async () => {
                await Sharing.shareAsync(backupFilePath);
              }
            },
            { text: 'Plus tard', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la création de la sauvegarde.');
      console.error(error);
    } finally {
      setIsBackingUp(false);
    }
  };
  
  // Function to restore from backup
  const restoreFromBackup = async () => {
    try {
      // Let user pick a backup file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });
      
      if (result.type === 'cancel') {
        return;
      }
      
      setIsRestoring(true);
      
      // In a real app, you would:
      // 1. Validate the backup file
      // 2. Parse the data
      // 3. Restore it to your database/storage
      
      // Simulate restoration process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      Alert.alert(
        'Restauration terminée',
        'Les données ont été restaurées avec succès.'
      );
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la restauration.');
      console.error(error);
    } finally {
      setIsRestoring(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <AppHeader title="Sauvegarde et restauration" onBack={() => navigation.goBack()} />
      
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">Sauvegarde des données</Text>
            <Divider style={styles.divider} />
            
            <Text style={styles.description}>
              Créez une sauvegarde complète de toutes vos données. Cette sauvegarde peut être utilisée pour restaurer vos données en cas de besoin.
            </Text>
            
            {lastBackupDate && (
              <Text style={styles.backupInfo}>
                Dernière sauvegarde: {new Date(lastBackupDate).toLocaleString()}
              </Text>
            )}
            
            <Button 
              mode="contained" 
              onPress={createBackup}
              disabled={isBackingUp} 
              style={styles.actionButton}
            >
              {isBackingUp ? 'Sauvegarde en cours...' : 'Créer une sauvegarde'}
            </Button>
            
            {isBackingUp && <ActivityIndicator style={styles.loader} />}
          </Card.Content>
        </Card>
        
        <Card style={[styles.card, styles.restoreCard]}>
          <Card.Content>
            <Text variant="titleLarge">Restauration des données</Text>
            <Divider style={styles.divider} />
            
            <Text style={styles.description}>
              Restaurez vos données à partir d'une sauvegarde précédemment créée. Cette action remplacera toutes vos données actuelles.
            </Text>
            
            <Text style={styles.warning}>
              Attention : La restauration remplacera définitivement vos données actuelles. Assurez-vous de créer une sauvegarde avant de procéder.
            </Text>
            
            <Button 
              mode="contained" 
              onPress={restoreFromBackup}
              disabled={isRestoring} 
              style={[styles.actionButton, styles.restoreButton]}
            >
              {isRestoring ? 'Restauration en cours...' : 'Restaurer depuis une sauvegarde'}
            </Button>
            
            {isRestoring && <ActivityIndicator style={styles.loader} />}
          </Card.Content>
        </Card>
      </ScrollView>
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
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  restoreCard: {
    backgroundColor: '#fafafa',
  },
  divider: {
    marginVertical: 12,
  },
  description: {
    marginVertical: 8,
    color: '#555',
  },
  backupInfo: {
    marginTop: 8,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  warning: {
    marginVertical: 8,
    color: '#f44336',
  },
  actionButton: {
    marginTop: 16,
  },
  restoreButton: {
    backgroundColor: '#ff9800',
  },
  loader: {
    marginTop: 16,
  }
});

export default BackupRestoreScreen;