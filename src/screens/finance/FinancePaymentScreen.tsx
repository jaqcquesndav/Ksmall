import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Divider, 
  Chip, 
  RadioButton, 
  Card, 
  Appbar, 
  useTheme, 
  List 
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';

type FinancePaymentRouteProp = RouteProp<RootStackParamList, 'FinancePayment'>;

const FinancePaymentScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<FinancePaymentRouteProp>();
  const { type } = route.params;

  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  
  const typeLabels: Record<string, string> = {
    supplierPayment: 'Paiement fournisseur',
    loanRepayment: 'Remboursement de crédit',
    leasePayment: 'Mensualité leasing',
    quickTreasury: 'Trésorerie rapide',
  };

  const financialInstitutions = [
    { id: 'bank1', name: 'Banque Nationale' },
    { id: 'bank2', name: 'Société Générale' },
    { id: 'bank3', name: 'Crédit du Nord' },
    { id: 'bank4', name: 'BNP Paribas' },
    { id: 'bank5', name: 'Crédit Agricole' },
  ];

  const paymentMethods = [
    { id: 'bankTransfer', label: 'Virement bancaire', icon: 'bank-transfer' },
    { id: 'credit', label: 'Carte de crédit', icon: 'credit-card' },
    { id: 'check', label: 'Chèque', icon: 'checkbox-marked-circle' },
    { id: 'directDebit', label: 'Prélèvement automatique', icon: 'calendar-repeat' },
  ];

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
        <Appbar.Content title={typeLabels[type] || 'Paiement'} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Détails du paiement</Text>
            
            <TextInput
              label="Montant (€)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="currency-eur" />}
            />
            
            <TextInput
              label="Référence"
              value={reference}
              onChangeText={setReference}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="pound" />}
            />
            
            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="information-outline" />}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
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
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Méthode de paiement</Text>
            <RadioButton.Group onValueChange={value => setSelectedPaymentMethod(value)} value={selectedPaymentMethod}>
              {paymentMethods.map(method => (
                <List.Item
                  key={method.id}
                  title={method.label}
                  left={() => (
                    <View style={styles.radioContainer}>
                      <RadioButton value={method.id} color={Colors.primary} />
                    </View>
                  )}
                  right={() => <MaterialIcons name={method.icon as any} size={24} color={Colors.primary} />}
                  style={styles.radioItem}
                />
              ))}
            </RadioButton.Group>
          </Card.Content>
        </Card>

        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Type d'opération</Text>
              <Text style={styles.summaryValue}>{typeLabels[type] || type}</Text>
            </View>
            {amount && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Montant</Text>
                <Text style={styles.summaryValue}>{parseInt(amount).toLocaleString()} €</Text>
              </View>
            )}
            {selectedBank && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Institution</Text>
                <Text style={styles.summaryValue}>{
                  financialInstitutions.find(bank => bank.id === selectedBank)?.name
                }</Text>
              </View>
            )}
            {selectedPaymentMethod && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Méthode de paiement</Text>
                <Text style={styles.summaryValue}>{
                  paymentMethods.find(method => method.id === selectedPaymentMethod)?.label
                }</Text>
              </View>
            )}
          </Card.Content>
        </Card>
        
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          loading={loading}
          disabled={!amount || !selectedBank || !selectedPaymentMethod}
        >
          Effectuer le paiement
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
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
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
  submitButton: {
    marginVertical: 24,
    paddingVertical: 6,
  },
});

export default FinancePaymentScreen;