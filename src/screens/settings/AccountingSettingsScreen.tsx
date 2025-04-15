import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, RadioButton, Button, List, Divider, useTheme, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/common/AppHeader';
import CurrencyService, { Currency, CURRENCIES } from '../../services/CurrencyService';
import AccountingService from '../../services/AccountingService';
import { useTranslation } from 'react-i18next';
import logger from '../../utils/logger';

const AccountingSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { t } = useTranslation();
  
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('XOF');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Pour forcer le rafraîchissement
  const [currencyExpanded, setCurrencyExpanded] = useState(false);
  
  // Charger la devise actuelle au chargement de l'écran
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const currency = await CurrencyService.getSelectedCurrency();
        setSelectedCurrency(currency);
      } catch (error) {
        logger.error('Erreur lors du chargement des paramètres comptables:', error);
        Alert.alert(
          'Erreur',
          'Impossible de charger les paramètres comptables. Veuillez réessayer.'
        );
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [refreshKey]);
  
  // Sauvegarder les modifications
  const saveSettings = async () => {
    try {
      setSaving(true);
      await CurrencyService.setSelectedCurrency(selectedCurrency);
      
      // Informer l'utilisateur que les paramètres sont mis à jour
      Alert.alert(
        'Succès',
        'Les paramètres comptables ont été mis à jour avec succès.',
        [
          {
            text: 'OK',
            onPress: () => setRefreshKey(prev => prev + 1) // Rafraîchir les données
          }
        ]
      );
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde des paramètres comptables:', error);
      Alert.alert(
        'Erreur',
        'Impossible de sauvegarder les paramètres comptables. Veuillez réessayer.'
      );
    } finally {
      setSaving(false);
    }
  };
  
  // Prévisualisation du format de la devise
  const getCurrencyPreview = (currencyCode: Currency): string => {
    return CURRENCIES[currencyCode].format(12345.67);
  };

  // Fonctions de navigation vers différents écrans
  const navigateToChartOfAccounts = () => {
    navigation.navigate('ChartOfAccounts');
  };

  const navigateToFiscalYear = () => {
    navigation.navigate('FiscalYear');
  };

  const navigateToTaxSettings = () => {
    navigation.navigate('TaxSettings');
  };

  const navigateToReportFormat = () => {
    navigation.navigate('ReportFormat');
  };

  const navigateToDisplayPreferences = () => {
    navigation.navigate('DisplayPreferences');
  };

  const navigateToDataImport = () => {
    navigation.navigate('DataImport');
  };

  const navigateToDataExport = () => {
    navigation.navigate('DataExport');
  };

  const navigateToBackupRestore = () => {
    navigation.navigate('BackupRestore');
  };
  
  return (
    <View style={styles.container}>
      <AppHeader 
        title={t('accounting_settings')} 
        onBack={() => navigation.navigate('AccountingMain')} 
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>
            Chargement des paramètres comptables...
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Module de navigation vers les différents écrans de paramètres comptables */}
          <Card style={styles.card}>
            <Card.Title title="Configuration comptable" />
            <Card.Content>
              <List.Item
                title="Plan comptable"
                description="Gérer les comptes comptables, catégoriser et configurer la structure du plan"
                left={props => <List.Icon {...props} icon="book-account" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={navigateToChartOfAccounts}
                style={styles.listItem}
              />
              <Divider />
              <List.Item
                title="Exercices fiscaux"
                description="Gérer les périodes comptables, clôturer et configurer les exercices"
                left={props => <List.Icon {...props} icon="calendar" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={navigateToFiscalYear}
                style={styles.listItem}
              />
              <Divider />
              <List.Item
                title="Taxes et impôts"
                description="Configurer les taux de TVA et autres taxes applicables"
                left={props => <List.Icon {...props} icon="percent" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={navigateToTaxSettings}
                style={styles.listItem}
              />
            </Card.Content>
          </Card>

          {/* Paramètres de devise */}
          <Card style={styles.card}>
            <List.Accordion
              title="Paramètres de devise"
              description="Configurer la devise utilisée pour la comptabilité"
              left={props => <List.Icon {...props} icon="currency-eur" />}
              expanded={currencyExpanded}
              onPress={() => setCurrencyExpanded(!currencyExpanded)}
            >
              <Card.Content>
                <Text style={styles.helpText}>
                  Sélectionnez la devise principale que vous souhaitez utiliser pour votre comptabilité.
                  Tous les rapports financiers et les écritures comptables utiliseront cette devise.
                </Text>
                
                <RadioButton.Group 
                  onValueChange={value => setSelectedCurrency(value as Currency)}
                  value={selectedCurrency}
                >
                  {Object.values(CURRENCIES).map((currency) => (
                    <View key={currency.code} style={styles.currencyOption}>
                      <RadioButton.Item
                        label={`${currency.name} (${currency.symbol})`}
                        value={currency.code}
                      />
                      <Text style={styles.previewText}>
                        Exemple: {getCurrencyPreview(currency.code)}
                      </Text>
                      <Divider style={styles.divider} />
                    </View>
                  ))}
                </RadioButton.Group>
                
                <View style={styles.warningContainer}>
                  <Text style={styles.warningText}>
                    Note: Le changement de devise n'affectera pas les montants existants.
                    Si vous avez déjà des transactions, nous vous recommandons de faire ce changement
                    uniquement au début d'un nouvel exercice fiscal.
                  </Text>
                </View>
                
                <Button 
                  mode="contained" 
                  onPress={saveSettings} 
                  style={styles.saveButton}
                  loading={saving}
                  disabled={saving}
                >
                  Enregistrer les modifications
                </Button>
              </Card.Content>
            </List.Accordion>
          </Card>

          {/* Présentation et formats */}
          <Card style={styles.card}>
            <Card.Title title="Présentation et formats" />
            <Card.Content>
              <List.Item
                title="Format des rapports"
                description="Personnaliser l'apparence et la structure des rapports financiers"
                left={props => <List.Icon {...props} icon="file-document-outline" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={navigateToReportFormat}
                style={styles.listItem}
              />
              <Divider />
              <List.Item
                title="Préférences d'affichage"
                description="Configurer les options d'affichage des données comptables"
                left={props => <List.Icon {...props} icon="eye-outline" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={navigateToDisplayPreferences}
                style={styles.listItem}
              />
            </Card.Content>
          </Card>

          {/* Données et sauvegarde */}
          <Card style={styles.card}>
            <Card.Title title="Données et sauvegarde" />
            <Card.Content>
              <List.Item
                title="Importation de données"
                description="Importer des données comptables depuis des fichiers externes"
                left={props => <List.Icon {...props} icon="database-import" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={navigateToDataImport}
                style={styles.listItem}
              />
              <Divider />
              <List.Item
                title="Exportation de données"
                description="Exporter vos données comptables vers différents formats"
                left={props => <List.Icon {...props} icon="database-export" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={navigateToDataExport}
                style={styles.listItem}
              />
              <Divider />
              <List.Item
                title="Sauvegarde et restauration"
                description="Sauvegarder ou restaurer toutes les données comptables"
                left={props => <List.Icon {...props} icon="backup-restore" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={navigateToBackupRestore}
                style={styles.listItem}
              />
            </Card.Content>
          </Card>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  helpText: {
    marginBottom: 16,
    color: '#666',
    fontSize: 14,
  },
  currencyOption: {
    marginBottom: 8,
  },
  previewText: {
    marginLeft: 28,
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
    color: '#666',
  },
  divider: {
    marginTop: 8,
  },
  warningContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFF9C4',
    borderRadius: 8,
  },
  warningText: {
    color: '#FF8F00',
    fontSize: 14,
  },
  saveButton: {
    marginVertical: 24,
  },
  listItem: {
    padding: 8,
  },
});

export default AccountingSettingsScreen;