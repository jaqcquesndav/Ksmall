import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, RadioButton, Title, useTheme, TextInput, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/types';
import AppHeader from '../../components/common/AppHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatNumber } from '../../utils/formatters';

const TokenPurchaseScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const [selectedPlan, setSelectedPlan] = useState('plan3');
  const [customTokens, setCustomTokens] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('creditCard');

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

  const handlePurchase = () => {
    const plan = getSelectedPlan();
    
    // Simuler un achat réussi
    alert(`Purchase successful! ${formatNumber(plan.tokens)} tokens added to your account.`);
    
    // Navigate back to Dashboard using correct typing
    // Using any to bypass the type checking temporarily since we need to support nested navigation
    navigation.navigate('MainTabs' as any, { screen: 'Dashboard' } as any);
  };

  // Icônes pour les méthodes de paiement
  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'creditCard': return 'credit-card';
      case 'mobilePayment': return 'cellphone';
      case 'bankTransfer': return 'bank';
      default: return 'cash';
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
            <Title style={styles.title}>{t('payment_method')}</Title>
            
            <RadioButton.Group
              onValueChange={value => setPaymentMethod(value)}
              value={paymentMethod}
            >
              {['creditCard', 'mobilePayment', 'bankTransfer'].map(method => (
                <View key={method} style={styles.paymentOption}>
                  <RadioButton
                    value={method}
                    color={theme.colors.primary}
                  />
                  <MaterialCommunityIcons
                    name={getPaymentIcon(method)}
                    size={24}
                    color="#666"
                    style={styles.paymentIcon}
                  />
                  <Text style={styles.paymentText}>{t(method)}</Text>
                </View>
              ))}
            </RadioButton.Group>
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
              onPress={handlePurchase}
              disabled={selectedPlan === 'custom' && (!customTokens || parseInt(customTokens, 10) <= 0)}
            >
              {t('complete_purchase')}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
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
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  paymentIcon: {
    marginHorizontal: 8,
  },
  paymentText: {
    fontSize: 16,
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
});

export default TokenPurchaseScreen;
