import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Chip, Searchbar, ActivityIndicator, FAB, SegmentedButtons } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { MainStackParamList } from '../../navigation/types';
import AppHeader from '../../components/common/AppHeader';
import { inventoryMockData } from '../../data/mockData';
import logger from '../../utils/logger';

const InventoryScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('products');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadInventoryData = async () => {
      try {
        logger.info('Loading inventory data');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setInventoryData(inventoryMockData);
      } catch (error) {
        logger.error('Error loading inventory data', error);
      } finally {
        setLoading(false);
      }
    };

    loadInventoryData();
  }, []);

  const filteredProducts = inventoryData?.products?.filter((product: any) => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const renderProduct = ({ item }: { item: any }) => {
    const isLowStock = item.quantity <= item.reorderPoint;

    return (
      <Card 
        style={styles.productCard} 
        onPress={() => {
          navigation.navigate('ProductDetails', { productId: item.id });
        }}
      >
        <Card.Content>
          <View style={styles.productHeader}>
            <View>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productSku}>{item.sku}</Text>
            </View>
            {isLowStock && (
              <Chip mode="flat" style={styles.lowStockChip}>
                {t('low_stock')}
              </Chip>
            )}
          </View>
          
          <View style={styles.productDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('quantity')}</Text>
              <Text style={styles.detailValue}>{item.quantity}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('cost')}</Text>
              <Text style={styles.detailValue}>${item.cost.toFixed(2)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('price')}</Text>
              <Text style={styles.detailValue}>${item.price.toFixed(2)}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderTransaction = ({ item }: { item: any }) => (
    <Card 
      style={styles.transactionCard} 
      onPress={() => {
        navigation.navigate('TransactionDetails', { transactionId: item.id });
      }}
    >
      <Card.Content>
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionType}>
            {item.type === 'purchase' ? t('purchase') : item.type === 'sale' ? t('sale') : t('adjustment')}
          </Text>
          <Text style={styles.transactionDate}>{item.date}</Text>
        </View>
        <Text style={styles.transactionRef}>{item.reference}</Text>
        <View style={styles.transactionDetails}>
          <Text>{t('items')}: {item.items.length}</Text>
          <Text style={styles.transactionAmount}>
            ${(item.totalAmount || 0).toFixed(2)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderSupplier = ({ item }: { item: any }) => (
    <Card style={styles.supplierCard}>
      <Card.Content>
        <Text style={styles.supplierName}>{item.name}</Text>
        <Text style={styles.supplierContact}>{item.contactPerson}</Text>
        <View style={styles.contactDetails}>
          <Text style={styles.contactText}>{item.email}</Text>
          <Text style={styles.contactText}>{item.phone}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title={t('inventory')} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200EE" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title={t('inventory')} />
      
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'products', label: t('products') },
          { value: 'transactions', label: t('transactions') },
          { value: 'suppliers', label: t('suppliers') },
        ]}
        style={styles.segmentedButtons}
      />

      {activeTab === 'products' && (
        <>
          <Searchbar
            placeholder={t('search_products')}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={renderProduct}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{t('no_products_found')}</Text>
            }
          />
          
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={() => {
              navigation.navigate('AddProduct');
            }}
          />
        </>
      )}
      
      {activeTab === 'transactions' && (
        <FlatList
          data={inventoryData?.transactions || []}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{t('no_transactions_found')}</Text>
          }
        />
      )}
      
      {activeTab === 'suppliers' && (
        <FlatList
          data={inventoryData?.suppliers || []}
          keyExtractor={(item) => item.id}
          renderItem={renderSupplier}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{t('no_suppliers_found')}</Text>
          }
        />
      )}
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
  },
  segmentedButtons: {
    margin: 16,
  },
  searchbar: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  productCard: {
    marginBottom: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productSku: {
    fontSize: 12,
    color: '#666',
  },
  lowStockChip: {
    backgroundColor: '#FFEBEE',
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  transactionCard: {
    marginBottom: 16,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionType: {
    fontWeight: 'bold',
    color: '#6200EE',
  },
  transactionDate: {
    color: '#666',
  },
  transactionRef: {
    marginVertical: 8,
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  transactionAmount: {
    fontWeight: 'bold',
  },
  supplierCard: {
    marginBottom: 16,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  supplierContact: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  contactDetails: {
    marginTop: 8,
  },
  contactText: {
    fontSize: 14,
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default InventoryScreen;
