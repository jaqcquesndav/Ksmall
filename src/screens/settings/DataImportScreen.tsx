import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Text, Divider, Button, List, ActivityIndicator, useTheme } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';

import AppHeader from '../../components/common/AppHeader';
import { Colors } from '../../constants/Colors';

const DataImportScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [importing, setImporting] = useState<boolean>(false);
  
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/json'],
        copyToCacheDirectory: true,
      });
      
      if (result.type === 'success') {
        setSelectedFile(result);
      }
    } catch (err) {
      console.error('Erreur lors de la sélection du fichier:', err);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sélection du fichier.');
    }
  };
  
  const importData = async () => {
    if (!selectedFile) return;
    
    setImporting(true);
    
    try {
      // Simulation d'un import (à remplacer par votre logique d'importation)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Importation réussie',
        'Les données comptables ont été importées avec succès.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'importation des données.');
    } finally {
      setImporting(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <AppHeader
        title="Importation de données"
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Formats supportés</Text>
            <Divider style={styles.divider} />
            
            <List.Item
              title="Excel (XLSX)"
              description="Fichiers Excel 2007+"
              left={props => <List.Icon {...props} icon="file-excel" color={Colors.primary} />}
            />
            
            <Divider />
            
            <List.Item
              title="CSV"
              description="Fichiers texte délimités par des virgules"
              left={props => <List.Icon {...props} icon="file-delimited" color={Colors.primary} />}
            />
            
            <Divider />
            
            <List.Item
              title="JSON"
              description="Format d'échange de données structurées"
              left={props => <List.Icon {...props} icon="code-json" color={Colors.primary} />}
            />
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Sélectionner un fichier</Text>
            <Divider style={styles.divider} />
            
            <Button 
              mode="contained" 
              icon="file-upload" 
              onPress={pickDocument}
              style={styles.button}
            >
              Sélectionner un fichier
            </Button>
            
            {selectedFile && (
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>Fichier: {selectedFile.name}</Text>
                <Text style={styles.fileSize}>Taille: {(selectedFile.size / 1024).toFixed(2)} KB</Text>
              </View>
            )}
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Options d'importation</Text>
            <Divider style={styles.divider} />
            
            <List.Item
              title="Remplacer toutes les données existantes"
              description="Attention: cette action est irréversible"
              left={props => <List.Icon {...props} icon="alert" color={Colors.error} />}
            />
            
            <Divider />
            
            <List.Item
              title="Ajouter aux données existantes"
              description="Fusionner les nouvelles données avec les données existantes"
              left={props => <List.Icon {...props} icon="plus-circle" color={Colors.primary} />}
            />
          </Card.Content>
        </Card>
        
        <Button
          mode="contained"
          icon="database-import"
          onPress={importData}
          disabled={!selectedFile || importing}
          style={styles.importButton}
        >
          {importing ? 'Importation en cours...' : 'Importer les données'}
        </Button>
        
        {importing && (
          <ActivityIndicator 
            animating={true} 
            color={Colors.primary} 
            size="large" 
            style={styles.loader} 
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
    marginTop: 8,
  },
  button: {
    marginVertical: 16,
  },
  importButton: {
    marginVertical: 16,
    paddingVertical: 8,
  },
  fileInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e8f4f8',
    borderRadius: 4,
  },
  fileName: {
    fontWeight: 'bold',
  },
  fileSize: {
    marginTop: 4,
    color: '#666',
  },
  loader: {
    marginTop: 20,
  }
});

export default DataImportScreen;