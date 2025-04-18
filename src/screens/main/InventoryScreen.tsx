import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Chip, Searchbar, ActivityIndicator, FAB, SegmentedButtons } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { MainStackParamList } from '../../navigation/types';
import AppHeader from '../../components/common/AppHeader';
import InventoryService from '../../services/InventoryService';
import { InventoryItem, InventoryTransaction, Supplier } from '../../services/InventoryService';
import DatabaseService from '../../services/DatabaseService';
import logger from '../../utils/logger';
import CurrencyAmount from '../../components/common/CurrencyAmount';
import { useCurrency } from '../../hooks/useCurrency';

const InventoryScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const { formatAmount } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [activeTab, setActiveTab] = useState('products');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Initialiser les tables d'inventaire au démarrage
    const initInventory = async () => {
      try {
        await DatabaseService.initInventoryTables();
      } catch (error) {
        logger.error('Erreur lors de l\'initialisation des tables d\'inventaire:', error);
      }
    };

    initInventory();
  }, []);

  useEffect(() => {
    const loadInventoryData = async () => {
      try {
        setLoading(true);
        logger.info('Chargement des données d\'inventaire');
        
        // Charger les données en parallèle pour de meilleures performances
        const [productsData, transactionsData, suppliersData] = await Promise.all([
          InventoryService.getProducts(),
          InventoryService.getInventoryTransactions(),
          InventoryService.getSuppliers()
        ]);
        
        setProducts(productsData);
        setTransactions(transactionsData);
        setSuppliers(suppliersData);
        
        logger.info(`Données chargées: ${productsData.length} produits, ${transactionsData.length} transactions, ${suppliersData.length} fournisseurs`);
      } catch (error) {
        logger.error('Erreur lors du chargement des données d\'inventaire:', error);
        Alert.alert(
          t('error'),
          t('error_loading_inventory_data'),
          [{ text: t('ok') }]
        );
      } finally {
        setLoading(false);
      }
    };

    loadInventoryData();
  }, [t]);

  // Filtrer les produits selon la recherche
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProduct = ({ item }: { item: InventoryItem }) => {
    const isLowStock = item.quantity <= item.reorderPoint;

    return (
      <Card 
        style={styles.productCard} 
        onPress={() => {
          navigation.navigate('ProductDetails' as any, { productId: item.id } as any);
        }}
      >
        <Card.Content>
          <View style={styles.productHeader}>
            <View>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productSku}>{item.sku}</Text>
            </View>
            {isLowStock && (
              <Chip icon="alert" mode="outlined" style={styles.lowStockChip}>
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
              <Text style={styles.detailLabel}>{t('price')}</Text>
              <Text style={styles.detailValue}>{formatAmount(item.price)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('category')}</Text>
              <Text style={styles.detailValue}>{item.category}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderTransaction = ({ item }: { item: InventoryTransaction }) => {
    return (
      <Card 
        style={styles.transactionCard} 
        onPress={() => {
          navigation.navigate('TransactionDetails' as any, { transactionId: item.id } as any);
        }}
      >
        <Card.Content>
          <View style={styles.transactionHeader}>
            <View>
              <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString()}</Text>
              <Text style={styles.transactionReference}>{item.reference}</Text>
            </View>
            
            <Chip mode="outlined" style={styles.typeChip}>
              {t(item.type)}
            </Chip>
          </View>
          
          <View style={styles.transactionDetails}>
            <Text>{t('items_count', { count: item.items.length })}</Text>
            {item.totalAmount > 0 && (
              <Text style={styles.transactionAmount}>{formatAmount(item.totalAmount)}</Text>
            )}
          </View>
          
          <Text style={styles.transactionStatus}>
            {t(`status_${item.status}`)}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  const renderSupplier = ({ item }: { item: Supplier }) => {
    return (
      <Card 
        style={styles.supplierCard} 
        onPress={() => {
          navigation.navigate('SupplierDetails' as any, { supplierId: item.id } as any);
        }}
      >
        <Card.Content>
          <Text style={styles.supplierName}>{item.name}</Text>
          <Text style={styles.supplierContactName}>{item.contactPerson}</Text>
          
          <View style={styles.supplierDetails}>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>{t('phone')}</Text>
              <Text style={styles.contactValue}>{item.phone}</Text>
            </View>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>{t('email')}</Text>
              <Text style={styles.contactValue}>{item.email}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('inventory')} showBack={false} />
      
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
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>{t('loading_data')}</Text>
        </View>
      ) : (
        <>
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
                  navigation.navigate('AddProduct' as any);
                }}
              />
            </>
          )}
          
          {activeTab === 'transactions' && (
            <>
              <FlatList
                data={transactions}
                keyExtractor={(item) => item.id}
                renderItem={renderTransaction}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>{t('no_transactions_found')}</Text>
                }
              />
              
              <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => {
                  navigation.navigate('CreateTransaction' as any);
                }}
              />
            </>
          )}
          
          {activeTab === 'suppliers' && (
            <>
              <FlatList
                data={suppliers}
                keyExtractor={(item) => item.id}
                renderItem={renderSupplier}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>{t('no_suppliers_found')}</Text>
                }
              />
              
              <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => {
                  navigation.navigate('AddSupplier' as any);
                }}
              />
            </>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  segmentedButtons: {
    margin: 16,
    marginBottom: 8,
  },
  searchbar: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  // Produits
  productCard: {
    marginBottom: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productSku: {
    fontSize: 14,
    color: '#666',
  },
  lowStockChip: {
    backgroundColor: '#ffecb3',
  },
  productDetails: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    color: '#666',
  },
  detailValue: {
    fontWeight: '500',
  },
  // Transactions
  transactionCard: {
    marginBottom: 16,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  transactionDate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionReference: {
    fontSize: 14,
    color: '#666',
  },
  typeChip: {
    minWidth: 80,
    alignItems: 'center',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  transactionAmount: {
    fontWeight: '500',
  },
  transactionStatus: {
    marginTop: 4,
    fontStyle: 'italic',
    color: '#666',
  },
  // Suppliers
  supplierCard: {
    marginBottom: 16,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  supplierContactName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  supplierDetails: {
    marginTop: 8,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  contactLabel: {
    color: '#666',
  },
  contactValue: {
    fontWeight: '500',
  },
});

export default InventoryScreen;
