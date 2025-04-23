import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { 
  Button, 
  Card, 
  Text, 
  IconButton, 
  Portal, 
  Modal,
  TextInput,
  SegmentedButtons,
  Surface,
  RadioButton,
  HelperText,
  Divider,
  Menu,
  useTheme
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppHeader from '../../components/common/AppHeader';
import { useAuth } from '../../context/AuthContext';
import logger from '../../utils/logger';

// Define the payment method types
interface BasePaymentMethod {
  id: string;
  isDefault: boolean;
}

interface MobileMoneyPayment extends BasePaymentMethod {
  type: 'mobile_money';
  provider: 'Airtel Money' | 'Orange Money' | 'M-Pesa';
  number: string;
}

interface BankCardPayment extends BasePaymentMethod {
  type: 'bank';
  bank: string;
  cardNetwork: 'VISA' | 'Mastercard';
  cardNumber: string;
  expiryDate: string;
  // CVV is not stored for security reasons
}

type PaymentMethod = MobileMoneyPayment | BankCardPayment;

const PaymentMethodsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const theme = useTheme();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { 
      id: '1', 
      type: 'mobile_money', 
      provider: 'M-Pesa', 
      number: '+243 XXX XXX XXX', 
      isDefault: true 
    },
    { 
      id: '2', 
      type: 'bank', 
      bank: 'RAWBANK', 
      cardNetwork: 'VISA', 
      cardNumber: '**** **** **** 5678', 
      expiryDate: '12/26', 
      isDefault: false 
    },
  ]);
  
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'mobile_money' | 'bank'>('mobile_money');
  
  // Mobile Money form state
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState<'Airtel Money' | 'Orange Money' | 'M-Pesa'>('M-Pesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [showMobileProviderMenu, setShowMobileProviderMenu] = useState(false);
  
  // Bank payment form state
  const [selectedBank, setSelectedBank] = useState('RAWBANK');
  const [cardNetwork, setCardNetwork] = useState<'VISA' | 'Mastercard'>('VISA');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [showBankMenu, setShowBankMenu] = useState(false);
  
  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const bankOptions = ['EQUITYBCDC', 'RAWBANK', 'ECOBANK', 'SMICO', 'TMB', 'Autre'];

  // References for menu buttons - corrected types for TouchableOpacity
  const mobileProviderRef = useRef<TouchableOpacity>(null);
  const bankSelectorRef = useRef<TouchableOpacity>(null);
  const [mobileProviderPosition, setMobileProviderPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [bankSelectorPosition, setBankSelectorPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Function to measure the position of the mobile provider selector
  const measureMobileProviderButton = () => {
    mobileProviderRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setMobileProviderPosition({ x: pageX, y: pageY, width, height });
    });
  };

  // Function to measure the position of the bank selector
  const measureBankSelectorButton = () => {
    bankSelectorRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setBankSelectorPosition({ x: pageX, y: pageY, width, height });
    });
  };
  
  const validateMobileMoneyForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate phone number (simple validation for now)
    if (!phoneNumber) {
      newErrors.phoneNumber = t('phone_number_required');
    } else if (!phoneNumber.startsWith('+')) {
      newErrors.phoneNumber = t('include_country_code');
    }
    
    // PIN code validation
    if (!pinCode) {
      newErrors.pinCode = t('pin_required');
    } else if (pinCode.length < 4) {
      newErrors.pinCode = t('pin_too_short');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateBankForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Card number validation
    if (!cardNumber) {
      newErrors.cardNumber = t('card_number_required');
    } else if (cardNumber.replace(/\s/g, '').length < 16) {
      newErrors.cardNumber = t('invalid_card_number');
    }
    
    // Expiry date validation (MM/YY format)
    if (!expiryDate) {
      newErrors.expiryDate = t('expiry_date_required');
    } else if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      newErrors.expiryDate = t('invalid_expiry_format');
    }
    
    // CVV validation
    if (!cvv) {
      newErrors.cvv = t('cvv_required');
    } else if (!/^\d{3,4}$/.test(cvv)) {
      newErrors.cvv = t('invalid_cvv');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleAddPaymentMethod = () => {
    // Validate form based on payment type
    const isValid = paymentType === 'mobile_money' 
      ? validateMobileMoneyForm() 
      : validateBankForm();
    
    if (!isValid) return;
    
    const newId = (Math.max(...paymentMethods.map(p => parseInt(p.id))) + 1).toString();
    
    let newMethod: PaymentMethod;
    
    if (paymentType === 'mobile_money') {
      newMethod = {
        id: newId,
        type: 'mobile_money',
        provider: mobileMoneyProvider,
        number: phoneNumber,
        isDefault: false
      };
    } else {
      // Format card number to display only last 4 digits for storage
      const maskedCardNumber = '**** **** **** ' + cardNumber.replace(/\s/g, '').slice(-4);
      
      newMethod = {
        id: newId,
        type: 'bank',
        bank: selectedBank,
        cardNetwork: cardNetwork,
        cardNumber: maskedCardNumber,
        expiryDate: expiryDate,
        isDefault: false
      };
    }
    
    setPaymentMethods([...paymentMethods, newMethod]);
    resetForm();
    setShowAddPaymentModal(false);
  };
  
  const resetForm = () => {
    // Reset mobile money form
    setMobileMoneyProvider('M-Pesa');
    setPhoneNumber('');
    setPinCode('');
    
    // Reset bank payment form
    setSelectedBank('RAWBANK');
    setCardNetwork('VISA');
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    
    // Clear errors
    setErrors({});
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

  // Format card number with spaces for display
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const chunks = [];
    
    for (let i = 0; i < cleaned.length; i += 4) {
      chunks.push(cleaned.substring(i, i + 4));
    }
    
    return chunks.join(' ');
  };

  // Handle card number input with formatting
  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardNumber(formatted);
    }
  };

  // Format expiry date with slash
  const handleExpiryDateChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/gi, '');
    
    if (cleaned.length <= 4) {
      if (cleaned.length > 2) {
        setExpiryDate(`${cleaned.substring(0, 2)}/${cleaned.substring(2)}`);
      } else {
        setExpiryDate(cleaned);
      }
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        title={t('payment_methods')} 
        showBack
      />
      
      <ScrollView style={styles.scrollView}>
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
                  {method.type === 'mobile_money' ? (
                    <MaterialCommunityIcons 
                      name={
                        method.provider === 'Airtel Money' ? 'cellphone-wireless' : 
                        method.provider === 'Orange Money' ? 'cellphone-basic' : 
                        'cellphone'
                      } 
                      size={24} 
                      color={
                        method.provider === 'Airtel Money' ? '#ff0000' : 
                        method.provider === 'Orange Money' ? '#ff6600' : 
                        '#27ae60'
                      }
                    />
                  ) : (
                    <MaterialCommunityIcons 
                      name={method.cardNetwork === 'VISA' ? 'credit-card' : 'credit-card-outline'} 
                      size={24} 
                      color={method.cardNetwork === 'VISA' ? '#1A1F71' : '#EB001B'}
                    />
                  )}
                  <View style={styles.paymentMethodTextInfo}>
                    <Text style={styles.paymentMethodTitle}>
                      {method.type === 'mobile_money' ? method.provider : `${method.bank} ${method.cardNetwork}`}
                    </Text>
                    <Text style={styles.paymentMethodDetail}>
                      {method.type === 'mobile_money' ? method.number : method.cardNumber}
                    </Text>
                    {method.type === 'bank' && (
                      <Text style={styles.paymentMethodExtra}>
                        {t('expires')}: {method.expiryDate}
                      </Text>
                    )}
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
      
      {/* Add Payment Method Modal - Fixed version */}
      <Portal>
        <Modal 
          visible={showAddPaymentModal} 
          onDismiss={() => {
            setShowAddPaymentModal(false);
            resetForm();
          }}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <ScrollView style={styles.modalScrollView}>
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              {t('add_payment_method')}
            </Text>
            
            <SegmentedButtons
              value={paymentType}
              onValueChange={(value) => {
                setPaymentType(value as 'mobile_money' | 'bank');
                setErrors({});
              }}
              buttons={[
                { value: 'mobile_money', label: t('mobile_money') },
                { value: 'bank', label: t('bank_card') }
              ]}
              style={styles.segmentedButtons}
            />
            
            {/* Mobile Money Form */}
            {paymentType === 'mobile_money' && (
              <View style={styles.formContainer}>
                <View style={styles.selectContainer}>
                  <Text style={styles.selectLabel}>{t('select_provider')}</Text>
                  <TouchableOpacity
                    ref={mobileProviderRef}
                    style={styles.selectButton}
                    onPress={() => {
                      measureMobileProviderButton();
                      setShowMobileProviderMenu(true);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons 
                        name={
                          mobileMoneyProvider === 'Airtel Money' ? 'cellphone-wireless' : 
                          mobileMoneyProvider === 'Orange Money' ? 'cellphone-basic' : 
                          'cellphone'
                        } 
                        size={20} 
                        color={
                          mobileMoneyProvider === 'Airtel Money' ? '#ff0000' : 
                          mobileMoneyProvider === 'Orange Money' ? '#ff6600' : 
                          '#27ae60'
                        }
                        style={{ marginRight: 8 }}
                      />
                      <Text>{mobileMoneyProvider}</Text>
                    </View>
                    <MaterialCommunityIcons name="menu-down" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <Menu
                  visible={showMobileProviderMenu}
                  onDismiss={() => setShowMobileProviderMenu(false)}
                  contentStyle={{ width: mobileProviderPosition.width }}
                  anchor={{ x: mobileProviderPosition.x, y: mobileProviderPosition.y + mobileProviderPosition.height }}
                >
                  <Menu.Item
                    title="Airtel Money"
                    leadingIcon="cellphone-wireless"
                    onPress={() => {
                      setMobileMoneyProvider('Airtel Money');
                      setShowMobileProviderMenu(false);
                    }}
                  />
                  <Menu.Item
                    title="Orange Money"
                    leadingIcon="cellphone-basic"
                    onPress={() => {
                      setMobileMoneyProvider('Orange Money');
                      setShowMobileProviderMenu(false);
                    }}
                  />
                  <Menu.Item
                    title="M-Pesa"
                    leadingIcon="cellphone"
                    onPress={() => {
                      setMobileMoneyProvider('M-Pesa');
                      setShowMobileProviderMenu(false);
                    }}
                  />
                </Menu>
                
                <TextInput
                  label={t('phone_number_with_code')}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  style={styles.input}
                  keyboardType="phone-pad"
                  placeholder="+243 XXXXXXXXX"
                  error={!!errors.phoneNumber}
                />
                {errors.phoneNumber && <HelperText type="error">{errors.phoneNumber}</HelperText>}
                
                <TextInput
                  label={t('pin_code')}
                  value={pinCode}
                  onChangeText={setPinCode}
                  style={styles.input}
                  keyboardType="numeric"
                  secureTextEntry
                  error={!!errors.pinCode}
                  maxLength={6}
                />
                {errors.pinCode && <HelperText type="error">{errors.pinCode}</HelperText>}
              </View>
            )}
            
            {/* Bank Card Form */}
            {paymentType === 'bank' && (
              <View style={styles.formContainer}>
                <View style={styles.selectContainer}>
                  <Text style={styles.selectLabel}>{t('select_bank')}</Text>
                  <TouchableOpacity
                    ref={bankSelectorRef}
                    style={styles.selectButton}
                    onPress={() => {
                      measureBankSelectorButton();
                      setShowBankMenu(true);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="bank" size={20} color="#333" style={{ marginRight: 8 }} />
                      <Text>{selectedBank}</Text>
                    </View>
                    <MaterialCommunityIcons name="menu-down" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <Menu
                  visible={showBankMenu}
                  onDismiss={() => setShowBankMenu(false)}
                  contentStyle={{ width: bankSelectorPosition.width }}
                  anchor={{ x: bankSelectorPosition.x, y: bankSelectorPosition.y + bankSelectorPosition.height }}
                >
                  {bankOptions.map((bank) => (
                    <Menu.Item
                      key={bank}
                      title={bank}
                      leadingIcon="bank"
                      onPress={() => {
                        setSelectedBank(bank);
                        setShowBankMenu(false);
                      }}
                    />
                  ))}
                </Menu>
                
                <Text style={styles.sectionTitle}>{t('card_network')}</Text>
                <View style={styles.radioRow}>
                  <TouchableOpacity 
                    style={[
                      styles.cardNetworkOption, 
                      cardNetwork === 'VISA' && styles.selectedCardNetwork
                    ]}
                    onPress={() => setCardNetwork('VISA')}
                  >
                    <MaterialCommunityIcons 
                      name="credit-card" 
                      size={30} 
                      color={cardNetwork === 'VISA' ? "#1A1F71" : "#757575"} 
                    />
                    <Text style={styles.cardNetworkLabel}>VISA</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.cardNetworkOption, 
                      cardNetwork === 'Mastercard' && styles.selectedCardNetwork
                    ]}
                    onPress={() => setCardNetwork('Mastercard')}
                  >
                    <MaterialCommunityIcons 
                      name="credit-card-outline" 
                      size={30} 
                      color={cardNetwork === 'Mastercard' ? "#EB001B" : "#757575"} 
                    />
                    <Text style={styles.cardNetworkLabel}>Mastercard</Text>
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  label={t('card_number')}
                  value={cardNumber}
                  onChangeText={handleCardNumberChange}
                  style={styles.input}
                  keyboardType="numeric"
                  error={!!errors.cardNumber}
                  maxLength={19} // 16 digits + 3 spaces
                />
                {errors.cardNumber && <HelperText type="error">{errors.cardNumber}</HelperText>}
                
                <View style={styles.rowInputs}>
                  <View style={styles.halfInput}>
                    <TextInput
                      label={t('expiry_date')}
                      value={expiryDate}
                      onChangeText={handleExpiryDateChange}
                      placeholder="MM/YY"
                      style={styles.input}
                      keyboardType="numeric"
                      error={!!errors.expiryDate}
                      maxLength={5} // MM/YY
                    />
                    {errors.expiryDate && <HelperText type="error">{errors.expiryDate}</HelperText>}
                  </View>
                  
                  <View style={styles.halfInput}>
                    <TextInput
                      label="CVV"
                      value={cvv}
                      onChangeText={setCvv}
                      style={styles.input}
                      keyboardType="numeric"
                      secureTextEntry
                      error={!!errors.cvv}
                      maxLength={4}
                    />
                    {errors.cvv && <HelperText type="error">{errors.cvv}</HelperText>}
                  </View>
                </View>
              </View>
            )}
            
            <View style={styles.modalActions}>
              <Button 
                mode="outlined" 
                onPress={() => {
                  setShowAddPaymentModal(false);
                  resetForm();
                }} 
                style={styles.cancelButton}
              >
                {t('cancel')}
              </Button>
              <Button 
                mode="contained" 
                onPress={handleAddPaymentMethod}
              >
                {t('add')}
              </Button>
            </View>
          </ScrollView>
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
  paymentMethodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodTextInfo: {
    marginLeft: 12,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentMethodDetail: {
    fontSize: 14,
    color: '#666',
  },
  paymentMethodExtra: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
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
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
    width: '90%',
    alignSelf: 'center',
    elevation: 5,
  },
  modalScrollView: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  formContainer: {
    marginTop: 10,
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    marginBottom: 10,
  },
  cancelButton: {
    marginRight: 10,
  },
  segmentedButtons: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 12,
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardNetworkOption: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    width: '48%',
  },
  selectedCardNetwork: {
    borderColor: '#6200ee',
    backgroundColor: 'rgba(98, 0, 238, 0.08)',
  },
  cardNetworkLabel: {
    marginTop: 8,
    fontWeight: '500',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  selectContainer: {
    marginBottom: 20,
  },
  selectLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  providerMenu: {
    marginTop: -20,
  },
  bankMenu: {
    marginTop: -20,
  },
});

export default PaymentMethodsScreen;
