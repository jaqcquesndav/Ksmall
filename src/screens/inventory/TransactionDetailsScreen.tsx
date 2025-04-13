import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Chip, Divider, DataTable } from 'react-native-paper';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import AppHeader from '../../components/common/AppHeader';
import { inventoryMockData } from '../../data/mockData';
import { MainStackParamList } from '../../navigation/types';

type TransactionDetailsRouteProp = RouteProp<MainStackParamList, 'TransactionDetails'>;

const TransactionDetailsScreen: React.FC = () => {
  const route = useRoute<TransactionDetailsRouteProp>();
  const navigation = useNavigation();
  const { transactionId } = route.params;

  // Find the transaction in mock data
  const transaction = inventoryMockData.transactions.find(t => t.id === transactionId);

  if (!transaction) {
    return (
      <View style={styles.container}>
        <AppHeader title="Transaction Details" showBack />
        <View style={styles.notFoundContainer}>
          <Text>Transaction not found</Text>
          <Button mode="contained" style={styles.button} onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  // Get products info for this transaction
  const itemsWithDetails = transaction.items.map(item => {
    const product = inventoryMockData.products.find(p => p.id === item.productId);
    return { ...item, product };
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'purchase': return '#2196F3';
      case 'sale': return '#4CAF50';
      case 'adjustment': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Transaction Details" showBack />
      
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerSection}>
              <View>
                <Text style={styles.transactionReference}>{transaction.reference}</Text>
                <Text style={styles.transactionDate}>{transaction.date}</Text>
              </View>
              <Chip
                mode="flat"
                style={[styles.typeChip, { backgroundColor: getTypeColor(transaction.type) + '20' }]}
                textStyle={{ color: getTypeColor(transaction.type) }}
              >
                {transaction.type}
              </Chip>
            </View>
            
            <View style={styles.statusSection}>
              <Text style={styles.statusLabel}>Status</Text>
              <Chip
                mode="flat"
                style={[styles.statusChip, { backgroundColor: getStatusColor(transaction.status) + '20' }]}
                textStyle={{ color: getStatusColor(transaction.status) }}
              >
                {transaction.status}
              </Chip>
            </View>
            
            {(transaction.type === 'purchase' || transaction.type === 'sale') && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {transaction.type === 'purchase' ? 'Supplier' : 'Customer'}
                  </Text>
                  <Text style={styles.contactName}>
                    {transaction.type === 'purchase' ? transaction.supplier : transaction.customer}
                  </Text>
                </View>
              </>
            )}
            
            <Divider style={styles.divider} />
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Items</Text>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Product</DataTable.Title>
                  <DataTable.Title numeric>Quantity</DataTable.Title>
                  <DataTable.Title numeric>Unit Price</DataTable.Title>
                  <DataTable.Title numeric>Total</DataTable.Title>
                </DataTable.Header>
                
                {itemsWithDetails.map((item, index) => (
                  <DataTable.Row key={`item-${index}`}>
                    <DataTable.Cell>
                      {item.product?.name || `Product ${item.productId}`}
                    </DataTable.Cell>
                    <DataTable.Cell numeric>{item.quantity}</DataTable.Cell>
                    <DataTable.Cell numeric>
                      {'unitCost' in item ? `$${item.unitCost.toFixed(2)}` : 
                       'unitPrice' in item ? `$${item.unitPrice.toFixed(2)}` : '-'}
                    </DataTable.Cell>
                    <DataTable.Cell numeric>
                      {'totalCost' in item ? `$${item.totalCost.toFixed(2)}` : 
                       'totalPrice' in item ? `$${item.totalPrice.toFixed(2)}` : '-'}
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
                
                {transaction.totalAmount > 0 && (
                  <DataTable.Row style={styles.totalRow}>
                    <DataTable.Cell>Total</DataTable.Cell>
                    <DataTable.Cell numeric>{''}</DataTable.Cell>
                    <DataTable.Cell numeric>{''}</DataTable.Cell>
                    <DataTable.Cell numeric>
                      ${transaction.totalAmount.toFixed(2)}
                    </DataTable.Cell>
                  </DataTable.Row>
                )}
              </DataTable>
            </View>
            
            {transaction.notes && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  <Text style={styles.notes}>{transaction.notes}</Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            icon="pencil" 
            onPress={() => {}} 
            style={[styles.button, styles.primaryButton]}
          >
            Edit
          </Button>
          <Button 
            mode="outlined" 
            icon="printer" 
            onPress={() => {}} 
            style={styles.button}
          >
            Print
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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  transactionReference: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  typeChip: {
    alignSelf: 'flex-start',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  statusChip: {
    marginVertical: 4,
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
  contactName: {
    fontSize: 16,
  },
  totalRow: {
    backgroundColor: '#f0f0f0',
  },
  notes: {
    fontSize: 14,
    color: '#444',
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

export default TransactionDetailsScreen;
