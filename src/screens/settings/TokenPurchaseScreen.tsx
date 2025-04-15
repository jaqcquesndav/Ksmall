import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, RadioButton, Title, useTheme, TextInput, Divider, Portal, Modal } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/types';
import AppHeader from '../../components/common/AppHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatNumber } from '../../utils/formatters';
import * as DocumentPicker from 'expo-document-picker';

const TokenPurchaseScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const [selectedPlan, setSelectedPlan] = useState('plan3');
  const [customTokens, setCustomTokens] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('creditCard');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [manualPaymentStep, setManualPaymentStep] = useState(1);
  const [proofDocument, setProofDocument] = useState<any>(null);
  const [smsCode, setSmsCode] = useState('');

  // Plans disponibles
  const tokenPlans = [
    { id: 'plan1', tokens: 500000, price: 10000, label: 'Basic' },
    { id: 'plan2', tokens: 1000000, price: 18000, label: 'Standard' },
    { id: 'plan3', tokens: 2500000, price: 40000, label: 'Premium' },
    { id: 'plan4', tokens: 5000000, price: 75000, label: 'Enterprise' },
    { id: 'custom', tokens: 0, price: 0, label: 'Custom' }
  ];

  // Calcul du prix pour un plan personnalisé
  const calculateCustomPrice = (tokens: number) => {
    // Prix dégressif en fonction du volume
    if (tokens >= 5000000) return tokens / 5000000 * 75000 * 0.9; // 10% de réduction
    if (tokens >= 2500000) return tokens / 2500000 * 40000 * 0.95; // 5% de réduction
    if (tokens >= 1000000) return tokens / 1000000 * 18000;
    return tokens / 500000 * 10000;
  };

  // Récupérer le plan sélectionné
  const getSelectedPlan = () => {
    if (selectedPlan === 'custom') {
      const tokens = parseInt(customTokens, 10) || 0;
      return {
        id: 'custom',
        tokens,
        price: calculateCustomPrice(tokens),
        label: 'Custom'
      };
    }
    return tokenPlans.find(plan => plan.id === selectedPlan) || tokenPlans[0];
  };

  const handleInitiatePurchase = () => {
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
        // Simuler l'envoi d'un SMS après téléchargement du justificatif
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

    // Dans une application réelle, vous enverriez ce code à votre backend pour validation
    // Ici nous simulons une validation simple (le code est "123456")
    if (smsCode === '123456') {
      Alert.alert(
        'Paiement validé',
        'Votre paiement a été validé avec succès. Vos tokens ont été ajoutés à votre compte.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              const plan = getSelectedPlan();
              setPaymentModalVisible(false);
              setManualPaymentStep(1);
              setSmsCode('');
              setProofDocument(null);
              // Navigate back to Dashboard using correct typing
              navigation.navigate('MainTabs' as any, { screen: 'Dashboard' } as any);
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
      // Ne rien faire ici, le processus est géré dans le modal
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
                    navigation.navigate('MainTabs' as any, { screen: 'Dashboard' } as any);
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

  const handleCustomTokenChange = (text: string) => {
    // Autoriser uniquement les chiffres
    const numericText = text.replace(/[^0-9]/g, '');
    setCustomTokens(numericText);
  };

  const plan = getSelectedPlan();
  
  return (
    <View style={styles.container}>
      <AppHeader title={t('buy_tokens')} showBack />
      
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>{t('select_package')}</Title>
            
            <RadioButton.Group
              onValueChange={value => {
                setSelectedPlan(value);
                if (value !== 'custom') {
                  setCustomTokens('');
                }
              }}
              value={selectedPlan}
            >
              {tokenPlans.map(plan => (
                <View key={plan.id} style={styles.planOption}>
                  <View style={styles.planRadio}>
                    <RadioButton
                      value={plan.id}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.planDetails}>
                    <Text style={styles.planTitle}>
                      {plan.label} {plan.id !== 'custom' && `(${formatNumber(plan.tokens)} tokens)`}
                    </Text>
                    {plan.id === 'custom' ? (
                      <TextInput
                        label={t('enter_token_amount')}
                        value={customTokens}
                        onChangeText={handleCustomTokenChange}
                        keyboardType="numeric"
                        mode="outlined"
                        disabled={selectedPlan !== 'custom'}
                        style={styles.customInput}
                        placeholder="Ex: 1000000"
                        theme={{ colors: { primary: theme.colors.primary } }}
                      />
                    ) : (
                      <Text style={styles.planDescription}>
                        {formatNumber(plan.price)} XOF ({(plan.price / plan.tokens * 1000000).toFixed(2)} XOF / million)
                      </Text>
                    )}
                  </View>
                  {plan.id !== 'custom' && (
                    <View style={styles.planPrice}>
                      <Text style={[styles.priceTag, { color: theme.colors.primary }]}>
                        {formatNumber(plan.price)} XOF
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </RadioButton.Group>
            
            {selectedPlan === 'custom' && customTokens && (
              <View style={styles.customPriceContainer}>
                <Text style={styles.customPriceLabel}>
                  {t('estimated_price')}:
                </Text>
                <Text style={[styles.customPrice, { color: theme.colors.primary }]}>
                  {formatNumber(calculateCustomPrice(parseInt(customTokens, 10) || 0))} XOF
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>{t('order_summary')}</Title>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('tokens')}:</Text>
              <Text style={styles.summaryValue}>{formatNumber(plan.tokens)}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('price')}:</Text>
              <Text style={styles.summaryValue}>{formatNumber(plan.price)} XOF</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('tax')}:</Text>
              <Text style={styles.summaryValue}>
                {formatNumber(Math.round(plan.price * 0.18))} XOF (18%)
              </Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.totalLabel]}>{t('total')}:</Text>
              <Text style={[styles.summaryValue, styles.totalValue, { color: theme.colors.primary }]}>
                {formatNumber(Math.round(plan.price * 1.18))} XOF
              </Text>
            </View>
            
            <Button
              mode="contained"
              style={[styles.purchaseButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleInitiatePurchase}
              disabled={selectedPlan === 'custom' && (!customTokens || parseInt(customTokens, 10) <= 0)}
            >
              {t('proceed_to_payment')}
            </Button>
          </Card.Content>
        </Card>
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
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  title: {
    marginBottom: 16,
  },
  planOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  planRadio: {
    marginRight: 8,
  },
  planDetails: {
    flex: 1,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
  },
  planPrice: {
    marginLeft: 8,
  },
  priceTag: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  customInput: {
    marginTop: 8,
    height: 40,
  },
  customPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginTop: 16,
  },
  customPriceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  customPrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 8,
  },
  purchaseButton: {
    marginTop: 24,
    borderRadius: 8,
    paddingVertical: 6,
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

export default TokenPurchaseScreen;
