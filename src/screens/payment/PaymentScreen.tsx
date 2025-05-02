import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  SafeAreaView, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  TextInput
} from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator } from 'react-native-paper';
import useCurrency from '../../hooks/useCurrency';
import { validateNumeric } from '../../utils/validation';

// Imports ES Modules pour les icônes de paiement
import orangeMoneyIcon from '../../../assets/orange-money-icon.png';
import mtnMomoIcon from '../../../assets/mtn-momo-icon.png';
import mpesaIcon from '../../../assets/mpesa-icon.png';
import cashIcon from '../../../assets/cash-icon.png';

const paymentMethods = [
  { id: 'orange_money', name: 'Orange Money', icon: orangeMoneyIcon },
  { id: 'mtn_momo', name: 'MTN Mobile Money', icon: mtnMomoIcon },
  { id: 'mpesa', name: 'M-Pesa', icon: mpesaIcon },
  { id: 'cash', name: 'Cash', icon: cashIcon },
];

const PaymentScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { formatAmount, currencyInfo, loading: currencyLoading } = useCurrency();
  
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [errors, setErrors] = useState({ amount: '', recipient: '' });
  const [processing, setProcessing] = useState(false);

  // Fonction de formatage pour l'entrée de montant
  const handleAmountChange = useCallback((text: string) => {
    // Conserver uniquement les chiffres et le point décimal
    const formattedText = text.replace(/[^0-9.]/g, '');
    
    // S'assurer qu'il n'y a qu'un seul point décimal
    const decimalCount = (formattedText.match(/\./g) || []).length;
    if (decimalCount > 1) {
      const parts = formattedText.split('.');
      setAmount(parts[0] + '.' + parts.slice(1).join(''));
    } else {
      setAmount(formattedText);
    }
  }, []);

  const handlePayment = () => {
    // Form validation
    let isValid = true;
    const newErrors = { amount: '', recipient: '' };
    
    if (!validateNumeric(amount) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Montant invalide';
      isValid = false;
    }
    
    if (!recipient.trim()) {
      newErrors.recipient = 'Destinataire requis';
      isValid = false;
    }
    
    if (!selectedMethod) {
      Alert.alert('Erreur', 'Veuillez sélectionner un mode de paiement');
      isValid = false;
    }
    
    setErrors(newErrors);
    
    if (!isValid) return;
    
    setProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      Alert.alert(
        'Paiement réussi',
        `Paiement de ${amount} XAF à ${recipient} effectué avec succès.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          }
        ]
      );
    }, 2000);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Envoyer un paiement</Text>
        <View style={styles.placeholderButton} />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView style={styles.content}>
          <View style={styles.amountContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Montant</Text>
            <View style={styles.amountInputContainer}>
              <TextInput
                style={[styles.amountInput, { color: theme.colors.text }]}
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.text + '50'}
              />
              <Text style={[styles.currency, { color: theme.colors.text }]}>
                {currencyLoading ? '...' : currencyInfo?.symbol || 'XOF'}
              </Text>
            </View>
            {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Destinataire</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }
              ]}
              value={recipient}
              onChangeText={setRecipient}
              placeholder="Nom ou numéro de téléphone"
              placeholderTextColor={theme.colors.text + '50'}
            />
            {errors.recipient ? <Text style={styles.errorText}>{errors.recipient}</Text> : null}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Note (optionnel)</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }
              ]}
              value={note}
              onChangeText={setNote}
              placeholder="Ajouter une note"
              placeholderTextColor={theme.colors.text + '50'}
              multiline
            />
          </View>
          
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Mode de paiement</Text>
          
          <View style={styles.paymentMethodContainer}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  { 
                    backgroundColor: theme.colors.card,
                    borderColor: selectedMethod === method.id ? theme.colors.primary : theme.colors.border
                  }
                ]}
                onPress={() => setSelectedMethod(method.id)}
              >
                <Image source={method.icon} style={styles.paymentIcon} />
                <Text style={[styles.paymentMethodText, { color: theme.colors.text }]}>{method.name}</Text>
                {selectedMethod === method.id && (
                  <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        
        <View style={[styles.footer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[
              styles.payButton,
              { backgroundColor: theme.colors.primary },
              (!amount || !recipient || !selectedMethod || processing) && { opacity: 0.6 }
            ]}
            onPress={handlePayment}
            disabled={!amount || !recipient || !selectedMethod || processing}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#FFFFFF" style={styles.payButtonIcon} />
                <Text style={styles.payButtonText}>Envoyer le paiement</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholderButton: {
    width: 40,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  amountInput: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: 120,
  },
  currency: {
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  paymentMethod: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    position: 'relative',
  },
  paymentIcon: {
    width: 50,
    height: 50,
    marginBottom: 8,
    resizeMode: 'contain',
  },
  paymentMethodText: {
    fontSize: 14,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 55,
    borderRadius: 12,
  },
  payButtonIcon: {
    marginRight: 8,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentScreen;
