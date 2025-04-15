import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Divider, Chip, ProgressBar, Card, Appbar, useTheme } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';

type FinanceRequestRouteProp = RouteProp<RootStackParamList, 'FinanceRequest'>;

const FinanceRequestScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<FinanceRequestRouteProp>();
  const { type, creditScore = 700 } = route.params;
  
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('12');
  const [purpose, setPurpose] = useState('');
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [interestRate, setInterestRate] = useState<string>('');
  
  const typeLabels: Record<string, string> = {
    lineOfCredit: 'Ligne de crédit',
    businessLoan: 'Crédit entreprise',
    shortTermLoan: 'Crédit court terme',
    equipmentLease: 'Leasing équipement',
  };

  const financialInstitutions = [
    { id: 'bank1', name: 'Banque Nationale' },
    { id: 'bank2', name: 'Société Générale' },
    { id: 'bank3', name: 'Crédit du Nord' },
    { id: 'bank4', name: 'BNP Paribas' },
    { id: 'bank5', name: 'Crédit Agricole' },
  ];

  useEffect(() => {
    // Calculate interest rate based on credit score and loan type
    // This would normally come from a backend API
    let baseRate = 0;
    
    switch (type) {
      case 'lineOfCredit':
        baseRate = creditScore > 700 ? 4.5 : creditScore > 600 ? 6.9 : 9.9;
        break;
      case 'businessLoan':
        baseRate = creditScore > 700 ? 5.2 : creditScore > 600 ? 7.5 : 10.5;
        break;
      case 'shortTermLoan':
        baseRate = creditScore > 700 ? 5.9 : creditScore > 600 ? 8.9 : 11.9;
        break;
      case 'equipmentLease':
        baseRate = creditScore > 700 ? 3.9 : creditScore > 600 ? 5.9 : 8.9;
        break;
    }
    
    // Add minor variation based on selected bank
    if (selectedBank) {
      const bankAdjustment = {
        bank1: -0.3,
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
          label="Montant demandé (€)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={styles.input}
          mode="outlined"
          left={<TextInput.Icon icon="currency-eur" />}
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
                <Text style={styles.summaryValue}>{parseInt(amount).toLocaleString()} €</Text>
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
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  creditScore: {
    fontSize: 32,
    fontWeight: 'bold',
    marginRight: 12,
  },
  creditScoreLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#757575',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    margin: 4,
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
});

export default FinanceRequestScreen;