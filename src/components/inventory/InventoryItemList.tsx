import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, DataTable, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/formatters';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  cost: number;
  category?: string;
  location?: string;
  lastUpdated?: string;
}

export interface InventoryData {
  title?: string;
  items: InventoryItem[];
  totalValue?: number;
  currencyCode?: string;
  summary?: string;
}

interface InventoryItemListProps {
  data: InventoryData;
  onItemPress?: (item: InventoryItem) => void;
}

const InventoryItemList: React.FC<InventoryItemListProps> = ({
  data,
  onItemPress
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  
  // Use provided totalValue or calculate if not provided
  const totalValue = data.totalValue ?? data.items.reduce(
    (sum, item) => sum + (item.price * item.quantity), 
    0
  );
  
  const currencyCode = data.currencyCode || 'USD';

  return (
    <Card style={styles.container}>
      <Card.Content>
        <Text style={styles.title}>
          {data.title || t('inventory_items')}
        </Text>
        
        {data.summary && (
          <Text style={styles.summary}>{data.summary}</Text>
        )}
        
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>{t('item')}</DataTable.Title>
            <DataTable.Title>{t('description')}</DataTable.Title>
            <DataTable.Title numeric>{t('quantity')}</DataTable.Title>
            <DataTable.Title numeric>{t('price')}</DataTable.Title>
            <DataTable.Title numeric>{t('value')}</DataTable.Title>
          </DataTable.Header>
          
          {data.items.map((item) => (
            <DataTable.Row 
              key={item.id} 
              onPress={() => onItemPress?.(item)}
            >
              <DataTable.Cell>{item.name}</DataTable.Cell>
              <DataTable.Cell>{item.description || '-'}</DataTable.Cell>
              <DataTable.Cell numeric>{item.quantity}</DataTable.Cell>
              <DataTable.Cell numeric>{formatCurrency(item.price, currencyCode)}</DataTable.Cell>
              <DataTable.Cell numeric>{formatCurrency(item.quantity * item.price, currencyCode)}</DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {`${t('total_items')}: ${data.items.length}`}
          </Text>
          
          <Text style={styles.footerText}>
            {`${t('total_value')}: ${formatCurrency(totalValue, currencyCode)}`}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summary: {
    fontSize: 14,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InventoryItemList;
