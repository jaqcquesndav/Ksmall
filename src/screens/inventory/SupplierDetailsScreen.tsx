import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Divider, List, Avatar, IconButton } from 'react-native-paper';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AppHeader from '../../components/common/AppHeader';
import { inventoryMockData } from '../../data/mockData';
import { MainStackParamList } from '../../navigation/types';

type SupplierDetailsRouteProp = RouteProp<MainStackParamList, 'SupplierDetails'>;

const SupplierDetailsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<SupplierDetailsRouteProp>();
  const { supplierId } = route.params;
  
  // Trouver le fournisseur dans les données simulées
  const supplier = inventoryMockData.suppliers.find(s => s.id === supplierId);
  
  if (!supplier) {
    return (
      <View style={styles.container}>
        <AppHeader title={t('supplier_details')} showBack />
        <View style={styles.notFoundContainer}>
          <Text>{t('supplier_not_found')}</Text>
          <Button mode="contained" style={styles.button} onPress={() => navigation.goBack()}>
            {t('go_back')}
          </Button>
        </View>
      </View>
    );
  }

  // Transactions liées à ce fournisseur
  const relatedTransactions = inventoryMockData.transactions.filter(
    t => t.type === 'purchase' && t.supplier === supplier.name
  );

  return (
    <View style={styles.container}>
      <AppHeader title={t('supplier_details')} showBack />
      
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerSection}>
              <Avatar.Text 
                size={50} 
                label={supplier.name.substring(0, 2).toUpperCase()} 
                style={styles.avatar}
              />
              <View style={styles.supplierInfoSection}>
                <Text style={styles.supplierName}>{supplier.name}</Text>
                <Text style={styles.contactPerson}>{supplier.contactPerson}</Text>
              </View>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('contact_information')}</Text>
              
              <List.Item
                title={t('phone')}
                description={supplier.phone}
                left={props => <List.Icon {...props} icon="phone" />}
                onPress={() => {}}
              />
              
              <List.Item
                title={t('email')}
                description={supplier.email}
                left={props => <List.Icon {...props} icon="email" />}
                onPress={() => {}}
              />
              
              <List.Item
                title={t('address')}
                description={supplier.address}
                left={props => <List.Icon {...props} icon="map-marker" />}
                onPress={() => {}}
              />
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('supplier_details')}</Text>
              
              <List.Item
                title={t('payment_terms')}
                description={supplier.paymentTerms || t('not_specified')}
                left={props => <List.Icon {...props} icon="cash-multiple" />}
              />
              
              <List.Item
                title={t('products_supplied')}
                description={`${supplier.productCategories?.join(', ') || t('not_specified')}`}
                left={props => <List.Icon {...props} icon="package-variant" />}
              />
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('purchase_history')}</Text>
              
              {relatedTransactions.length > 0 ? (
                relatedTransactions.map((transaction, index) => (
                  <List.Item
                    key={transaction.id}
                    title={transaction.reference}
                    description={`${transaction.date} - ${transaction.items.length} ${t('items')}`}
                    left={props => <List.Icon {...props} icon="receipt" />}
                    right={() => (
                      <View>
                        <Text style={styles.transactionAmount}>
                          {new Intl.NumberFormat('fr-CI', { 
                            style: 'currency', 
                            currency: 'XOF' 
                          }).format(transaction.totalAmount)}
                        </Text>
                      </View>
                    )}
                    onPress={() => navigation.navigate('TransactionDetails', { transactionId: transaction.id })}
                  />
                ))
              ) : (
                <Text style={styles.noDataText}>{t('no_purchase_history')}</Text>
              )}
            </View>
          </Card.Content>
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            icon="pencil" 
            onPress={() => {}} 
            style={styles.editButton}
          >
            {t('edit_supplier')}
          </Button>
          <Button 
            mode="outlined" 
            icon="plus" 
            onPress={() => navigation.navigate('AddProduct' as never)}
            style={styles.orderButton}
          >
            {t('new_purchase_order')}
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
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#2196F3',
    marginRight: 16,
  },
  supplierInfoSection: {
    flex: 1,
  },
  supplierName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactPerson: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  noDataText: {
    fontStyle: 'italic',
    color: '#666',
    marginVertical: 8,
  },
  transactionAmount: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    marginRight: 8,
  },
  orderButton: {
    flex: 1,
    marginLeft: 8,
  },
  button: {
    marginTop: 16,
  },
});

export default SupplierDetailsScreen;