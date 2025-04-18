import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  TextInput,
  Card,
  Button,
  Appbar,
  Divider,
  Chip,
  ProgressBar,
  RadioButton
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import CurrencyAmount from '../../components/common/CurrencyAmount';
import { useCurrency } from '../../hooks/useCurrency';

const typeLabels = {
  loan: 'Prêt bancaire',
  credit: 'Ligne de crédit',
  equipment: 'Financement d\'équipement',
  working_capital: 'Fonds de roulement',
  growth: 'Financement de croissance',
};

const financialInstitutions = [
  { id: 'bank1', name: 'BNP Paribas' },
  { id: 'bank2', name: 'Crédit Agricole' },
  { id: 'bank3', name: 'Société Générale' },
  { id: 'bank4', name: 'Crédit Mutuel' },
  { id: 'bank5', name: 'CIC' },
];

const FinanceRequestScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { currencyInfo } = useCurrency();
  
  // Récupérer le type de financement depuis les paramètres de la route
  const { type } = route.params as { type: string };
  
  // États pour le formulaire
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('');
  const [purpose, setPurpose] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [creditScore, setCreditScore] = useState(720); // Score entre 300 et 850
  const [loading, setLoading] = useState(false);
  
  // Calculer le taux d'intérêt estimé en fonction du score de crédit et d'autres facteurs
  useEffect(() => {
    let baseRate = 0;
    
    // Déterminer le taux de base en fonction du score de crédit
    if (creditScore >= 750) baseRate = 3.5;
    else if (creditScore >= 700) baseRate = 4.0;
    else if (creditScore >= 650) baseRate = 4.5;
    else if (creditScore >= 600) baseRate = 5.5;
    else baseRate = 7.0;
    
    // Ajuster en fonction du type de financement
    if (type === 'loan') baseRate += 0;
    else if (type === 'credit') baseRate += 0.5;
    else if (type === 'equipment') baseRate -= 0.3;
    else if (type === 'working_capital') baseRate += 1.0;
    else if (type === 'growth') baseRate += 0.7;
    
    // Ajuster en fonction de la banque sélectionnée
    if (selectedBank) {
      const bankAdjustment = {
        bank1: 0.1,
        bank2: 0,
        bank3: 0.2,
        bank4: -0.2,
        bank5: 0.1,
      }[selectedBank] || 0;
      
      baseRate += bankAdjustment;
    }
    
    setInterestRate(baseRate.toFixed(2) + '%');
  }, [creditScore, type, selectedBank]);

  const getCreditScoreColor = () => {
    if (creditScore >= 750) return '#4CAF50';
    if (creditScore >= 650) return '#FFC107';
    return '#F44336';
  };

  const getCreditScoreText = () => {
    if (creditScore >= 750) return 'Excellent';
    if (creditScore >= 700) return 'Très bien';
    if (creditScore >= 650) return 'Bon';
    if (creditScore >= 600) return 'Correct';
    if (creditScore >= 550) return 'Moyen';
    return 'À améliorer';
  };

  const getCreditScoreProgress = () => {
    return creditScore / 850;
  };

  const handleSubmit = () => {
    setLoading(true);
    
    // Simulate API request
    setTimeout(() => {
      setLoading(false);
      navigation.goBack();
      // You would typically show a success message or navigate to a confirmation screen
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={typeLabels[type] || 'Demande de financement'} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.creditScoreCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Cote de crédit</Text>
            <View style={styles.scoreRow}>
              <Text style={[styles.creditScore, { color: getCreditScoreColor() }]}>
                {creditScore}
              </Text>
              <Text style={styles.creditScoreLabel}>
                {getCreditScoreText()}
              </Text>
            </View>
            <ProgressBar
              progress={getCreditScoreProgress()}
              color={getCreditScoreColor()}
              style={styles.progressBar}
            />
          </Card.Content>
        </Card>

        <Text style={styles.sectionTitle}>Détails de la demande</Text>
        
        <TextInput
          label={`Montant demandé (${currencyInfo.symbol})`}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={styles.input}
          mode="outlined"
          left={<TextInput.Icon icon={currencyInfo.icon || "cash"} />}
        />
        
        <TextInput
          label="Durée (mois)"
          value={term}
          onChangeText={setTerm}
          keyboardType="numeric"
          style={styles.input}
          mode="outlined"
          left={<TextInput.Icon icon="calendar-month" />}
        />
        
        <TextInput
          label="Objet du financement"
          value={purpose}
          onChangeText={setPurpose}
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={3}
          left={<TextInput.Icon icon="information-outline" />}
        />

        <Divider style={styles.divider} />

        <Text style={styles.sectionTitle}>Institution financière</Text>
        <Text style={styles.sectionSubtitle}>Sélectionnez votre partenaire financier</Text>
        
        <View style={styles.chipsContainer}>
          {financialInstitutions.map(bank => (
            <Chip
              key={bank.id}
              selected={selectedBank === bank.id}
              onPress={() => setSelectedBank(bank.id)}
              style={[
                styles.chip,
                selectedBank === bank.id && { backgroundColor: Colors.primary + '20' }
              ]}
              textStyle={selectedBank === bank.id ? { color: Colors.primary } : {}}
            >
              {bank.name}
            </Chip>
          ))}
        </View>

        <Divider style={styles.divider} />

        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Type de financement</Text>
              <Text style={styles.summaryValue}>{typeLabels[type] || type}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taux d'intérêt estimé</Text>
              <Text style={styles.interestRate}>{interestRate}</Text>
            </View>
            {amount && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Montant demandé</Text>
                <CurrencyAmount
                  amount={parseInt(amount)}
                  style={styles.summaryValue}
                />
              </View>
            )}
            {term && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Durée</Text>
                <Text style={styles.summaryValue}>{term} mois</Text>
              </View>
            )}
          </Card.Content>
        </Card>
        
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          loading={loading}
          disabled={!amount || !term || !selectedBank || !purpose}
        >
          Soumettre la demande
        </Button>
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
  creditScoreCard: {
    marginBottom: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  creditScore: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 12,
  },
  creditScoreLabel: {
    fontSize: 16,
    color: '#333',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 16,
    color: Colors.primary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    margin: 4,
  },
  radioContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
  },
  radioItem: {
    paddingVertical: 4,
    paddingLeft: 0,
  },
  summaryCard: {
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#757575',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  interestRate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  submitButton: {
    marginVertical: 24,
    paddingVertical: 6,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
});

export default FinanceRequestScreen;