import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Title, Chip, useTheme, Divider, ActivityIndicator, RadioButton, TextInput, Portal, Modal } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import AppHeader from '../../components/common/AppHeader';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
  recommended?: boolean;
}

const SubscriptionScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string>('premium');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('creditCard');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [manualPaymentStep, setManualPaymentStep] = useState(1);
  const [proofDocument, setProofDocument] = useState<any>(null);
  const [smsCode, setSmsCode] = useState('');

  useEffect(() => {
    const loadPlans = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        setSubscriptionPlans([
          {
            id: 'basic',
            name: 'Basique',
            price: 4900,
            billingCycle: 'month',
            features: ['Comptabilité de base', '5 utilisateurs', 'Support email']
          },
          {
            id: 'premium',
            name: 'Premium',
            price: 9900,
            billingCycle: 'month',
            features: ['Comptabilité avancée', 'Utilisateurs illimités', 'Support prioritaire', 'Rapports personnalisés'],
            recommended: true
          },
          {
            id: 'enterprise',
            name: 'Entreprise',
            price: 18900,
            billingCycle: 'month',
            features: ['Tout dans Premium', 'API dédiée', 'Assistance 24/7', 'Formations personnalisées']
          }
        ]);
      } catch (error) {
        console.error('Erreur lors du chargement des plans:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlans();
  }, []);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setPaymentModalVisible(true);
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled === false) {
        setProofDocument(result.assets[0]);
        setManualPaymentStep(2);
        Alert.alert(
          'Justificatif reçu',
          'Votre justificatif a été reçu. Un code SMS va vous être envoyé pour confirmer le paiement.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner le document');
    }
  };

  const handleVerifyCode = () => {
    if (smsCode.trim() === '') {
      Alert.alert('Erreur', 'Veuillez entrer le code reçu par SMS');
      return;
    }

    if (smsCode === '123456') {
      Alert.alert(
        'Paiement validé',
        'Votre paiement a été validé avec succès. Votre abonnement est maintenant actif.',
        [
          {
            text: 'OK',
            onPress: () => {
              setPaymentModalVisible(false);
              setManualPaymentStep(1);
              setSmsCode('');
              setProofDocument(null);
              setCurrentPlan(selectedPlan?.id || currentPlan);
            }
          }
        ]
      );
    } else {
      Alert.alert('Code incorrect', 'Le code que vous avez entré est incorrect. Veuillez réessayer.');
    }
  };

  const handleClosePaymentModal = () => {
    setPaymentModalVisible(false);
    setManualPaymentStep(1);
    setSmsCode('');
    setProofDocument(null);
  };

  const handleProcessPayment = () => {
    if (paymentMethod === 'manualPayment') {
      return;
    }

    Alert.alert(
      'Paiement en cours',
      'Redirection vers la passerelle de paiement...',
      [
        {
          text: 'Simuler un paiement réussi',
          onPress: () => {
            Alert.alert('Paiement réussi', 'Votre abonnement a été activé avec succès.');
            setPaymentModalVisible(false);
            setCurrentPlan(selectedPlan?.id || currentPlan);
          }
        },
        {
          text: 'Annuler',
          style: 'cancel'
        }
      ]
    );
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isCurrentPlan = plan.id === currentPlan;

    return (
      <Card
        key={plan.id}
        style={[
          styles.planCard,
          plan.recommended ? styles.recommendedCard : null,
          isCurrentPlan ? styles.currentPlanCard : null
        ]}
      >
        {plan.recommended && (
          <Chip
            style={styles.recommendedChip}
            textStyle={{ color: 'white' }}
          >
            {t('recommended')}
          </Chip>
        )}

        {isCurrentPlan && (
          <Chip
            style={styles.currentPlanChip}
            textStyle={{ color: 'white' }}
          >
            {t('current_plan')}
          </Chip>
        )}

        <Card.Content>
          <Title style={styles.planTitle}>{plan.name}</Title>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{plan.price.toLocaleString()} FCFA</Text>
            <Text style={styles.billingCycle}>/ {t(plan.billingCycle)}</Text>
          </View>

          <Divider style={{ marginVertical: 16 }} />

          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.primary} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </Card.Content>

        <Card.Actions style={styles.cardActions}>
          <Button
            mode={isCurrentPlan ? "contained" : "outlined"}
            style={styles.actionButton}
            disabled={isCurrentPlan}
            onPress={() => handleSelectPlan(plan)}
          >
            {isCurrentPlan ? t('current') : t('select')}
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  const renderManualPaymentStep = () => {
    switch (manualPaymentStep) {
      case 1:
        return (
          <View>
            <Text style={styles.modalText}>
              Pour effectuer un paiement manuel, veuillez télécharger un justificatif de paiement (reçu, capture d'écran, etc).
            </Text>
            <View style={styles.proofContainer}>
              {proofDocument ? (
                <View style={styles.documentInfo}>
                  <MaterialCommunityIcons name="file-document-outline" size={24} color={theme.colors.primary} />
                  <Text style={styles.documentName} numberOfLines={1}>{proofDocument.name}</Text>
                </View>
              ) : null}
              <Button
                mode="contained"
                onPress={handlePickDocument}
                style={styles.uploadButton}
              >
                {proofDocument ? t('change_document') : t('upload_document')}
              </Button>
            </View>
          </View>
        );
      case 2:
        return (
          <View>
            <Text style={styles.modalText}>
              Veuillez entrer le code de confirmation qui vous a été envoyé par SMS pour valider votre paiement.
            </Text>
            <TextInput
              label={t('sms_code')}
              value={smsCode}
              onChangeText={setSmsCode}
              style={styles.codeInput}
              keyboardType="numeric"
              maxLength={6}
            />
            <Button
              mode="contained"
              onPress={handleVerifyCode}
              style={styles.verifyButton}
            >
              {t('verify_code')}
            </Button>
          </View>
        );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <AppHeader title={t('subscriptions')} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title={t('subscriptions')} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>{t('choose_subscription_plan')}</Text>
        <Text style={styles.subheading}>{t('subscription_description')}</Text>

        {subscriptionPlans.map(renderPlanCard)}

        <View style={styles.infoContainer}>
          <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.infoText}>{t('subscription_info')}</Text>
        </View>
      </ScrollView>

      <Portal>
        <Modal
          visible={paymentModalVisible}
          onDismiss={handleClosePaymentModal}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>{t('select_payment_method')}</Title>

          <RadioButton.Group onValueChange={value => setPaymentMethod(value)} value={paymentMethod}>
            <View style={styles.paymentOption}>
              <RadioButton value="creditCard" />
              <MaterialCommunityIcons name="credit-card" size={24} color="#555" style={styles.paymentIcon} />
              <Text>{t('creditCard')}</Text>
            </View>

            <View style={styles.paymentOption}>
              <RadioButton value="mobilePayment" />
              <MaterialCommunityIcons name="cellphone" size={24} color="#555" style={styles.paymentIcon} />
              <Text>{t('mobilePayment')}</Text>
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

          <Divider style={styles.divider} />

          {paymentMethod === 'manualPayment' ? (
            renderManualPaymentStep()
          ) : (
            <Button
              mode="contained"
              onPress={handleProcessPayment}
              style={styles.payButton}
            >
              {t('proceed_to_payment')}
            </Button>
          )}

          <Button
            mode="text"
            onPress={handleClosePaymentModal}
            style={styles.cancelButton}
          >
            {t('cancel')}
          </Button>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  planCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  recommendedCard: {
    borderWidth: 2,
    borderColor: '#6200ee',
  },
  currentPlanCard: {
    backgroundColor: '#f0f8ff',
  },
  recommendedChip: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: '#6200ee',
  },
  currentPlanChip: {
    position: 'absolute',
    top: -12,
    left: 16,
    backgroundColor: '#00897b',
  },
  planTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  billingCycle: {
    fontSize: 14,
    marginLeft: 4,
    color: '#666',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
  },
  cardActions: {
    justifyContent: 'center',
    paddingBottom: 16,
  },
  actionButton: {
    width: '80%',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8eaf6',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentIcon: {
    marginHorizontal: 10,
  },
  divider: {
    marginVertical: 15,
  },
  payButton: {
    marginTop: 10,
  },
  cancelButton: {
    marginTop: 10,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  proofContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  uploadButton: {
    marginTop: 10,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    width: '100%',
  },
  documentName: {
    marginLeft: 10,
    flex: 1,
  },
  codeInput: {
    marginVertical: 10,
  },
  verifyButton: {
    marginTop: 10,
  },
});

export default SubscriptionScreen;