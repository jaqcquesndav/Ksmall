import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Text, Divider, Button, List, Checkbox, RadioButton, ActivityIndicator, useTheme } from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import AppHeader from '../../components/common/AppHeader';
import { Colors } from '../../constants/Colors';

const DataExportScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  
  const [exportFormat, setExportFormat] = useState<string>('xlsx');
  const [exporting, setExporting] = useState<boolean>(false);
  const [selectedData, setSelectedData] = useState({
    transactions: true,
    accounts: true,
    fiscalYears: true,
    taxes: true,
    clients: false,
    suppliers: false
  });
  
  const toggleDataSelection = (key: keyof typeof selectedData) => {
    setSelectedData(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const exportData = async () => {
    setExporting(true);
    
    try {
      // Sélectionner au moins un type de données
      const hasSelectedData = Object.values(selectedData).some(value => value);
      if (!hasSelectedData) {
        Alert.alert('Erreur', 'Veuillez sélectionner au moins un type de données à exporter.');
        setExporting(false);
        return;
      }
      
      // Simulation d'un export (à remplacer par votre logique d'exportation)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Dans une application réelle, nous génèrerions ici un fichier d'export
      // Puis nous le partagerions avec l'utilisateur
      
      // Exemple fictif de création et partage de fichier
      const fileName = `export_comptable_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Simulation de création de fichier (dans une app réelle, vous généreriez le contenu approprié)
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify({
        exportDate: new Date().toISOString(),
        data: selectedData
      }));
      
      // Vérifier si le partage est disponible puis partager
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Erreur', 'Le partage n\'est pas disponible sur cet appareil');
      }
      
      Alert.alert(
        'Exportation réussie',
        `Les données ont été exportées avec succès au format ${exportFormat.toUpperCase()}.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'exportation des données.');
    } finally {
      setExporting(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <AppHeader
        title="Exportation de données"
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Format d'exportation</Text>
            <Divider style={styles.divider} />
            
            <RadioButton.Group onValueChange={value => setExportFormat(value)} value={exportFormat}>
              <View style={styles.radioOption}>
                <RadioButton.Item
                  label="Excel (XLSX)"
                  value="xlsx"
                  position="leading"
                  labelStyle={styles.radioLabel}
                />
              </View>
              
              <View style={styles.radioOption}>
                <RadioButton.Item
                  label="CSV (Fichier délimité)"
                  value="csv"
                  position="leading"
                  labelStyle={styles.radioLabel}
                />
              </View>
              
              <View style={styles.radioOption}>
                <RadioButton.Item
                  label="JSON"
                  value="json"
                  position="leading"
                  labelStyle={styles.radioLabel}
                />
              </View>
              
              <View style={styles.radioOption}>
                <RadioButton.Item
                  label="PDF"
                  value="pdf"
                  position="leading"
                  labelStyle={styles.radioLabel}
                />
              </View>
            </RadioButton.Group>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Données à exporter</Text>
            <Divider style={styles.divider} />
            
            <List.Item
              title="Transactions"
              left={props => (
                <Checkbox
                  status={selectedData.transactions ? 'checked' : 'unchecked'}
                  onPress={() => toggleDataSelection('transactions')}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Plan comptable"
              left={props => (
                <Checkbox
                  status={selectedData.accounts ? 'checked' : 'unchecked'}
                  onPress={() => toggleDataSelection('accounts')}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Exercices fiscaux"
              left={props => (
                <Checkbox
                  status={selectedData.fiscalYears ? 'checked' : 'unchecked'}
                  onPress={() => toggleDataSelection('fiscalYears')}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Taxes et impôts"
              left={props => (
                <Checkbox
                  status={selectedData.taxes ? 'checked' : 'unchecked'}
                  onPress={() => toggleDataSelection('taxes')}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Clients"
              left={props => (
                <Checkbox
                  status={selectedData.clients ? 'checked' : 'unchecked'}
                  onPress={() => toggleDataSelection('clients')}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Fournisseurs"
              left={props => (
                <Checkbox
                  status={selectedData.suppliers ? 'checked' : 'unchecked'}
                  onPress={() => toggleDataSelection('suppliers')}
                />
              )}
            />
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Période à exporter</Text>
            <Divider style={styles.divider} />
            
            <Button 
              mode="outlined" 
              icon="calendar-range" 
              onPress={() => {
                // À implémenter: ouvrir une boîte de dialogue de sélection de date
                console.log('Sélection de période');
              }}
              style={styles.button}
            >
              Sélectionner une période
            </Button>
            
            <Text style={styles.periodText}>
              Période sélectionnée: Tout l'historique
            </Text>
          </Card.Content>
        </Card>
        
        <Button
          mode="contained"
          icon="database-export"
          onPress={exportData}
          disabled={exporting}
          style={styles.exportButton}
        >
          {exporting ? 'Exportation en cours...' : 'Exporter les données'}
        </Button>
        
        {exporting && (
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
    paddingBottom: 32,
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
  radioOption: {
    marginVertical: 4,
  },
  radioLabel: {
    fontSize: 16,
  },
  button: {
    marginVertical: 16,
  },
  exportButton: {
    marginVertical: 16,
    paddingVertical: 8,
  },
  periodText: {
    fontStyle: 'italic',
    marginTop: 8,
  },
  loader: {
    marginTop: 20,
  }
});

export default DataExportScreen;