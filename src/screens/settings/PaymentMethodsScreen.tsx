import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Button, 
  Card, 
  Text, 
  List, 
  IconButton, 
  Portal, 
  Modal,
  TextInput,
  SegmentedButtons,
  Surface,
  RadioButton,
  Divider
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import AppHeader from '../../components/common/AppHeader';
import { useAuth } from '../../context/AuthContext';
import logger from '../../utils/logger';
import { useCurrency } from '../../hooks/useCurrency';
import CurrencyAmount from '../../components/common/CurrencyAmount';

const PaymentMethodsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [paymentMethods, setPaymentMethods] = useState([
    { id: '1', type: 'mobile_money', provider: 'M-Pesa', number: '+243 XXX XXX XXX', isDefault: true },
    { id: '2', type: 'bank', name: 'Rawbank', accountNumber: '**** 5678', isDefault: false },
  ]);
  
  const [subscriptionPlans] = useState([
    { id: 'basic', name: t('basic_plan'), price: 15, tokens: 500000 },
    { id: 'pro', name: t('pro_plan'), price: 29, tokens: 1000000, isCurrent: true },
    { id: 'business', name: t('business_plan'), price: 49, tokens: 2000000 },
  ]);
  
  const [subscriptionAddons] = useState([
    { id: 'bonus_tokens', name: t('monthly_token_bonus'), description: t('bonus_description'), price: 10, tokens: 1000000 }
  ]);
  
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showConfirmCodeModal, setShowConfirmCodeModal] = useState(false);
  
  const [selectedPlan, setSelectedPlan] = useState(subscriptionPlans.find(p => p.isCurrent)?.id || '');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods.find(p => p.isDefault)?.id || '');
  const [paymentType, setPaymentType] = useState('mobile_money');
  const [newPaymentData, setNewPaymentData] = useState({ provider: '', number: '' });
  const [confirmationCode, setConfirmationCode] = useState('');
  
  const handleAddPaymentMethod = () => {
    const newId = (Math.max(...paymentMethods.map(p => parseInt(p.id))) + 1).toString();
    
    const newMethod = paymentType === 'mobile_money' 
      ? { 
          id: newId, 
          type: 'mobile_money', 
          provider: newPaymentData.provider, 
          number: newPaymentData.number, 
          isDefault: false 
        }
      : { 
          id: newId, 
          type: 'bank', 
          name: newPaymentData.provider, 
          accountNumber: newPaymentData.number, 
          isDefault: false 
        };
        
    setPaymentMethods([...paymentMethods, newMethod]);
    setShowAddPaymentModal(false);
    setNewPaymentData({ provider: '', number: '' });
  };
  
  const handleSetDefaultPaymentMethod = (id: string) => {
    setPaymentMethods(
      paymentMethods.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
  };
  
  const handleRemovePaymentMethod = (id: string) => {
    const isDefault = paymentMethods.find(m => m.id === id)?.isDefault;
    
    // Don't allow removal of the default payment method
    if (isDefault) {
      Alert.alert(t('error'), t('cannot_remove_default_payment'));
      return;
    }
    
    setPaymentMethods(paymentMethods.filter(method => method.id !== id));
  };
  
  const handleSubscribe = () => {
    setShowSubscribeModal(false);
    setShowConfirmCodeModal(true);
  };
  
  const handleConfirmPayment = () => {
    if (confirmationCode.length < 6) {
      Alert.alert(t('error'), t('invalid_confirmation_code'));
      return;
    }
    
    // Here you would verify the code with your payment API
    
    Alert.alert(t('success'), t('subscription_confirmed'));
    setShowConfirmCodeModal(false);
    setConfirmationCode('');
  };
  
  const calculateTotal = () => {
    const planPrice = subscriptionPlans.find(p => p.id === selectedPlan)?.price || 0;
    const addonsPrice = selectedAddons.reduce((total, addonId) => {
      const addon = subscriptionAddons.find(a => a.id === addonId);
      return total + (addon?.price || 0);
    }, 0);
    
    return planPrice + addonsPrice;
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        title={t('payment_methods')} 
        showBack
      />
      
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Title title={t('subscription')} />
          <Card.Content>
            <View style={styles.subscriptionItem}>
              <Text style={styles.currentPlanTitle}>{t('current_plan')}</Text>
              <Text style={styles.currentPlan}>
                {subscriptionPlans.find(p => p.isCurrent)?.name || t('no_active_plan')}
              </Text>
              
              <Text style={styles.tokensInfo}>
                {t('monthly_tokens')}: {(subscriptionPlans.find(p => p.isCurrent)?.tokens || 0).toLocaleString()}
              </Text>
              
              <Button 
                mode="contained" 
                style={styles.manageButton}
                onPress={() => setShowSubscribeModal(true)}
              >
                {t('manage_subscription')}
              </Button>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Title 
            title={t('payment_methods')} 
            right={props => (
              <IconButton 
                {...props} 
                icon="plus" 
                onPress={() => setShowAddPaymentModal(true)} 
              />
            )}
          />
          <Card.Content>
            {paymentMethods.map(method => (
              <Surface key={method.id} style={styles.paymentMethodItem}>
                <View style={styles.paymentMethodInfo}>
                  <IconButton 
                    icon={method.type === 'mobile_money' ? 'cellphone' : 'bank'} 
                    size={24} 
                  />
                  <View>
                    <Text style={styles.paymentMethodTitle}>
                      {method.type === 'mobile_money' ? method.provider : method.name}
                    </Text>
                    <Text style={styles.paymentMethodDetail}>
                      {method.type === 'mobile_money' ? method.number : method.accountNumber}
                    </Text>
                    {method.isDefault && (
                      <Text style={styles.defaultLabel}>{t('default')}</Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.paymentMethodActions}>
                  {!method.isDefault && (
                    <>
                      <IconButton 
                        icon="check-circle-outline" 
                        size={20} 
                        onPress={() => handleSetDefaultPaymentMethod(method.id)} 
                      />
                      <IconButton 
                        icon="delete" 
                        size={20} 
                        onPress={() => handleRemovePaymentMethod(method.id)} 
                      />
                    </>
                  )}
                </View>
              </Surface>
            ))}
            
            {paymentMethods.length === 0 && (
              <Text style={styles.noMethodsText}>{t('no_payment_methods')}</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
      
      {/* Subscribe Modal */}
      <Portal>
        <Modal 
          visible={showSubscribeModal} 
          onDismiss={() => setShowSubscribeModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>{t('manage_subscription')}</Text>
          
          <Text style={styles.modalSectionTitle}>{t('select_plan')}</Text>
          <RadioButton.Group 
            onValueChange={value => setSelectedPlan(value)} 
            value={selectedPlan}
          >
            {subscriptionPlans.map(plan => (
              <View key={plan.id} style={styles.planOption}>
                <RadioButton.Item
                  label={`${plan.name}`}
                  value={plan.id}
                />
                <View style={styles.planPriceContainer}>
                  <CurrencyAmount amount={plan.price} />
                  <Text style={styles.perMonth}>/month</Text>
                </View>
                <Text style={styles.planTokens}>
                  {plan.tokens.toLocaleString()} {t('tokens_per_month')}
                </Text>
              </View>
            ))}
          </RadioButton.Group>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.modalSectionTitle}>{t('add_ons')}</Text>
          {subscriptionAddons.map(addon => (
            <View key={addon.id} style={styles.addonOption}>
              <RadioButton.Item
                label={`${addon.name}`}
                value={addon.id}
                status={selectedAddons.includes(addon.id) ? 'checked' : 'unchecked'}
                onPress={() => {
                  if (selectedAddons.includes(addon.id)) {
                    setSelectedAddons(selectedAddons.filter(id => id !== addon.id));
                  } else {
                    setSelectedAddons([...selectedAddons, addon.id]);
                  }
                }}
              />
              <View style={styles.planPriceContainer}>
                <CurrencyAmount amount={addon.price} />
                <Text style={styles.perMonth}>/month</Text>
              </View>
              <Text style={styles.addonDescription}>{addon.description}</Text>
            </View>
          ))}
          
          <Divider style={styles.divider} />
          
          <Text style={styles.modalSectionTitle}>{t('payment_method')}</Text>
          <RadioButton.Group 
            onValueChange={value => setSelectedPaymentMethod(value)} 
            value={selectedPaymentMethod}
          >
            {paymentMethods.map(method => (
              <RadioButton.Item
                key={method.id}
                label={
                  method.type === 'mobile_money' 
                    ? `${method.provider} (${method.number})` 
                    : `${method.name} (${method.accountNumber})`
                }
                value={method.id}
              />
            ))}
          </RadioButton.Group>
          
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>{t('total')}</Text>
            <View style={styles.totalAmountContainer}>
              <CurrencyAmount amount={calculateTotal()} style={styles.totalAmount} />
              <Text style={styles.perMonth}>/month</Text>
            </View>
          </View>
          
          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setShowSubscribeModal(false)} 
              style={styles.cancelButton}
            >
              {t('cancel')}
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSubscribe}
            >
              {t('continue')}
            </Button>
          </View>
        </Modal>
      </Portal>
      
      {/* Add Payment Method Modal */}
      <Portal>
        <Modal 
          visible={showAddPaymentModal} 
          onDismiss={() => setShowAddPaymentModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>{t('add_payment_method')}</Text>
          
          <SegmentedButtons
            value={paymentType}
            onValueChange={setPaymentType}
            buttons={[
              { value: 'mobile_money', label: t('mobile_money') },
              { value: 'bank', label: t('bank') }
            ]}
            style={styles.segmentedButtons}
          />
          
          <TextInput
            label={paymentType === 'mobile_money' ? t('provider') : t('bank_name')}
            value={newPaymentData.provider}
            onChangeText={text => setNewPaymentData({...newPaymentData, provider: text})}
            style={styles.input}
          />
          
          <TextInput
            label={paymentType === 'mobile_money' ? t('phone_number') : t('account_number')}
            value={newPaymentData.number}
            onChangeText={text => setNewPaymentData({...newPaymentData, number: text})}
            style={styles.input}
            keyboardType={paymentType === 'mobile_money' ? 'phone-pad' : 'default'}
          />
          
          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setShowAddPaymentModal(false)} 
              style={styles.cancelButton}
            >
              {t('cancel')}
            </Button>
            <Button 
              mode="contained" 
              onPress={handleAddPaymentMethod}
              disabled={!newPaymentData.provider || !newPaymentData.number}
            >
              {t('add')}
            </Button>
          </View>
        </Modal>
      </Portal>
      
      {/* Confirmation Code Modal */}
      <Portal>
        <Modal 
          visible={showConfirmCodeModal} 
          onDismiss={() => setShowConfirmCodeModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>{t('confirm_payment')}</Text>
          
          <Text style={styles.confirmationText}>
            {t('enter_confirmation_code')}
          </Text>
          
          <TextInput
            label={t('confirmation_code')}
            value={confirmationCode}
            onChangeText={setConfirmationCode}
            style={styles.input}
            keyboardType="number-pad"
          />
          
          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setShowConfirmCodeModal(false)} 
              style={styles.cancelButton}
            >
              {t('cancel')}
            </Button>
            <Button 
              mode="contained" 
              onPress={handleConfirmPayment}
              disabled={confirmationCode.length < 6}
            >
              {t('confirm')}
            </Button>
          </View>
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
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  subscriptionItem: {
    marginBottom: 8,
  },
  currentPlanTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  currentPlan: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tokensInfo: {
    fontSize: 14,
    marginBottom: 16,
  },
  manageButton: {
    marginTop: 8,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentMethodDetail: {
    fontSize: 14,
    color: '#666',
  },
  paymentMethodActions: {
    flexDirection: 'row',
  },
  noMethodsText: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#666',
  },
  defaultLabel: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
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
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelButton: {
    marginRight: 10,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 12,
  },
  planOption: {
    marginBottom: 8,
  },
  planTokens: {
    fontSize: 12,
    color: '#666',
    marginLeft: 30,
    marginTop: -8,
    marginBottom: 8,
  },
  addonOption: {
    marginVertical: 4,
  },
  addonDescription: {
    fontSize: 12,
    color: '#666',
    marginLeft: 30,
    marginTop: -8,
    marginBottom: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200EE',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  confirmationText: {
    marginBottom: 16,
  },
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 30,
    marginTop: -8,
    marginBottom: 8,
  },
  perMonth: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  totalAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default PaymentMethodsScreen;
