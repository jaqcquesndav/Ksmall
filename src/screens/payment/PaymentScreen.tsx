import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../../context/ThemeContext';
import { validateNumeric } from '../../utils/validation';

const PaymentScreen = () => {
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [errors, setErrors] = useState({ amount: '', recipient: '' });
  const [processing, setProcessing] = useState(false);

  const paymentMethods = [
    { id: 'orange_money', name: 'Orange Money', icon: require('../../../assets/orange-money-icon.png') },
    { id: 'mtn_momo', name: 'MTN Mobile Money', icon: require('../../../assets/mtn-momo-icon.png') },
    { id: 'mpesa', name: 'M-Pesa', icon: require('../../../assets/mpesa-icon.png') },
    { id: 'cash', name: 'Cash', icon: require('../../../assets/cash-icon.png') },
  ];

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
  
  const formatAmount = (text: string) => {
    // Remove non-numeric characters except decimal point
    let formattedText = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const decimalCount = (formattedText.match(/\./g) || []).length;
    if (decimalCount > 1) {
      const parts = formattedText.split('.');
      formattedText = parts[0] + '.' + parts.slice(1).join('');
    }
    
    setAmount(formattedText);
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
                onChangeText={formatAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.text + '50'}
              />
              <Text style={[styles.currency, { color: theme.colors.text }]}>XAF</Text>
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
