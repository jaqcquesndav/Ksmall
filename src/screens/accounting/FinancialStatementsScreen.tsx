import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text, Button, Card, RadioButton, List, useTheme, Divider, FAB, Snackbar } from 'react-native-paper';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import AppHeader from '../../components/common/AppHeader';
import AccountingService from '../../services/AccountingService';
import DatabaseService from '../../services/DatabaseService';
import logger from '../../utils/logger';

interface Report {
  id: string;
  type: string;
  title: string;
  filePath: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

const FinancialStatementsScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  
  const [selectedReportType, setSelectedReportType] = useState<'bilan' | 'compte_resultat' | 'balance' | 'tresorerie'>('bilan');
  const [startDate, setStartDate] = useState<Date>(startOfMonth(subMonths(new Date(), 1)));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savedReports, setSavedReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<'new' | 'saved'>('new');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  useEffect(() => {
    // Initialiser les tables comptables si nécessaire
    DatabaseService.initAccountingTables().catch(error => {
      logger.error('Erreur lors de l\'initialisation des tables comptables:', error);
    });
    
    loadSavedReports();
  }, []);
  
  const loadSavedReports = async () => {
    setLoading(true);
    try {
      // Récupérer les rapports depuis la base de données
      const db = await DatabaseService.getDBConnection();
      const [result] = await DatabaseService.executeQuery(
        db,
        `SELECT id, type, title, file_path as filePath, start_date as startDate, 
         end_date as endDate, created_at as createdAt FROM accounting_reports 
         ORDER BY created_at DESC LIMIT 20`,
        []
      );
      
      if (result?.rows?._array) {
        setSavedReports(result.rows._array);
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des rapports:', error);
      Alert.alert('Erreur', 'Impossible de charger les rapports sauvegardés');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };
  
  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };
  
  const formatDate = (date: Date): string => {
    return format(date, 'dd MMMM yyyy', { locale: fr });
  };
  
  const generateReport = async () => {
    if (startDate > endDate) {
      Alert.alert(
        'Dates invalides',
        'La date de début doit être antérieure à la date de fin.'
      );
      return;
    }
    
    setGenerating(true);
    try {
      const reportPath = await AccountingService.generateSYSCOHADAReport(
        selectedReportType,
        startDate,
        endDate,
        'Entreprise Demo'
      );
      
      // Afficher un message de succès et rafraîchir la liste
      setSnackbarMessage('Rapport généré avec succès');
      setSnackbarVisible(true);
      loadSavedReports();
      
      // Basculer vers la section des rapports sauvegardés
      setExpandedSection('saved');
    } catch (error) {
      logger.error('Erreur lors de la génération du rapport:', error);
      Alert.alert(
        'Erreur',
        'Impossible de générer le rapport. Veuillez réessayer.'
      );
    } finally {
      setGenerating(false);
    }
  };
  
  const shareReport = async (reportPath: string) => {
    try {
      await AccountingService.shareReport(reportPath);
    } catch (error) {
      logger.error('Erreur lors du partage du rapport:', error);
      Alert.alert(
        'Erreur',
        'Impossible de partager le rapport. Veuillez réessayer.'
      );
    }
  };
  
  const deleteReport = async (reportId: string) => {
    try {
      // Suppression du rapport de la base de données
      const db = await DatabaseService.getDBConnection();
      await DatabaseService.executeQuery(
        db,
        'DELETE FROM accounting_reports WHERE id = ?',
        [reportId]
      );
      
      // Rafraîchir la liste
      loadSavedReports();
      
      setSnackbarMessage('Rapport supprimé');
      setSnackbarVisible(true);
    } catch (error) {
      logger.error('Erreur lors de la suppression du rapport:', error);
      Alert.alert(
        'Erreur',
        'Impossible de supprimer le rapport. Veuillez réessayer.'
      );
    }
  };
  
  const getReportTypeLabel = (type: string): string => {
    switch(type) {
      case 'bilan': return 'Bilan';
      case 'compte_resultat': return 'Compte de résultat';
      case 'balance': return 'Balance des comptes';
      case 'tresorerie': return 'Tableau des flux de trésorerie';
      default: return type;
    }
  };
  
  return (
    <View style={styles.container}>
      <AppHeader title="États Financiers SYSCOHADA" onBack={() => navigation.goBack()} />
      
      <ScrollView style={styles.content}>
        <List.Section>
          <List.Accordion
            title="Générer un nouveau rapport"
            left={props => <List.Icon {...props} icon="file-document-outline" />}
            expanded={expandedSection === 'new'}
            onPress={() => setExpandedSection(expandedSection === 'new' ? 'saved' : 'new')}
            titleStyle={{ fontWeight: 'bold' }}
          >
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Type de rapport</Text>
                <RadioButton.Group
                  onValueChange={value => setSelectedReportType(value as any)}
                  value={selectedReportType}
                >
                  <View style={styles.radioContainer}>
                    <RadioButton.Item
                      label="Bilan"
                      value="bilan"
                      labelStyle={styles.radioLabel}
                    />
                    <RadioButton.Item
                      label="Compte de résultat"
                      value="compte_resultat"
                      labelStyle={styles.radioLabel}
                    />
                    <RadioButton.Item
                      label="Balance des comptes"
                      value="balance"
                      labelStyle={styles.radioLabel}
                    />
                    <RadioButton.Item
                      label="Tableau des flux de trésorerie"
                      value="tresorerie"
                      labelStyle={styles.radioLabel}
                    />
                  </View>
                </RadioButton.Group>

                <Divider style={styles.divider} />
                
                <Text style={styles.sectionTitle}>Période</Text>
                <TouchableOpacity 
                  style={styles.dateSelector}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Ionicons 
                    name="calendar-outline" 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                  <View style={styles.dateTextContainer}>
                    <Text style={styles.dateLabel}>Du</Text>
                    <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
                  </View>
                </TouchableOpacity>
                
                {showStartDatePicker && (
                  <DateTimePickerModal
                    isVisible={showStartDatePicker}
                    mode="date"
                    onConfirm={date => handleStartDateChange(null, date)}
                    onCancel={() => setShowStartDatePicker(false)}
                  />
                )}
                
                <TouchableOpacity 
                  style={styles.dateSelector}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Ionicons 
                    name="calendar-outline" 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                  <View style={styles.dateTextContainer}>
                    <Text style={styles.dateLabel}>Au</Text>
                    <Text style={styles.dateValue}>{formatDate(endDate)}</Text>
                  </View>
                </TouchableOpacity>
                
                {showEndDatePicker && (
                  <DateTimePickerModal
                    isVisible={showEndDatePicker}
                    mode="date"
                    onConfirm={date => handleEndDateChange(null, date)}
                    onCancel={() => setShowEndDatePicker(false)}
                  />
                )}
                
                <Button
                  mode="contained"
                  onPress={generateReport}
                  style={styles.generateButton}
                  loading={generating}
                  disabled={generating}
                >
                  Générer le rapport
                </Button>
              </Card.Content>
            </Card>
          </List.Accordion>
          
          <List.Accordion
            title="Rapports sauvegardés"
            left={props => <List.Icon {...props} icon="folder-outline" />}
            expanded={expandedSection === 'saved'}
            onPress={() => setExpandedSection(expandedSection === 'saved' ? 'new' : 'saved')}
            titleStyle={{ fontWeight: 'bold' }}
          >
            {loading ? (
              <ActivityIndicator style={styles.loader} size="large" color={theme.colors.primary} />
            ) : savedReports.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content>
                  <Text style={styles.emptyText}>
                    Aucun rapport sauvegardé.
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Générez votre premier rapport pour le voir ici.
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              savedReports.map(report => (
                <Card
                  key={report.id}
                  style={styles.reportCard}
                >
                  <Card.Title
                    title={report.title}
                    subtitle={`Du ${format(new Date(report.startDate), 'dd/MM/yyyy')} au ${format(new Date(report.endDate), 'dd/MM/yyyy')}`}
                    left={props => <Ionicons name="document-text-outline" size={30} color={theme.colors.primary} />}
                  />
                  <Card.Content>
                    <Text variant="bodySmall" style={styles.reportType}>
                      {getReportTypeLabel(report.type)}
                    </Text>
                    <Text variant="bodySmall" style={styles.reportDate}>
                      Créé le {format(new Date(report.createdAt), 'dd/MM/yyyy à HH:mm')}
                    </Text>
                  </Card.Content>
                  <Card.Actions>
                    <Button 
                      onPress={() => shareReport(report.filePath)}
                      icon="share-variant"
                    >
                      Partager
                    </Button>
                    <Button 
                      onPress={() => {
                        Alert.alert(
                          'Supprimer le rapport',
                          'Êtes-vous sûr de vouloir supprimer ce rapport ?',
                          [
                            { text: 'Annuler', style: 'cancel' },
                            { text: 'Supprimer', onPress: () => deleteReport(report.id) }
                          ]
                        );
                      }}
                      icon="delete"
                      textColor={theme.colors.error}
                    >
                      Supprimer
                    </Button>
                  </Card.Actions>
                </Card>
              ))
            )}
          </List.Accordion>
        </List.Section>
      </ScrollView>
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="refresh"
        onPress={loadSavedReports}
      />
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  radioContainer: {
    marginLeft: -8,
  },
  radioLabel: {
    fontSize: 16,
  },
  divider: {
    marginVertical: 16,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 8,
  },
  dateTextContainer: {
    marginLeft: 16,
  },
  dateLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  dateValue: {
    fontSize: 16,
    marginTop: 4,
  },
  generateButton: {
    marginTop: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  reportCard: {
    marginVertical: 8,
  },
  reportType: {
    marginBottom: 4,
    opacity: 0.7,
  },
  reportDate: {
    opacity: 0.6,
  },
  loader: {
    marginVertical: 32,
  },
  emptyCard: {
    marginVertical: 16,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default FinancialStatementsScreen;
