import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, RadioButton, Card, Title, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import AppHeader from '../../components/common/AppHeader';
import { MainStackParamList } from '../../navigation/types';
import InventoryService from '../../services/InventoryService';
import logger from '../../utils/logger';

type StockAdjustmentRouteProp = RouteProp<MainStackParamList, 'StockAdjustment'>;

const StockAdjustmentScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<StockAdjustmentRouteProp>();
  const { productId } = route.params;
  
  // État du produit
  const [product, setProduct] = useState<any>({
    id: productId,
    name: '',
    currentStock: 0,
    unit: 'unit',
    sku: '',
  });
  
  // État du formulaire
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add');
  const [quantity, setQuantity] = useState<string>('1');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Charger les informations du produit
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const productData = await InventoryService.getProductById(productId);
        if (productData) {
          setProduct({
            id: productId,
            name: productData.name,
            currentStock: productData.quantity,
            unit: 'unit', // Par défaut, à adapter si nécessaire
            sku: productData.sku,
          });
          setLocation(productData.location || '');
        } else {
          Alert.alert(t('error'), t('product_not_found'));
          navigation.goBack();
        }
      } catch (error) {
        logger.error('Erreur lors du chargement du produit:', error);
        Alert.alert(t('error'), t('error_loading_product'));
        navigation.goBack();
      }
    };

    loadProduct();
  }, [productId, navigation, t]);

  // Calculer le nouveau niveau de stock
  const calculateNewStock = (): number => {
    const qty = Number(quantity) || 0;
    switch (adjustmentType) {
      case 'add':
        return product.currentStock + qty;
      case 'remove':
        return Math.max(0, product.currentStock - qty);
      case 'set':
        return Math.max(0, qty);
      default:
        return product.currentStock;
    }
  };
  
  // Soumettre l'ajustement
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const qty = Number(quantity);
      
      if (!reason) {
        Alert.alert(t('error'), t('please_enter_reason'));
        setIsLoading(false);
        return;
      }

      if (!qty || qty <= 0) {
        Alert.alert(t('error'), t('please_enter_valid_quantity'));
        setIsLoading(false);
        return;
      }

      // Appeler le service pour ajuster le stock
      await InventoryService.adjustStock(
        productId,
        adjustmentType,
        qty,
        reason,
        reference || undefined,
        notes || undefined
      );

      // Afficher un message de succès
      Alert.alert(
        t('success'),
        t('stock_adjustment_success'),
        [{ text: t('ok'), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      logger.error('Erreur lors de l\'ajustement du stock:', error);
      Alert.alert(t('error'), t('stock_adjustment_error'));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <AppHeader title={t('stock_adjustment')} showBack />
      
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>{t('product_information')}</Title>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productSku}>{product.sku}</Text>
            
            <View style={styles.currentStockContainer}>
              <Text style={styles.currentStockLabel}>{t('current_stock')}</Text>
              <Text style={styles.currentStockValue}>{product.currentStock} {product.unit}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <Title>{t('adjustment_details')}</Title>
            
            <Text style={styles.sectionLabel}>{t('adjustment_type')}</Text>
            <RadioButton.Group 
              onValueChange={value => setAdjustmentType(value as 'add' | 'remove' | 'set')} 
              value={adjustmentType}
            >
              <View style={styles.radioGroup}>
                <View style={styles.radioOption}>
                  <RadioButton value="add" />
                  <Text>{t('add_stock')}</Text>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="remove" />
                  <Text>{t('remove_stock')}</Text>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="set" />
                  <Text>{t('set_stock_level')}</Text>
                </View>
              </View>
            </RadioButton.Group>
            
            <TextInput
              label={t('quantity')}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
            
            <View style={styles.newStockContainer}>
              <Text style={styles.newStockLabel}>{t('new_stock_level')}</Text>
              <Text style={styles.newStockValue}>{calculateNewStock()} {product.unit}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <TextInput
              label={t('reason_for_adjustment')}
              value={reason}
              onChangeText={setReason}
              mode="outlined"
              style={styles.input}
            />
            
            <TextInput
              label={t('reference')}
              value={reference}
              onChangeText={setReference}
              mode="outlined"
              style={styles.input}
              placeholder={t('optional')}
            />
            
            <TextInput
              label={t('location')}
              value={location}
              onChangeText={setLocation}
              mode="outlined"
              style={styles.input}
            />
            
            <TextInput
              label={t('notes')}
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              placeholder={t('optional')}
            />
          </Card.Content>
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            disabled={isLoading || !quantity || Number(quantity) <= 0 || !reason}
            loading={isLoading}
          >
            {t('submit_adjustment')}
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            disabled={isLoading}
          >
            {t('cancel')}
          </Button>
        </View>
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
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  productSku: {
    color: '#666',
    marginTop: 4,
  },
  currentStockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 4,
    marginTop: 16,
  },
  currentStockLabel: {
    fontSize: 16,
  },
  currentStockValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: 16,
    marginVertical: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    marginBottom: 16,
  },
  newStockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 4,
    marginTop: 8,
  },
  newStockLabel: {
    fontSize: 16,
  },
  newStockValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    marginTop: 8,
  },
  submitButton: {
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default StockAdjustmentScreen;
