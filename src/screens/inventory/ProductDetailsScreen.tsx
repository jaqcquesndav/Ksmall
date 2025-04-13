import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Button, Card, Chip, Divider, ProgressBar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import AppHeader from '../../components/common/AppHeader';
import { inventoryMockData } from '../../data/mockData';

type Props = NativeStackScreenProps<MainStackParamList, 'ProductDetails'>;

const ProductDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { productId } = route.params;
  
  // Find the product in mock data
  const product = inventoryMockData.products.find(p => p.id === productId);
  
  if (!product) {
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
                  <Text style={styles.detailValue}>${product.cost.toFixed(2)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('selling_price')}</Text>
                  <Text style={styles.detailValue}>${product.price.toFixed(2)}</Text>
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
            onPress={() => {}} 
            style={[styles.button, styles.primaryButton]}
          >
            {t('edit_product')}
          </Button>
          <Button 
            mode="outlined" 
            icon="plus-minus" 
            onPress={() => {}} 
            style={styles.button}
          >
            {t('adjust_stock')}
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
});

export default ProductDetailsScreen;
