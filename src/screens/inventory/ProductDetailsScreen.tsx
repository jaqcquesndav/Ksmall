import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { 
  Text, 
  Button, 
  Card, 
  Chip, 
  Divider, 
  ProgressBar, 
  ActivityIndicator,
  Modal,
  Portal,
  TextInput,
  SegmentedButtons,
  IconButton,
  Dialog,
  RadioButton
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import AppHeader from '../../components/common/AppHeader';
import { MainStackParamList } from '../../navigation/types';
import InventoryService, { InventoryItem } from '../../services/InventoryService';
import logger from '../../utils/logger';
import useCurrency from '../../hooks/useCurrency';

type ProductDetailsRouteProp = RouteProp<MainStackParamList, 'ProductDetails'>;

const ProductDetailsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<ProductDetailsRouteProp>();
  const { productId } = route.params;
  const { formatAmount, currencyInfo } = useCurrency();
  
  const [product, setProduct] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // États pour la modale d'édition de produit
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedProduct, setEditedProduct] = useState<Partial<InventoryItem>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // États pour la modale d'ajustement de stock
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  
  // Gestionnaire pour le changement de type d'ajustement
  const handleAdjustmentTypeChange = (value: string) => {
    if (value === 'add' || value === 'remove' || value === 'set') {
      setAdjustmentType(value);
    }
  };
  
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        logger.info(`Chargement du produit avec ID: ${productId}`);
        
        // Charger le produit depuis le service
        const productData = await InventoryService.getProductById(productId);
        setProduct(productData);
        
        logger.info(`Produit chargé: ${productData?.name}`);
      } catch (error) {
        logger.error(`Erreur lors du chargement du produit: ${error}`);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  // Fonction pour ouvrir la modale d'édition
  const openEditModal = () => {
    if (product) {
      setEditedProduct({
        name: product.name,
        sku: product.sku,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        price: product.price,
        cost: product.cost,
        reorderPoint: product.reorderPoint,
        supplier: product.supplier,
        location: product.location,
      });
      setEditModalVisible(true);
    }
  };

  // Fonction pour fermer la modale d'édition
  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditedProduct({});
  };

  // Fonction pour sauvegarder les modifications du produit
  const saveProductChanges = async () => {
    if (!product) return;
    
    try {
      setIsSaving(true);
      logger.info(`Mise à jour du produit ${product.id}`);
      
      // Mise à jour du produit via le service
      const updatedProduct = await InventoryService.updateProduct(product.id, editedProduct);
      
      // Mettre à jour l'état local avec le produit mis à jour
      setProduct(updatedProduct);
      
      // Fermer la modale
      closeEditModal();
      
      // Notification de succès
      Alert.alert(
        t('success'),
        t('product_updated_successfully'),
        [{ text: t('ok') }]
      );
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour du produit: ${error}`);
      Alert.alert(
        t('error'),
        t('error_updating_product'),
        [{ text: t('ok') }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Fonction pour ouvrir la modale d'ajustement de stock
  const openStockModal = () => {
    setAdjustmentType('add');
    setAdjustmentQuantity('');
    setAdjustmentReason('');
    setStockModalVisible(true);
  };

  // Fonction pour fermer la modale d'ajustement de stock
  const closeStockModal = () => {
    setStockModalVisible(false);
  };

  // Fonction pour ajuster le stock
  const adjustStock = async () => {
    if (!product) return;
    
    // Valider l'entrée
    const quantity = parseInt(adjustmentQuantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert(
        t('error'),
        t('please_enter_valid_quantity'),
        [{ text: t('ok') }]
      );
      return;
    }
    
    if (!adjustmentReason.trim()) {
      Alert.alert(
        t('error'),
        t('please_enter_adjustment_reason'),
        [{ text: t('ok') }]
      );
      return;
    }
    
    try {
      setIsAdjusting(true);
      logger.info(`Ajustement du stock pour le produit ${product.id}`);
      
      // Ajuster le stock via le service
      const updatedProduct = await InventoryService.adjustStock(
        product.id,
        adjustmentType,
        quantity,
        adjustmentReason
      );
      
      // Mettre à jour l'état local avec le produit mis à jour
      setProduct(updatedProduct);
      
      // Fermer la modale
      closeStockModal();
      
      // Notification de succès
      Alert.alert(
        t('success'),
        t('stock_adjusted_successfully'),
        [{ text: t('ok') }]
      );
    } catch (error) {
      logger.error(`Erreur lors de l'ajustement du stock: ${error}`);
      Alert.alert(
        t('error'),
        t('error_adjusting_stock'),
        [{ text: t('ok') }]
      );
    } finally {
      setIsAdjusting(false);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title={t('product_details')} showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </View>
    );
  }
  
  if (error || !product) {
    return (
      <View style={styles.container}>
        <AppHeader title={t('product_details')} showBack />
        <View style={styles.notFoundContainer}>
          <Text>{t('product_not_found')}</Text>
          <Button mode="contained" style={styles.button} onPress={() => navigation.goBack()}>
            {t('go_back')}
          </Button>
        </View>
      </View>
    );
  }

  // Calculate stock status
  const stockRatio = product.quantity / product.reorderPoint;
  let stockStatus = 'normal';
  let stockColor = '#4CAF50';
  
  if (stockRatio <= 1) {
    stockStatus = 'low';
    stockColor = '#FF9800';
  }
  if (product.quantity === 0) {
    stockStatus = 'out';
    stockColor = '#F44336';
  }

  return (
    <View style={styles.container}>
      <AppHeader title={t('product_details')} showBack />
      
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerSection}>
              {product.imageUrl ? (
                <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
              ) : (
                <View style={[styles.productImage, styles.imagePlaceholder]}>
                  <Text style={styles.placeholderText}>{product.name[0]}</Text>
                </View>
              )}
              
              <View style={styles.productTitleSection}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productSku}>{product.sku}</Text>
                <Chip mode="flat" style={[styles.categoryChip, { marginTop: 8 }]}>
                  {product.category}
                </Chip>
              </View>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('product_details')}</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('pricing')}</Text>
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('cost_price')}</Text>
                  <Text style={styles.detailValue}>{formatAmount(product.cost)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('selling_price')}</Text>
                  <Text style={styles.detailValue}>{formatAmount(product.price)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('margin')}</Text>
                  <Text style={styles.detailValue}>
                    {(((product.price - product.cost) / product.cost) * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('inventory_status')}</Text>
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('current_stock')}</Text>
                  <Text style={[styles.detailValue, { color: stockColor }]}>
                    {product.quantity} {t('units')}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('reorder_point')}</Text>
                  <Text style={styles.detailValue}>{product.reorderPoint} {t('units')}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('status')}</Text>
                  <Text style={[styles.detailValue, { color: stockColor }]}>
                    {t(stockStatus)}
                  </Text>
                </View>
              </View>
              <ProgressBar 
                progress={Math.min(stockRatio, 3) / 3} 
                color={stockColor} 
                style={styles.stockProgressBar} 
              />
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('product_information')}</Text>
              <View style={styles.detailsList}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>{t('supplier')}</Text>
                  <Text style={styles.detailValue}>{product.supplier}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>{t('location')}</Text>
                  <Text style={styles.detailValue}>{product.location}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>{t('category')}</Text>
                  <Text style={styles.detailValue}>{product.category}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>{t('subcategory')}</Text>
                  <Text style={styles.detailValue}>{product.subcategory}</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            icon="pencil" 
            onPress={openEditModal} 
            style={[styles.button, styles.primaryButton]}
          >
            {t('edit_product')}
          </Button>
          <Button 
            mode="outlined" 
            icon="plus-minus" 
            onPress={openStockModal} 
            style={styles.button}
          >
            {t('adjust_stock')}
          </Button>
        </View>
      </ScrollView>

      {/* Modale d'édition de produit */}
      <Portal>
        <Modal visible={editModalVisible} onDismiss={closeEditModal}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('edit_product')}</Text>
            <TextInput
              label={t('name')}
              value={editedProduct.name}
              onChangeText={(text) => setEditedProduct({ ...editedProduct, name: text })}
              style={styles.modalInput}
            />
            <TextInput
              label={t('sku')}
              value={editedProduct.sku}
              onChangeText={(text) => setEditedProduct({ ...editedProduct, sku: text })}
              style={styles.modalInput}
            />
            <TextInput
              label={t('description')}
              value={editedProduct.description}
              onChangeText={(text) => setEditedProduct({ ...editedProduct, description: text })}
              style={styles.modalInput}
            />
            <TextInput
              label={t('cost_price') + ` (${currencyInfo.symbol})`}
              value={editedProduct.cost?.toString()}
              onChangeText={(text) => {
                const cost = parseFloat(text);
                setEditedProduct({ ...editedProduct, cost: isNaN(cost) ? editedProduct.cost : cost });
              }}
              keyboardType="decimal-pad"
              style={styles.modalInput}
            />
            <TextInput
              label={t('selling_price') + ` (${currencyInfo.symbol})`}
              value={editedProduct.price?.toString()}
              onChangeText={(text) => {
                const price = parseFloat(text);
                setEditedProduct({ ...editedProduct, price: isNaN(price) ? editedProduct.price : price });
              }}
              keyboardType="decimal-pad"
              style={styles.modalInput}
            />
            <TextInput
              label={t('reorder_point')}
              value={editedProduct.reorderPoint?.toString()}
              onChangeText={(text) => {
                const reorderPoint = parseInt(text, 10);
                setEditedProduct({ ...editedProduct, reorderPoint: isNaN(reorderPoint) ? editedProduct.reorderPoint : reorderPoint });
              }}
              keyboardType="number-pad"
              style={styles.modalInput}
            />
            <Button
              mode="contained"
              onPress={saveProductChanges}
              loading={isSaving}
              disabled={isSaving}
              style={styles.modalButton}
            >
              {t('save_changes')}
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Modale d'ajustement de stock */}
      <Portal>
        <Modal visible={stockModalVisible} onDismiss={closeStockModal}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('adjust_stock')}</Text>
            <SegmentedButtons
              value={adjustmentType}
              onValueChange={handleAdjustmentTypeChange}
              buttons={[
                { value: 'add', label: t('add_stock') },
                { value: 'remove', label: t('remove_stock') },
                { value: 'set', label: t('set_stock') },
              ]}
              style={styles.modalSegmentedButtons}
            />
            <TextInput
              label={t('quantity')}
              value={adjustmentQuantity}
              onChangeText={setAdjustmentQuantity}
              keyboardType="numeric"
              style={styles.modalInput}
            />
            <TextInput
              label={t('reason')}
              value={adjustmentReason}
              onChangeText={setAdjustmentReason}
              style={styles.modalInput}
            />
            <Button
              mode="contained"
              onPress={adjustStock}
              loading={isAdjusting}
              disabled={isAdjusting}
              style={styles.modalButton}
            >
              {t('confirm_adjustment')}
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
  },
  card: {
    margin: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  headerSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  imagePlaceholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#9e9e9e',
  },
  productTitleSection: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  productSku: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  detailItem: {
    minWidth: '30%',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stockProgressBar: {
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  detailsList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailKey: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    marginTop: 0,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#6200EE',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    marginBottom: 12,
  },
  modalButton: {
    marginTop: 16,
  },
  modalSegmentedButtons: {
    marginBottom: 12,
  },
});

export default ProductDetailsScreen;
