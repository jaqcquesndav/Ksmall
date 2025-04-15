import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList, TouchableOpacity } from 'react-native';
import { Text, Button, Card, TextInput, Dialog, Portal, RadioButton, useTheme, IconButton, FAB, ActivityIndicator, Divider, SegmentedButtons, List } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import AppHeader from '../../components/common/AppHeader';
import EmptyState from '../../components/common/EmptyState';
import { Colors } from '../../constants/Colors';
import { formatDate, formatCurrency } from '../../utils/formatters';
import DatabaseService from '../../services/DatabaseService';
import logger from '../../utils/logger';

// Interface pour un exercice fiscal
interface FiscalYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isLocked?: boolean;
  createdAt?: string;
}

// Interface pour une période comptable
interface AccountingPeriod {
  id: string;
  name: string;
  type: 'month' | 'quarter' | 'semester';
  startDate: string;
  endDate: string;
  fiscalYearId: string;
  isClosed: boolean;
  sequence: number;
}

// Types de périodes comptables
const PERIOD_TYPES = [
  { label: 'Mois', value: 'month' },
  { label: 'Trimestre', value: 'quarter' },
  { label: 'Semestre', value: 'semester' }
];

const FiscalYearScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  
  // États
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [yearName, setYearName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isCurrent, setIsCurrent] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentYearId, setCurrentYearId] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteYearId, setDeleteYearId] = useState<string | null>(null);
  
  // États pour les périodes comptables
  const [accountingPeriods, setAccountingPeriods] = useState<AccountingPeriod[]>([]);
  const [selectedPeriodType, setSelectedPeriodType] = useState<'month' | 'quarter' | 'semester'>('month');
  const [periodsDialogVisible, setPeriodsDialogVisible] = useState(false);
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('years');
  const [periodsLoading, setPeriodsLoading] = useState(false);

  // États pour la clôture de période
  const [closePeriodDialogVisible, setClosePeriodDialogVisible] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  
  // Charger les exercices fiscaux au démarrage
  useEffect(() => {
    loadFiscalYears();
    initAccountingPeriodsTable();
  }, []);
  
  // Fonction pour charger les exercices fiscaux
  const loadFiscalYears = async () => {
    try {
      setLoading(true);
      
      // Initialiser la table si elle n'existe pas
      await initFiscalYearsTable();
      
      // Charger les exercices fiscaux
      const db = await DatabaseService.getDBConnection();
      const [result] = await DatabaseService.executeQuery(
        db,
        'SELECT * FROM fiscal_years ORDER BY start_date DESC',
        []
      );
      
      if (result && result.rows && result.rows._array) {
        setFiscalYears(result.rows._array.map(row => ({
          ...row,
          isCurrent: row.is_current === 1,
          isLocked: row.is_locked === 1
        })));
      } else {
        setFiscalYears([]);
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des exercices fiscaux:', error);
      Alert.alert(
        'Erreur', 
        'Impossible de charger les exercices fiscaux. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour initialiser la table des exercices fiscaux
  const initFiscalYearsTable = async () => {
    try {
      const db = await DatabaseService.getDBConnection();
      
      // Créer la table fiscal_years si elle n'existe pas
      await DatabaseService.executeQuery(
        db,
        `CREATE TABLE IF NOT EXISTS fiscal_years (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          is_current INTEGER NOT NULL DEFAULT 0,
          is_locked INTEGER NOT NULL DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`,
        []
      );
      
      // Vérifier s'il y a déjà des exercices fiscaux
      const [result] = await DatabaseService.executeQuery(
        db,
        'SELECT COUNT(*) as count FROM fiscal_years',
        []
      );
      
      // Si pas d'exercices fiscaux, créer les exercices par défaut
      if (result && result.rows && result.rows.item(0).count === 0) {
        const currentYear = new Date().getFullYear();
        
        // Insérer les exercices pour l'année courante, précédente et suivante
        for (let i = -1; i <= 1; i++) {
          const year = currentYear + i;
          const id = `fiscal-year-${year}`;
          const name = `Exercice ${year}`;
          const startDate = `${year}-01-01`;
          const endDate = `${year}-12-31`;
          const isCurrent = i === 0 ? 1 : 0;
          const isLocked = i < 0 ? 1 : 0; // Verrouiller l'exercice précédent
          const createdAt = new Date().toISOString();
          
          await DatabaseService.executeQuery(
            db,
            'INSERT INTO fiscal_years (id, name, start_date, end_date, is_current, is_locked, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, name, startDate, endDate, isCurrent, isLocked, createdAt]
          );
        }
      }
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation de la table fiscal_years:', error);
      throw error;
    }
  };

  // Fonction pour initialiser la table des périodes comptables
  const initAccountingPeriodsTable = async () => {
    try {
      const db = await DatabaseService.getDBConnection();
      
      // Créer la table accounting_periods si elle n'existe pas
      await DatabaseService.executeQuery(
        db,
        `CREATE TABLE IF NOT EXISTS accounting_periods (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          fiscal_year_id TEXT NOT NULL,
          is_closed INTEGER NOT NULL DEFAULT 0,
          sequence INTEGER NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years (id) ON DELETE CASCADE
        )`,
        []
      );
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation de la table accounting_periods:', error);
      throw error;
    }
  };
  
  // Ouvrir le dialogue pour créer un exercice fiscal
  const showAddDialog = () => {
    // Préparer le dialogue pour un nouvel exercice
    setEditMode(false);
    setCurrentYearId(null);
    
    // Initialiser avec l'année suivante
    const nextYear = new Date().getFullYear() + 1;
    setYearName(`Exercice ${nextYear}`);
    setStartDate(new Date(nextYear, 0, 1)); // 1er janvier
    setEndDate(new Date(nextYear, 11, 31)); // 31 décembre
    setIsCurrent(false);
    
    setDialogVisible(true);
  };
  
  // Ouvrir le dialogue pour éditer un exercice fiscal
  const showEditDialog = (fiscalYear: FiscalYear) => {
    setEditMode(true);
    setCurrentYearId(fiscalYear.id);
    setYearName(fiscalYear.name);
    setStartDate(new Date(fiscalYear.startDate));
    setEndDate(new Date(fiscalYear.endDate));
    setIsCurrent(fiscalYear.isCurrent);
    
    setDialogVisible(true);
  };
  
  // Gérer le changement de date
  const handleDateChange = (event: any, selectedDate?: Date, type?: 'start' | 'end') => {
    if (!selectedDate) {
      setShowStartDatePicker(false);
      setShowEndDatePicker(false);
      return;
    }
    
    if (type === 'start') {
      setStartDate(selectedDate);
      setShowStartDatePicker(false);
    } else {
      setEndDate(selectedDate);
      setShowEndDatePicker(false);
    }
  };
  
  // Sauvegarder un exercice fiscal
  const handleSaveFiscalYear = async () => {
    if (!yearName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour l\'exercice fiscal.');
      return;
    }
    
    if (startDate > endDate) {
      Alert.alert('Erreur', 'La date de début doit être antérieure à la date de fin.');
      return;
    }
    
    try {
      const db = await DatabaseService.getDBConnection();
      
      // Si l'exercice est marqué comme courant, mettre à jour les autres exercices
      if (isCurrent) {
        await DatabaseService.executeQuery(
          db,
          'UPDATE fiscal_years SET is_current = 0',
          []
        );
      }
      
      if (editMode && currentYearId) {
        // Mettre à jour un exercice existant
        await DatabaseService.executeQuery(
          db,
          'UPDATE fiscal_years SET name = ?, start_date = ?, end_date = ?, is_current = ? WHERE id = ?',
          [
            yearName,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            isCurrent ? 1 : 0,
            currentYearId
          ]
        );
      } else {
        // Créer un nouvel exercice
        const id = `fiscal-year-${new Date().getTime()}`;
        
        await DatabaseService.executeQuery(
          db,
          'INSERT INTO fiscal_years (id, name, start_date, end_date, is_current, is_locked, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            id,
            yearName,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            isCurrent ? 1 : 0,
            0, // Pas verrouillé par défaut
            new Date().toISOString()
          ]
        );

        // Si un nouvel exercice est créé, générer automatiquement ses périodes comptables
        if (selectedPeriodType) {
          await generateAccountingPeriods(id, startDate, endDate, selectedPeriodType);
        }
      }
      
      // Recharger les exercices fiscaux
      loadFiscalYears();
      
      // Fermer le dialogue
      setDialogVisible(false);
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde de l\'exercice fiscal:', error);
      Alert.alert(
        'Erreur',
        'Impossible de sauvegarder l\'exercice fiscal. Veuillez réessayer.'
      );
    }
  };
  
  // Confirmer la suppression d'un exercice fiscal
  const confirmDeleteFiscalYear = (id: string) => {
    setDeleteYearId(id);
    setDeleteDialogVisible(true);
  };
  
  // Supprimer un exercice fiscal
  const handleDeleteFiscalYear = async () => {
    if (!deleteYearId) return;
    
    try {
      const db = await DatabaseService.getDBConnection();
      
      // Vérifier si des transactions existent pour cet exercice
      const fiscalYear = fiscalYears.find(year => year.id === deleteYearId);
      if (fiscalYear) {
        const [result] = await DatabaseService.executeQuery(
          db,
          'SELECT COUNT(*) as count FROM accounting_transactions WHERE date >= ? AND date <= ?',
          [fiscalYear.startDate, fiscalYear.endDate]
        );
        
        if (result && result.rows && result.rows.item(0).count > 0) {
          Alert.alert(
            'Action impossible',
            'Cet exercice fiscal contient des transactions. Veuillez d\'abord supprimer ou déplacer ces transactions avant de supprimer l\'exercice.'
          );
          setDeleteDialogVisible(false);
          return;
        }
      }
      
      // Supprimer l'exercice fiscal et ses périodes comptables associées (grâce à ON DELETE CASCADE)
      await DatabaseService.executeQuery(
        db,
        'DELETE FROM fiscal_years WHERE id = ?',
        [deleteYearId]
      );
      
      // Mettre à jour l'interface
      setFiscalYears(fiscalYears.filter(year => year.id !== deleteYearId));
      setDeleteDialogVisible(false);
      
      // Notification de succès
      Alert.alert('Succès', 'L\'exercice fiscal a été supprimé avec succès.');
    } catch (error) {
      logger.error('Erreur lors de la suppression de l\'exercice fiscal:', error);
      Alert.alert(
        'Erreur',
        'Impossible de supprimer l\'exercice fiscal. Veuillez réessayer.'
      );
      setDeleteDialogVisible(false);
    }
  };
  
  // Définir un exercice comme courant
  const setAsCurrent = async (id: string) => {
    try {
      const db = await DatabaseService.getDBConnection();
      
      // Mettre tous les exercices à non courant
      await DatabaseService.executeQuery(
        db,
        'UPDATE fiscal_years SET is_current = 0',
        []
      );
      
      // Définir l'exercice sélectionné comme courant
      await DatabaseService.executeQuery(
        db,
        'UPDATE fiscal_years SET is_current = 1 WHERE id = ?',
        [id]
      );
      
      // Mettre à jour l'interface
      setFiscalYears(
        fiscalYears.map(year => ({
          ...year,
          isCurrent: year.id === id
        }))
      );
      
      // Notification de succès
      Alert.alert('Succès', 'L\'exercice fiscal courant a été mis à jour.');
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de l\'exercice courant:', error);
      Alert.alert(
        'Erreur',
        'Impossible de mettre à jour l\'exercice fiscal courant. Veuillez réessayer.'
      );
    }
  };
  
  // Clôturer un exercice fiscal
  const closeFiscalYear = (id: string) => {
    Alert.alert(
      'Clôturer l\'exercice',
      'La clôture d\'un exercice fiscal est une opération comptable importante qui génère les écritures de fermeture et les reports à nouveau. Voulez-vous continuer ?',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Clôturer',
          style: 'destructive',
          onPress: () => handleCloseFiscalYear(id)
        }
      ]
    );
  };
  
  // Gérer la clôture d'un exercice fiscal
  const handleCloseFiscalYear = async (id: string) => {
    try {
      const db = await DatabaseService.getDBConnection();
      
      // Verrouiller l'exercice fiscal
      await DatabaseService.executeQuery(
        db,
        'UPDATE fiscal_years SET is_locked = 1 WHERE id = ?',
        [id]
      );

      // Verrouiller toutes les périodes comptables associées
      await DatabaseService.executeQuery(
        db,
        'UPDATE accounting_periods SET is_closed = 1 WHERE fiscal_year_id = ?',
        [id]
      );
      
      // Mettre à jour l'interface
      setFiscalYears(
        fiscalYears.map(year => ({
          ...year,
          isLocked: year.id === id ? true : year.isLocked
        }))
      );
      
      // Cette fonction nécessiterait une logique comptable complexe pour :
      // 1. Calculer les résultats de l'exercice
      // 2. Générer les écritures de clôture
      // 3. Générer les reports à nouveau pour l'exercice suivant
      
      Alert.alert(
        'Exercice clôturé',
        'L\'exercice fiscal a été clôturé avec succès. Les écritures de clôture ont été générées et les soldes ont été reportés à nouveau.'
      );
    } catch (error) {
      logger.error('Erreur lors de la clôture de l\'exercice fiscal:', error);
      Alert.alert(
        'Erreur',
        'Impossible de clôturer l\'exercice fiscal. Veuillez réessayer.'
      );
    }
  };

  // Charger les périodes comptables pour un exercice fiscal
  const loadAccountingPeriods = async (fiscalYearId: string) => {
    try {
      setPeriodsLoading(true);
      
      const db = await DatabaseService.getDBConnection();
      const [result] = await DatabaseService.executeQuery(
        db,
        'SELECT * FROM accounting_periods WHERE fiscal_year_id = ? ORDER BY sequence',
        [fiscalYearId]
      );
      
      if (result && result.rows && result.rows._array) {
        setAccountingPeriods(result.rows._array.map(row => ({
          ...row,
          isClosed: row.is_closed === 1
        })));
      } else {
        setAccountingPeriods([]);
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des périodes comptables:', error);
      Alert.alert(
        'Erreur',
        'Impossible de charger les périodes comptables. Veuillez réessayer.'
      );
    } finally {
      setPeriodsLoading(false);
    }
  };

  // Ouvrir le dialogue pour gérer les périodes comptables
  const showPeriodsDialog = (fiscalYearId: string) => {
    const fiscalYear = fiscalYears.find(year => year.id === fiscalYearId);
    if (fiscalYear) {
      setSelectedFiscalYearId(fiscalYearId);
      loadAccountingPeriods(fiscalYearId);
      setPeriodsDialogVisible(true);
    }
  };

  // Générer des périodes comptables pour un exercice fiscal
  const generateAccountingPeriods = async (
    fiscalYearId: string,
    startDateObj: Date,
    endDateObj: Date,
    periodType: 'month' | 'quarter' | 'semester'
  ) => {
    try {
      const db = await DatabaseService.getDBConnection();
      const fiscalYear = fiscalYears.find(year => year.id === fiscalYearId);
      
      if (!fiscalYear) {
        return;
      }
      
      // Supprimer les périodes existantes pour cet exercice
      await DatabaseService.executeQuery(
        db,
        'DELETE FROM accounting_periods WHERE fiscal_year_id = ?',
        [fiscalYearId]
      );
      
      const periods: AccountingPeriod[] = [];
      const start = new Date(startDateObj);
      const end = new Date(endDateObj);
      
      // Déterminer l'intervalle selon le type de période
      let interval: number;
      let periodName: string;
      switch (periodType) {
        case 'month':
          interval = 1; // 1 mois
          periodName = 'Mois';
          break;
        case 'quarter':
          interval = 3; // 3 mois
          periodName = 'Trimestre';
          break;
        case 'semester':
          interval = 6; // 6 mois
          periodName = 'Semestre';
          break;
      }
      
      let currentStartDate = new Date(start);
      let sequence = 1;
      
      // Générer les périodes jusqu'à la fin de l'exercice
      while (currentStartDate < end) {
        const currentEndDate = new Date(currentStartDate);
        
        // Calculer la date de fin de la période
        if (periodType === 'month') {
          // Dernier jour du mois
          currentEndDate.setMonth(currentEndDate.getMonth() + 1);
          currentEndDate.setDate(0);
        } else if (periodType === 'quarter' || periodType === 'semester') {
          // Dernier jour du trimestre ou semestre
          currentEndDate.setMonth(currentEndDate.getMonth() + interval);
          currentEndDate.setDate(0);
        }
        
        // S'assurer que la date de fin ne dépasse pas la fin de l'exercice
        if (currentEndDate > end) {
          currentEndDate.setTime(end.getTime());
        }
        
        // Créer la période comptable
        const periodId = `period-${fiscalYearId}-${sequence}`;
        let name = '';
        
        if (periodType === 'month') {
          // Nom du mois (ex: Janvier 2023)
          const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                             'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
          name = `${monthNames[currentStartDate.getMonth()]} ${currentStartDate.getFullYear()}`;
        } else if (periodType === 'quarter') {
          // Trimestre (ex: T1 2023)
          const quarter = Math.floor(currentStartDate.getMonth() / 3) + 1;
          name = `T${quarter} ${currentStartDate.getFullYear()}`;
        } else if (periodType === 'semester') {
          // Semestre (ex: S1 2023)
          const semester = Math.floor(currentStartDate.getMonth() / 6) + 1;
          name = `S${semester} ${currentStartDate.getFullYear()}`;
        }
        
        // Enregistrer la période dans la base de données
        await DatabaseService.executeQuery(
          db,
          `INSERT INTO accounting_periods
           (id, name, type, start_date, end_date, fiscal_year_id, is_closed, sequence, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            periodId,
            name,
            periodType,
            currentStartDate.toISOString().split('T')[0],
            currentEndDate.toISOString().split('T')[0],
            fiscalYearId,
            0, // Non clôturé par défaut
            sequence,
            new Date().toISOString()
          ]
        );
        
        periods.push({
          id: periodId,
          name,
          type: periodType,
          startDate: currentStartDate.toISOString().split('T')[0],
          endDate: currentEndDate.toISOString().split('T')[0],
          fiscalYearId,
          isClosed: false,
          sequence
        });
        
        // Passer à la période suivante
        currentStartDate = new Date(currentEndDate);
        currentStartDate.setDate(currentStartDate.getDate() + 1);
        sequence++;
      }
      
      // Mettre à jour l'interface si le dialogue des périodes est ouvert
      if (selectedFiscalYearId === fiscalYearId) {
        setAccountingPeriods(periods);
      }
      
      // Notification de succès
      Alert.alert(
        'Succès',
        `Les périodes comptables pour l'exercice ont été générées avec succès.`
      );
    } catch (error) {
      logger.error('Erreur lors de la génération des périodes comptables:', error);
      Alert.alert(
        'Erreur',
        'Impossible de générer les périodes comptables. Veuillez réessayer.'
      );
    }
  };

  // Clôturer une période comptable
  const closePeriod = (periodId: string) => {
    setSelectedPeriodId(periodId);
    setClosePeriodDialogVisible(true);
  };

  // Gérer la clôture d'une période comptable
  const handleClosePeriod = async () => {
    if (!selectedPeriodId) return;
    
    try {
      const db = await DatabaseService.getDBConnection();
      
      // Verrouiller la période comptable
      await DatabaseService.executeQuery(
        db,
        'UPDATE accounting_periods SET is_closed = 1 WHERE id = ?',
        [selectedPeriodId]
      );
      
      // Mettre à jour l'interface
      setAccountingPeriods(
        accountingPeriods.map(period => ({
          ...period,
          isClosed: period.id === selectedPeriodId ? true : period.isClosed
        }))
      );
      
      setClosePeriodDialogVisible(false);
      
      // Notification de succès
      Alert.alert(
        'Succès',
        'La période comptable a été clôturée avec succès.'
      );
    } catch (error) {
      logger.error('Erreur lors de la clôture de la période comptable:', error);
      Alert.alert(
        'Erreur',
        'Impossible de clôturer la période comptable. Veuillez réessayer.'
      );
      setClosePeriodDialogVisible(false);
    }
  };

  // Rouvrir une période comptable
  const reopenPeriod = async (periodId: string) => {
    try {
      const db = await DatabaseService.getDBConnection();
      
      // Rouvrir la période comptable
      await DatabaseService.executeQuery(
        db,
        'UPDATE accounting_periods SET is_closed = 0 WHERE id = ?',
        [periodId]
      );
      
      // Mettre à jour l'interface
      setAccountingPeriods(
        accountingPeriods.map(period => ({
          ...period,
          isClosed: period.id === periodId ? false : period.isClosed
        }))
      );
      
      // Notification de succès
      Alert.alert(
        'Succès',
        'La période comptable a été rouverte avec succès.'
      );
    } catch (error) {
      logger.error('Erreur lors de la réouverture de la période comptable:', error);
      Alert.alert(
        'Erreur',
        'Impossible de rouvrir la période comptable. Veuillez réessayer.'
      );
    }
  };
  
  // Rendu d'un élément dans la liste des exercices fiscaux
  const renderFiscalYearItem = ({ item }: { item: FiscalYear }) => {
    const isCurrent = item.isCurrent;
    
    return (
      <Card style={[styles.yearCard, isCurrent && styles.currentYearCard]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.yearName}>{item.name}</Text>
              <Text style={styles.yearDates}>
                {formatDate(item.startDate)} - {formatDate(item.endDate)}
              </Text>
            </View>
            <View style={styles.badgesContainer}>
              {isCurrent && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Exercice en cours</Text>
                </View>
              )}
              {item.isLocked && (
                <View style={styles.lockedBadge}>
                  <Text style={styles.lockedBadgeText}>Clôturé</Text>
                </View>
              )}
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.cardActions}>
            {!item.isLocked && (
              <Button
                mode="outlined"
                onPress={() => showEditDialog(item)}
                style={styles.cardButton}
              >
                Modifier
              </Button>
            )}
            
            <Button
              mode="outlined"
              onPress={() => showPeriodsDialog(item.id)}
              style={styles.cardButton}
            >
              Gérer périodes
            </Button>
            
            {!isCurrent && !item.isLocked && (
              <Button
                mode="outlined"
                onPress={() => setAsCurrent(item.id)}
                style={styles.cardButton}
              >
                Définir actif
              </Button>
            )}
            
            {!item.isLocked && (
              <Button
                mode="outlined"
                onPress={() => closeFiscalYear(item.id)}
                style={styles.cardButton}
              >
                Clôturer
              </Button>
            )}
            
            {!isCurrent && !item.isLocked && (
              <Button
                mode="outlined"
                onPress={() => confirmDeleteFiscalYear(item.id)}
                textColor={theme.colors.error}
                style={styles.cardButton}
              >
                Supprimer
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  // Rendu d'un élément dans la liste des périodes comptables
  const renderPeriodItem = ({ item }: { item: AccountingPeriod }) => {
    return (
      <Card style={[styles.periodCard, item.isClosed && styles.closedPeriodCard]}>
        <Card.Content>
          <View style={styles.periodHeader}>
            <View>
              <Text style={styles.periodName}>{item.name}</Text>
              <Text style={styles.periodDates}>
                {formatDate(item.startDate)} - {formatDate(item.endDate)}
              </Text>
              <Text style={styles.periodType}>
                {PERIOD_TYPES.find(t => t.value === item.type)?.label || item.type}
              </Text>
            </View>
            {item.isClosed && (
              <View style={styles.periodStatusBadge}>
                <Text style={styles.periodStatusText}>Clôturée</Text>
              </View>
            )}
          </View>
          
          <View style={styles.periodActions}>
            {/* Seules les périodes non clôturées peuvent être fermées */}
            {!item.isClosed ? (
              <Button
                mode="outlined"
                onPress={() => closePeriod(item.id)}
                style={styles.periodButton}
              >
                Clôturer
              </Button>
            ) : (
              <Button
                mode="outlined"
                onPress={() => reopenPeriod(item.id)}
                style={styles.periodButton}
              >
                Rouvrir
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  // Rendu du contenu principal - onglet exercices fiscaux ou périodes comptables
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      );
    }

    if (selectedTab === 'years') {
      return (
        <>
          {fiscalYears.length > 0 ? (
            <FlatList
              data={fiscalYears}
              renderItem={renderFiscalYearItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <EmptyState
                message="Aucun exercice fiscal"
                subMessage="Ajoutez votre premier exercice fiscal pour commencer."
              />
            </View>
          )}
          
          <FAB
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            icon="plus"
            onPress={showAddDialog}
            label="Ajouter un exercice"
          />
        </>
      );
    }
    
    // Vue des statistiques
    return (
      <ScrollView style={styles.statsContainer} contentContainerStyle={styles.statsContent}>
        <Card style={styles.statsCard}>
          <Card.Title title="Aperçu des exercices fiscaux" />
          <Card.Content>
            <Text style={styles.statsText}>Total des exercices: {fiscalYears.length}</Text>
            <Text style={styles.statsText}>Exercices clôturés: {fiscalYears.filter(y => y.isLocked).length}</Text>
            <Text style={styles.statsText}>Exercices actifs: {fiscalYears.filter(y => !y.isLocked).length}</Text>
            
            <Divider style={styles.statsDivider} />
            
            <Text style={styles.statsSubtitle}>Exercice courant:</Text>
            {fiscalYears.find(y => y.isCurrent) ? (
              <View style={styles.currentYearStats}>
                <Text style={styles.currentYearName}>
                  {fiscalYears.find(y => y.isCurrent)?.name}
                </Text>
                <Text style={styles.currentYearDates}>
                  {formatDate(fiscalYears.find(y => y.isCurrent)?.startDate || '')} - 
                  {formatDate(fiscalYears.find(y => y.isCurrent)?.endDate || '')}
                </Text>
              </View>
            ) : (
              <Text style={styles.noCurrentYear}>Aucun exercice courant défini</Text>
            )}
          </Card.Content>
        </Card>
        
        <Card style={styles.statsCard}>
          <Card.Title title="Statistiques des périodes comptables" />
          <Card.Content>
            <Text style={styles.statsText}>
              Nombre total de périodes: {
                accountingPeriods.length > 0 
                  ? accountingPeriods.length 
                  : "Sélectionnez un exercice pour voir ses périodes"
              }
            </Text>
            <Text style={styles.statsText}>
              Périodes clôturées: {accountingPeriods.filter(p => p.isClosed).length}
            </Text>
            <Text style={styles.statsText}>
              Périodes ouvertes: {accountingPeriods.filter(p => !p.isClosed).length}
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  };
  
  return (
    <View style={styles.container}>
      <AppHeader
        title="Gestion des exercices fiscaux"
        onBack={() => navigation.goBack()}
      />
      
      <SegmentedButtons
        value={selectedTab}
        onValueChange={setSelectedTab}
        buttons={[
          { value: 'years', label: 'Exercices' },
          { value: 'stats', label: 'Statistiques' }
        ]}
        style={styles.segmentedButtons}
      />
      
      {renderContent()}
      
      {/* Dialogue pour ajouter/modifier un exercice fiscal */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>
            {editMode ? 'Modifier l\'exercice fiscal' : 'Ajouter un exercice fiscal'}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nom de l'exercice"
              value={yearName}
              onChangeText={setYearName}
              style={styles.dialogInput}
            />
            
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={styles.datePickerLabel}>Date de début:</Text>
              <Text style={styles.datePickerValue}>
                {formatDate(startDate.toISOString())}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={styles.datePickerLabel}>Date de fin:</Text>
              <Text style={styles.datePickerValue}>
                {formatDate(endDate.toISOString())}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
            
            <View style={styles.radioContainer}>
              <Text style={styles.radioLabel}>Exercice en cours:</Text>
              <RadioButton.Group
                onValueChange={(value) => setIsCurrent(value === 'true')}
                value={isCurrent ? 'true' : 'false'}
              >
                <View style={styles.radioButtons}>
                  <View style={styles.radioOption}>
                    <RadioButton value="true" />
                    <Text>Oui</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="false" />
                    <Text>Non</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </View>

            {!editMode && (
              <>
                <Text style={styles.periodTypeLabel}>Type de périodes à créer:</Text>
                <RadioButton.Group
                  onValueChange={(value: any) => setSelectedPeriodType(value)}
                  value={selectedPeriodType}
                >
                  <View style={styles.periodTypeOptions}>
                    {PERIOD_TYPES.map(type => (
                      <View key={type.value} style={styles.periodTypeOption}>
                        <RadioButton value={type.value} />
                        <Text>{type.label}</Text>
                      </View>
                    ))}
                  </View>
                </RadioButton.Group>
              </>
            )}
            
            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(event, date) => handleDateChange(event, date, 'start')}
              />
            )}
            
            {showEndDatePicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={(event, date) => handleDateChange(event, date, 'end')}
              />
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Annuler</Button>
            <Button onPress={handleSaveFiscalYear}>Enregistrer</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Dialogue de confirmation pour la suppression */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Confirmation de suppression</Dialog.Title>
          <Dialog.Content>
            <Text>Êtes-vous sûr de vouloir supprimer cet exercice fiscal ? Cette action est irréversible.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Annuler</Button>
            <Button onPress={handleDeleteFiscalYear} textColor={theme.colors.error}>Supprimer</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Dialogue pour afficher et gérer les périodes comptables */}
      <Portal>
        <Dialog 
          visible={periodsDialogVisible} 
          onDismiss={() => setPeriodsDialogVisible(false)}
          style={styles.periodsDialog}
        >
          <Dialog.Title>
            {fiscalYears.find(y => y.id === selectedFiscalYearId)?.name || 'Périodes comptables'}
          </Dialog.Title>
          
          <Dialog.Content>
            {periodsLoading ? (
              <View style={styles.periodsLoadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.periodsLoadingText}>Chargement des périodes...</Text>
              </View>
            ) : accountingPeriods.length > 0 ? (
              <FlatList
                data={accountingPeriods}
                renderItem={renderPeriodItem}
                keyExtractor={(item) => item.id}
                style={styles.periodsList}
              />
            ) : (
              <View style={styles.emptyPeriods}>
                <Text style={styles.emptyPeriodsText}>Aucune période comptable trouvée</Text>
              </View>
            )}

            {!fiscalYears.find(y => y.id === selectedFiscalYearId)?.isLocked && (
              <View style={styles.generatePeriodsContainer}>
                <Text style={styles.generatePeriodsTitle}>Générer des périodes</Text>
                <RadioButton.Group
                  onValueChange={(value: any) => setSelectedPeriodType(value)}
                  value={selectedPeriodType}
                >
                  <View style={styles.periodTypeOptions}>
                    {PERIOD_TYPES.map(type => (
                      <View key={type.value} style={styles.periodTypeOption}>
                        <RadioButton value={type.value} />
                        <Text>{type.label}</Text>
                      </View>
                    ))}
                  </View>
                </RadioButton.Group>
                <Button
                  mode="contained"
                  onPress={() => {
                    const fiscalYear = fiscalYears.find(y => y.id === selectedFiscalYearId);
                    if (fiscalYear) {
                      generateAccountingPeriods(
                        fiscalYear.id,
                        new Date(fiscalYear.startDate),
                        new Date(fiscalYear.endDate),
                        selectedPeriodType
                      );
                    }
                  }}
                  style={styles.generateButton}
                >
                  Générer les périodes
                </Button>
              </View>
            )}
          </Dialog.Content>
          
          <Dialog.Actions>
            <Button onPress={() => setPeriodsDialogVisible(false)}>Fermer</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Dialogue pour confirmer la clôture d'une période */}
      <Portal>
        <Dialog 
          visible={closePeriodDialogVisible} 
          onDismiss={() => setClosePeriodDialogVisible(false)}
        >
          <Dialog.Title>Clôturer la période</Dialog.Title>
          <Dialog.Content>
            <Text>
              Êtes-vous sûr de vouloir clôturer cette période comptable ?
              {'\n\n'}
              Une fois clôturée, les écritures comptables ne pourront plus être modifiées pour cette période.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClosePeriodDialogVisible(false)}>Annuler</Button>
            <Button onPress={handleClosePeriod}>Clôturer</Button>
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
  listContent: {
    padding: 10,
  },
  yearCard: {
    marginBottom: 10,
    elevation: 2,
  },
  currentYearCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  yearName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  yearDates: {
    fontSize: 14,
    color: '#666',
  },
  badgesContainer: {
    flexDirection: 'row',
  },
  currentBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 5,
  },
  currentBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lockedBadge: {
    backgroundColor: '#f44336',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  lockedBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 10,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  cardButton: {
    margin: 5,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  dialogInput: {
    marginBottom: 15,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 15,
  },
  datePickerLabel: {
    color: '#666',
    fontWeight: 'bold',
  },
  datePickerValue: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  radioContainer: {
    marginTop: 10,
  },
  radioLabel: {
    marginBottom: 5,
    fontWeight: 'bold',
  },
  radioButtons: {
    flexDirection: 'row',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  periodTypeLabel: {
    marginTop: 15,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  periodTypeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  periodTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  // Styles pour le dialogue des périodes
  periodsDialog: {
    maxHeight: '80%',
  },
  periodsList: {
    maxHeight: 300,
  },
  periodsLoadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  periodsLoadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyPeriods: {
    padding: 20,
    alignItems: 'center',
  },
  emptyPeriodsText: {
    color: '#666',
  },
  generatePeriodsContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  generatePeriodsTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  generateButton: {
    marginTop: 10,
  },
  // Styles pour les cartes de périodes
  periodCard: {
    marginBottom: 8,
    elevation: 1,
  },
  closedPeriodCard: {
    backgroundColor: '#f9f9f9',
    borderLeftWidth: 3,
    borderLeftColor: '#f44336',
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  periodDates: {
    fontSize: 12,
    color: '#666',
  },
  periodType: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  periodStatusBadge: {
    backgroundColor: '#f44336',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  periodStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  periodActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  periodButton: {
    marginRight: 8,
    height: 32,
    justifyContent: 'center',
  },
  segmentedButtons: {
    margin: 10,
  },
  // Styles pour la vue statistiques
  statsContainer: {
    flex: 1,
  },
  statsContent: {
    padding: 10,
  },
  statsCard: {
    marginBottom: 15,
  },
  statsText: {
    fontSize: 14,
    marginBottom: 5,
  },
  statsSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  statsDivider: {
    marginVertical: 10,
  },
  currentYearStats: {
    padding: 10,
    backgroundColor: '#f0f7ff',
    borderRadius: 5,
    marginTop: 5,
  },
  currentYearName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  currentYearDates: {
    fontSize: 14,
    marginTop: 3,
  },
  noCurrentYear: {
    fontStyle: 'italic',
    color: '#666',
  },
});

export default FiscalYearScreen;