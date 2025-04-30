import React, { useState, useCallback, memo } from 'react';
import { View, StyleSheet, Text, TextInput } from 'react-native';
import { Card, DataTable, Button, useTheme, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { InventoryData } from '../chat/DynamicResponseBuilder';

interface InventoryWidgetProps {
  data: InventoryData;
  status?: 'pending' | 'validated' | 'error';
  onValidate?: () => void;
  isEditing?: boolean;
  onEditChange?: (data: InventoryData) => void;
}

// Memoize individual rows to prevent unnecessary re-renders
const InventoryRow = memo(({ 
  item, 
  index, 
  isEditing, 
  updateItem, 
  removeItem 
}: { 
  item: any, 
  index: number, 
  isEditing: boolean, 
  updateItem: (index: number, field: string, value: any) => void, 
  removeItem: (index: number) => void 
}) => {
  return (
    <DataTable.Row>
      {isEditing ? (
        <>
          <DataTable.Cell>
            <TextInput
              style={styles.textInput}
              value={item.name}
              onChangeText={(text) => updateItem(index, 'name', text)}
              placeholder="Nom du produit"
            />
          </DataTable.Cell>
          <DataTable.Cell numeric>
            <TextInput
              style={[styles.textInput, styles.numberInput]}
              value={item.quantity.toString()}
              onChangeText={(text) => updateItem(index, 'quantity', text)}
              keyboardType="numeric"
              placeholder="0"
            />
          </DataTable.Cell>
          <DataTable.Cell numeric>
            <TextInput
              style={[styles.textInput, styles.numberInput]}
              value={item.price.toString()}
              onChangeText={(text) => updateItem(index, 'price', text)}
              keyboardType="numeric"
              placeholder="0.00"
            />
          </DataTable.Cell>
          <DataTable.Cell numeric>
            <Text>€{(item.quantity * item.price).toFixed(2)}</Text>
          </DataTable.Cell>
          <DataTable.Cell style={{ width: 40 }}>
            <IconButton
              icon="minus-circle"
              size={16}
              onPress={() => removeItem(index)}
            />
          </DataTable.Cell>
        </>
      ) : (
        <>
          <DataTable.Cell>{item.name}</DataTable.Cell>
          <DataTable.Cell numeric>{item.quantity}</DataTable.Cell>
          <DataTable.Cell numeric>€{item.price.toFixed(2)}</DataTable.Cell>
          <DataTable.Cell numeric>€{(item.quantity * item.price).toFixed(2)}</DataTable.Cell>
        </>
      )}
    </DataTable.Row>
  );
});

const InventoryWidget: React.FC<InventoryWidgetProps> = ({ 
  data, 
  status, 
  onValidate,
  isEditing = false,
  onEditChange
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [localData, setLocalData] = useState<InventoryData>(data);

  // Memoize functions to prevent recreation on each render
  const updateLocalData = useCallback((newData: Partial<InventoryData>) => {
    const updated = { ...localData, ...newData };
    setLocalData(updated);
    if (onEditChange) onEditChange(updated);
  }, [localData, onEditChange]);

  const updateItem = useCallback((index: number, field: string, value: any) => {
    const newItems = [...localData.items];
    newItems[index] = { ...newItems[index], [field]: field === 'name' ? value : parseFloat(value) || 0 };
    
    // Recalculate total value
    const totalValue = newItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    updateLocalData({ items: newItems, totalValue });
  }, [localData, updateLocalData]);

  const addItem = useCallback(() => {
    // Generate a unique ID for the new item
    const newId = `item-${Date.now()}`;
    const newItems = [...localData.items, { id: newId, name: '', quantity: 0, price: 0 }];
    updateLocalData({ items: newItems });
  }, [localData, updateLocalData]);

  const removeItem = useCallback((index: number) => {
    const newItems = localData.items.filter((_, i) => i !== index);
    
    // Recalculate total value
    const totalValue = newItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    updateLocalData({ items: newItems, totalValue });
  }, [localData, updateLocalData]);

  // Utiliser les données locales si en mode édition, sinon utiliser les données fournies
  const displayData = isEditing ? localData : data;

  return (
    <Card style={styles.container}>
      <Card.Title title={t('inventory_update')} />
      <Card.Content>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>{t('product')}</DataTable.Title>
            <DataTable.Title numeric>{t('quantity')}</DataTable.Title>
            <DataTable.Title numeric>{t('price')}</DataTable.Title>
            <DataTable.Title numeric>{t('total')}</DataTable.Title>
            {isEditing && (
              <DataTable.Title style={{ width: 40 }}>
                <Text></Text>
              </DataTable.Title>
            )}
          </DataTable.Header>

          {displayData.items.map((item, index) => (
            <InventoryRow 
              key={item.id} 
              item={item} 
              index={index} 
              isEditing={isEditing}
              updateItem={updateItem}
              removeItem={removeItem}
            />
          ))}

          {isEditing && (
            <View style={styles.addButtonContainer}>
              <Button
                mode="text"
                icon="plus"
                onPress={addItem}
              >
                {t('add_item')}
              </Button>
            </View>
          )}

          <DataTable.Row style={styles.totalRow}>
            <DataTable.Cell>
              <Text style={styles.totalLabel}>{t('total_value')}</Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text></Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text></Text>
            </DataTable.Cell>
            <DataTable.Cell numeric>
              <Text style={styles.totalValue}>€{displayData.totalValue.toFixed(2)}</Text>
            </DataTable.Cell>
            {isEditing && (
              <DataTable.Cell style={{ width: 40 }}>
                <Text></Text>
              </DataTable.Cell>
            )}
          </DataTable.Row>
        </DataTable>

        {status === 'pending' && !isEditing && (
          <Button 
            mode="contained" 
            style={styles.validateButton}
            onPress={onValidate}
          >
            {t('validate_inventory')}
          </Button>
        )}

        {status === 'validated' && (
          <Text style={[styles.statusText, { color: theme.colors.primary }]}>
            {t('inventory_validated')}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalValue: {
    fontWeight: 'bold',
  },
  validateButton: {
    marginTop: 16,
    alignSelf: 'flex-end',
  },
  statusText: {
    marginTop: 16,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginVertical: 2,
    minWidth: 80,
  },
  numberInput: {
    width: 60,
    textAlign: 'right',
  },
  addButtonContainer: {
    marginVertical: 8,
    alignItems: 'center',
  },
});

// Exporter un composant mémorisé pour éviter les re-rendus inutiles
export default memo(InventoryWidget);
