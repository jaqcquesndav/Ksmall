import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CurrencyService, { ExchangeRate, Currency } from '../../services/CurrencyService';
import { TextInput } from 'react-native-paper';
import { useThemeContext } from '../../context/ThemeContext';
import { ScrollView } from 'react-native-gesture-handler';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import logger from '../../utils/logger';

const ExchangeRateScreen: React.FC = () => {
  const { theme } = useThemeContext();
  const navigation = useNavigation();

  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [selectedRate, setSelectedRate] = useState<ExchangeRate | null>(null);
  const [newRate, setNewRate] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Liste des paires de devises que nous voulons afficher/modifier
  const currencyPairs: [Currency, Currency][] = [
    ['XOF', 'USD'],
    ['XOF', 'CDF'],
    ['USD', 'CDF'],
  ];

  useEffect(() => {
    loadExchangeRates();
  }, []);

  const loadExchangeRates = async () => {
    try {
      setLoading(true);
      const allRates = await CurrencyService.getAllExchangeRates();
      setRates(allRates);
      setLoading(false);
    } catch (error) {
      logger.error('Erreur lors du chargement des taux de change:', error);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadExchangeRates();
    setRefreshing(false);
  };

  const handleEditRate = (rate: ExchangeRate) => {
    setSelectedRate(rate);
    setNewRate(rate.rate.toString());
    setEditMode(true);
  };

  const handleSaveRate = async () => {
    if (!selectedRate) return;

    try {
      const rateValue = parseFloat(newRate.replace(',', '.'));
      
      if (isNaN(rateValue) || rateValue <= 0) {
        Alert.alert(
          'Valeur invalide', 
          'Veuillez entrer un nombre positif valide pour le taux de change.'
        );
        return;
      }

      const success = await CurrencyService.updateExchangeRate(
        selectedRate.fromCurrency,
        selectedRate.toCurrency,
        rateValue
      );

      if (success) {
        // Recharger les taux après la mise à jour
        await loadExchangeRates();
        setEditMode(false);
        setSelectedRate(null);
        Alert.alert('Succès', 'Taux de change mis à jour avec succès');
      } else {
        Alert.alert('Erreur', 'Impossible de mettre à jour le taux de change');
      }
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du taux:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la mise à jour du taux');
    }
  };

  const cancelEdit = () => {
    setEditMode(false);
    setSelectedRate(null);
  };

  const formatDate = (timestamp: number) => {
    try {
      // Utiliser le locale français
      return format(new Date(timestamp), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch (error) {
      return 'Date inconnue';
    }
  };

  // Récupère un taux spécifique à partir de la liste complète
  const findRate = (fromCurrency: Currency, toCurrency: Currency): ExchangeRate | undefined => {
    return rates.find(r => 
      r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
    );
  };

  const renderRateItem = (fromCurrency: Currency, toCurrency: Currency) => {
    const rate = findRate(fromCurrency, toCurrency);
    
    if (!rate) {
      return (
        <View style={[styles.rateCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.rateText, { color: theme.textColor }]}>
            Taux non disponible
          </Text>
        </View>
      );
    }

    if (editMode && selectedRate?.fromCurrency === fromCurrency && selectedRate?.toCurrency === toCurrency) {
      return (
        <View style={[styles.rateCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.rateHeader}>
            <Text style={[styles.rateTitle, { color: theme.textColor }]}>
              {rate.fromCurrency} → {rate.toCurrency}
            </Text>
          </View>
          
          <View style={styles.editContainer}>
            <TextInput
              label="Nouveau taux"
              value={newRate}
              onChangeText={setNewRate}
              keyboardType="decimal-pad"
              style={styles.input}
              mode="outlined"
              dense
            />
            <Text style={[styles.conversionExample, { color: theme.textSecondary }]}>
              1 {rate.fromCurrency} = {newRate} {rate.toCurrency}
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleSaveRate} style={[styles.button, { backgroundColor: theme.primaryColor }]}>
              <Text style={styles.buttonText}>Enregistrer</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={cancelEdit} style={[styles.button, { backgroundColor: theme.errorColor }]}>
              <Text style={styles.buttonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity 
        style={[styles.rateCard, { backgroundColor: theme.cardBackground }]}
        onPress={() => handleEditRate(rate)}
        disabled={editMode}
      >
        <View style={styles.rateHeader}>
          <Text style={[styles.rateTitle, { color: theme.textColor }]}>
            {rate.fromCurrency} → {rate.toCurrency}
          </Text>
          {!editMode && (
            <TouchableOpacity onPress={() => handleEditRate(rate)}>
              <MaterialCommunityIcons name="pencil" size={18} color={theme.primaryColor} />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={[styles.rateValue, { color: theme.textColor }]}>
          1 {rate.fromCurrency} = {rate.rate} {rate.toCurrency}
        </Text>
        
        <Text style={[styles.lastUpdate, { color: theme.textSecondary }]}>
          Dernière mise à jour: {formatDate(rate.lastUpdated)}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textColor }]}>
          Gestion des taux de change
        </Text>
        
        {!editMode && (
          <TouchableOpacity onPress={handleRefresh}>
            <Ionicons name="refresh" size={24} color={theme.primaryColor} />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        Les taux de change sont utilisés pour convertir les montants entre différentes devises dans les rapports financiers.
      </Text>
      
      <ScrollView style={styles.rateList}>
        {currencyPairs.map(([from, to]) => (
          <React.Fragment key={`${from}-${to}`}>
            {renderRateItem(from, to)}
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  description: {
    marginBottom: 16,
    fontSize: 14,
  },
  rateList: {
    flex: 1,
  },
  rateCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  rateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rateTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  rateText: {
    fontSize: 16,
  },
  rateValue: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  lastUpdate: {
    fontSize: 12,
  },
  editContainer: {
    marginVertical: 12,
  },
  input: {
    marginBottom: 8,
  },
  conversionExample: {
    fontSize: 14,
    marginVertical: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ExchangeRateScreen;