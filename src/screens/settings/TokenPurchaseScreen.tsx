import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, RadioButton, Portal, Modal, TextInput, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppHeader from '../../components/common/AppHeader';
import * as DocumentPicker from 'expo-document-picker';
import { formatNumber } from '../../utils/formatters';
import TokenService from '../../services/TokenService';
import { useCurrency } from '../../hooks/useCurrency';
import ManualPaymentModal, { ManualPaymentDetails } from '../../components/payment/ManualPaymentModal';
import CurrencyAmount from '../../components/common/CurrencyAmount';

const TokenPurchaseScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const theme = useTheme();
  const { formatAmount, currencyInfo } = useCurrency();
  
  const [selectedPlan, setSelectedPlan] = useState('plan2');
  const [paymentMethod, setPaymentMethod] = useState('creditCard');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [manualPaymentModalVisible, setManualPaymentModalVisible] = useState(false);
  const [tokenPlans, setTokenPlans] = useState<any[]>([
    // Default values to prevent undefined errors
    { id: 'plan1', tokens: 500000, price: 10000, label: 'Basic' },
    { id: 'plan2', tokens: 1000000, price: 18000, label: 'Standard' },
    { id: 'plan3', tokens: 2500000, price: 40000, label: 'Premium' },
    { id: 'plan4', tokens: 5000000, price: 75000, label: 'Enterprise' },
  ]);

  // Charger les plans de tokens avec le service
  useEffect(() => {
    const loadTokenPlans = async () => {
      try {
        const plans = await TokenService.getTokenPlans();
        if (plans && plans.length > 0) {
          setTokenPlans(plans);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des plans de tokens:', error);
        // Les plans par défaut sont déjà définis dans useState
      }
    };
    
    loadTokenPlans();
  }, []);

  const getSelectedPlan = () => {
    const plan = tokenPlans.find(plan => plan.id === selectedPlan);
    return plan || tokenPlans[0] || { id: 'default', tokens: 0, price: 0, label: 'Default' };
  };

  const handleInitiatePurchase = () => {
    if (paymentMethod === 'manualPayment') {
      setManualPaymentModalVisible(true);
    } else {
      setPaymentModalVisible(true);
    }
  };

  const handleManualPaymentComplete = async (paymentDetails: ManualPaymentDetails) => {
    try {
      // Dans une implémentation réelle, vous appelleriez votre service de paiement
      const plan = getSelectedPlan();
      
      // Exemple d'utilisation du service de tokens pour vérifier l'achat
      const success = await TokenService.verifyTokenPurchase(
        plan.id,
        plan.tokens,
        paymentDetails.smsVerificationCode,
        paymentDetails.proofDocument
      );
      
      if (success) {
        Alert.alert(
          'Paiement validé',
          `${formatNumber(plan.tokens)} tokens ont été ajoutés à votre compte.`,
          [
            { 
              text: 'OK', 
              onPress: () => {
                setManualPaymentModalVisible(false);
                navigation.navigate('MainTabs', { screen: 'Dashboard' });
              }
            }
          ]
        );
      } else {
        Alert.alert('Erreur de validation', 'Impossible de valider votre paiement. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur lors du traitement du paiement manuel:', error);
      Alert.alert('Erreur', 'Une erreur s\'est produite lors du traitement de votre paiement.');
    }
  };

  const handleProcessPayment = () => {
    if (paymentMethod === 'manualPayment') {
      // Cette partie est maintenant gérée par le modal de paiement manuel
      return;
    }

    // Simuler un paiement pour les autres méthodes
    Alert.alert(
      'Paiement en cours',
      'Redirection vers la passerelle de paiement...',
      [
        { 
          text: 'Simuler un paiement réussi', 
          onPress: () => {
            const plan = getSelectedPlan();
            Alert.alert(
              'Paiement réussi', 
              `${formatNumber(plan.tokens)} tokens ont été ajoutés à votre compte.`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setPaymentModalVisible(false);
                    navigation.navigate('MainTabs', { screen: 'Dashboard' });
                  }
                }
              ]
            );
          }
        },
        {
          text: 'Annuler',
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        title={t('token_purchase')}
        showBack
      />
      
      <ScrollView style={styles.scrollView}>
        {/* Plans de tokens */}
        <Text style={styles.sectionTitle}>Sélectionnez un plan</Text>
        <View style={styles.plansContainer}>
          {tokenPlans.map((plan) => (
            <Card
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.selectedPlanCard
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              <Card.Content>
                <Text style={styles.planLabel}>{plan.label}</Text>
                <Text style={styles.planTokens}>{formatNumber(plan.tokens)} tokens</Text>
                <CurrencyAmount 
                  amount={plan.price} 
                  style={styles.planPrice}
                />
              </Card.Content>
            </Card>
          ))}
        </View>
        
        {/* Méthodes de paiement */}
        <Text style={styles.sectionTitle}>Méthode de paiement</Text>
        <Card style={styles.card}>
          <Card.Content>
            <RadioButton.Group onValueChange={value => setPaymentMethod(value)} value={paymentMethod}>
              <View style={styles.paymentOption}>
                <RadioButton value="creditCard" />
                <MaterialCommunityIcons name="credit-card" size={24} color="#555" style={styles.paymentIcon} />
                <Text>{t('creditCard')}</Text>
              </View>
              
              <View style={styles.paymentOption}>
                <RadioButton value="bankTransfer" />
                <MaterialCommunityIcons name="bank" size={24} color="#555" style={styles.paymentIcon} />
                <Text>{t('bankTransfer')}</Text>
              </View>

              <View style={styles.paymentOption}>
                <RadioButton value="manualPayment" />
                <MaterialCommunityIcons name="file-document-outline" size={24} color="#555" style={styles.paymentIcon} />
                <Text>{t('manualPayment')}</Text>
              </View>
            </RadioButton.Group>
          </Card.Content>
        </Card>
        
        {/* Bouton d'achat */}
        <Button
          mode="contained"
          onPress={handleInitiatePurchase}
          style={styles.purchaseButton}
        >
          {t('purchase_tokens')}
        </Button>
      </ScrollView>

      {/* Modal de paiement standard */}
      <Portal>
        <Modal
          visible={paymentModalVisible}
          onDismiss={() => setPaymentModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>{t('payment_details')}</Text>
          
          <Text style={styles.modalText}>
            Vous êtes sur le point d'acheter {formatNumber(getSelectedPlan().tokens)} tokens pour{' '}
            <CurrencyAmount amount={getSelectedPlan().price} />
          </Text>
          
          <Text style={styles.paymentMethodTitle}>Méthode de paiement sélectionnée:</Text>
          <RadioButton.Group onValueChange={value => setPaymentMethod(value)} value={paymentMethod}>
            <View style={styles.paymentOption}>
              <RadioButton value="creditCard" />
              <MaterialCommunityIcons name="credit-card" size={24} color="#555" style={styles.paymentIcon} />
              <Text>{t('creditCard')}</Text>
            </View>
            
            <View style={styles.paymentOption}>
              <RadioButton value="bankTransfer" />
              <MaterialCommunityIcons name="bank" size={24} color="#555" style={styles.paymentIcon} />
              <Text>{t('bankTransfer')}</Text>
            </View>

            <View style={styles.paymentOption}>
              <RadioButton value="manualPayment" />
              <MaterialCommunityIcons name="file-document-outline" size={24} color="#555" style={styles.paymentIcon} />
              <Text>{t('manualPayment')}</Text>
            </View>
          </RadioButton.Group>
          
          <Button
            mode="contained"
            onPress={handleProcessPayment}
            style={styles.payButton}
          >
            {t('proceed_to_payment')}
          </Button>
          
          <Button
            mode="text"
            onPress={() => setPaymentModalVisible(false)}
            style={styles.cancelButton}
          >
            {t('cancel')}
          </Button>
        </Modal>
      </Portal>

      {/* Modal de paiement manuel utilisant le composant réutilisable */}
      <ManualPaymentModal
        visible={manualPaymentModalVisible}
        onDismiss={() => setManualPaymentModalVisible(false)}
        onPaymentComplete={handleManualPaymentComplete}
        title="Achat de Tokens - Paiement Manuel"
        amount={getSelectedPlan()?.price || 0}
        description={`Achat de ${formatNumber(getSelectedPlan()?.tokens || 0)} tokens`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: 16,
    marginBottom: 12,
  },
  plansContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  planCard: {
    width: '45%',
    margin: 8,
  },
  selectedPlanCard: {
    borderColor: '#6200EE',
    borderWidth: 2,
  },
  planLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  planTokens: {
    fontSize: 14,
    marginTop: 4,
    color: '#666',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#6200EE',
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentIcon: {
    marginHorizontal: 8,
  },
  purchaseButton: {
    margin: 16,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalText: {
    marginBottom: 20,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  payButton: {
    marginTop: 20,
  },
  cancelButton: {
    marginTop: 10,
  }
});

export default TokenPurchaseScreen;
