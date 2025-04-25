import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Chip, Searchbar, ActivityIndicator, FAB, SegmentedButtons, Snackbar, Appbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useNetInfo } from '@react-native-community/netinfo';
import { MainStackParamList } from '../../navigation/types';
import AppHeader from '../../components/common/AppHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DatabaseService from '../../services/DatabaseService';
import logger from '../../utils/logger';
import CurrencyAmount from '../../components/common/CurrencyAmount';
import { useCurrency } from '../../hooks/useCurrency';

// Import du hook API d'inventaire
import { useInventory } from '../../hooks/api/useInventory';

const InventoryScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const { formatAmount } = useCurrency();
  const netInfo = useNetInfo();
  const isConnected = netInfo.isConnected;
  
  const [activeTab, setActiveTab] = useState('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Utilisation du hook d'inventaire
  const inventory = useInventory();
  
  // Récupération des produits avec gestion du cache
  const { 
    data: products, 
    isLoading: isProductsLoading, 
    error: productsError,
    isFromCache: productsFromCache,
    refresh: refetchProducts
  } = inventory.useProducts({
    search: searchQuery
  });
  
  // Récupération des transactions (mouvements de stock)
  const {
    data: transactions,
    isLoading: isTransactionsLoading,
    error: transactionsError,
    isFromCache: transactionsFromCache,
    refresh: refetchTransactions
  } = inventory.useStockMovements();
  
  // Récupération des fournisseurs
  const {
    data: suppliers,
    isLoading: isSuppliersLoading,
    error: suppliersError,
    isFromCache: suppliersFromCache,
    refresh: refetchSuppliers
  } = inventory.useSuppliers();

  // État de chargement combiné
  const isLoading = isProductsLoading || isTransactionsLoading || isSuppliersLoading;
  
  // Fonction pour gérer les erreurs de chargement
  const handleLoadingError = (error, entityType) => {
    logger.error(`Erreur lors du chargement des ${entityType}:`, error);
    
    if (!isConnected) {
      setSnackbarMessage(t('offline_mode_enabled'));
      setSnackbarVisible(true);
    } else {
      Alert.alert(
        t('error'),
        t('error_loading_inventory_data'),
        [{ text: t('ok') }]
      );
    }
  };

  // Gestion des erreurs API
  useEffect(() => {
    if (productsError) handleLoadingError(productsError, 'produits');
    if (transactionsError) handleLoadingError(transactionsError, 'transactions');
    if (suppliersError) handleLoadingError(suppliersError, 'fournisseurs');
  }, [productsError, transactionsError, suppliersError]);

  // Initialiser la BD locale pour l'inventaire
  useEffect(() => {
    const initInventory = async () => {
      try {
        // Appel d'une méthode qui existe dans DatabaseService ou utilisation d'une alternative
        await DatabaseService.initDatabase();
        logger.info('Base de données initialisée pour l\'inventaire');
      } catch (error) {
        logger.error('Erreur lors de l\'initialisation des tables d\'inventaire:', error);
      }
    };

    initInventory();
  }, []);

  // Effet pour détecter les changements de connectivité
  useEffect(() => {
    if (isConnected === false) {
      setSnackbarMessage(t('offline_mode_enabled'));
      setSnackbarVisible(true);
    } else if (isConnected === true && (productsFromCache || transactionsFromCache || suppliersFromCache)) {
      setSnackbarMessage(t('using_cached_data'));
      setSnackbarVisible(true);
    }
  }, [isConnected, productsFromCache, transactionsFromCache, suppliersFromCache]);

  // Filtrer les produits selon la recherche
  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Fonction pour actualiser les données
  const refreshData = () => {
    if (activeTab === 'products') {
      refetchProducts();
    } else if (activeTab === 'transactions') {
      refetchTransactions();
    } else if (activeTab === 'suppliers') {
      refetchSuppliers();
    }
  };

  const renderProduct = ({ item }) => {
    const isLowStock = item.quantity <= item.reorderPoint;

    return (
      <Card 
        style={styles.productCard} 
        onPress={() => {
          navigation.navigate('ProductDetails' as any, { productId: item.id } as any);
        }}
      >
        {productsFromCache && (
          <View style={styles.cacheBadge}>
            <MaterialCommunityIcons name="database" size={12} color="#FFF" />
          </View>
        )}
        
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

  const renderTransaction = ({ item }) => {
    return (
      <Card 
        style={styles.transactionCard} 
        onPress={() => {
          navigation.navigate('TransactionDetails' as any, { transactionId: item.id } as any);
        }}
      >
        {transactionsFromCache && (
          <View style={styles.cacheBadge}>
            <MaterialCommunityIcons name="database" size={12} color="#FFF" />
          </View>
        )}
        
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
            <Text>{t('items_count', { count: item.items?.length || 0 })}</Text>
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

  const renderSupplier = ({ item }) => {
    return (
      <Card 
        style={styles.supplierCard} 
        onPress={() => {
          navigation.navigate('SupplierDetails' as any, { supplierId: item.id } as any);
        }}
      >
        {suppliersFromCache && (
          <View style={styles.cacheBadge}>
            <MaterialCommunityIcons name="database" size={12} color="#FFF" />
          </View>
        )}
        
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
      <AppHeader 
        title={t('inventory')} 
        showBack={false} 
        rightAction={
          <Appbar.Action 
            icon="refresh" 
            onPress={refreshData}
            disabled={isLoading} 
          />
        }
      />
      
      {/* Indicateur de mode hors ligne ou données issues du cache */}
      {(!isConnected || productsFromCache || transactionsFromCache || suppliersFromCache) && (
        <View style={styles.offlineIndicator}>
          <MaterialCommunityIcons 
            name={isConnected ? "database" : "wifi-off"} 
            size={16} 
            color="#FFF" 
          />
          <Text style={styles.offlineText}>
            {isConnected ? t('using_cached_data') : t('offline_mode')}
          </Text>
        </View>
      )}
      
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
      
      {isLoading ? (
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
                keyExtractor={(item) => item.id.toString()}
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
                disabled={!isConnected}
              />
            </>
          )}
          
          {activeTab === 'transactions' && (
            <>
              <FlatList
                data={transactions || []}
                keyExtractor={(item) => item.id.toString()}
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
                disabled={!isConnected}
              />
            </>
          )}
          
          {activeTab === 'suppliers' && (
            <>
              <FlatList
                data={suppliers || []}
                keyExtractor={(item) => item.id.toString()}
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
                disabled={!isConnected}
              />
            </>
          )}
        </>
      )}

      {/* Snackbar pour les notifications */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: t('ok'),
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
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
    position: 'relative',
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
    position: 'relative',
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
    position: 'relative',
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
  // Offline indicator
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    padding: 4,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  offlineText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  cacheBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});

export default InventoryScreen;
