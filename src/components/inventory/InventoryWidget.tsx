import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Card, Button, useTheme, IconButton, DataTable } from 'react-native-paper';
import { InventoryItem } from './InventoryItemList'; // Correct type for inventory items

// Define props for the widget
interface InventoryWidgetProps {
  items: InventoryItem[];
}

const ITEMS_PER_PAGE = 5;
const numberOfItemsPerPageList = [5, 10, 15];

const InventoryWidget: React.FC<InventoryWidgetProps> = ({ items: initialItems }) => {
  const theme = useTheme();
  const [page, setPage] = useState<number>(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(ITEMS_PER_PAGE);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>(initialItems);
  const [paginatedItems, setPaginatedItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    setFilteredItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    const from = page * itemsPerPage;
    const to = Math.min((page + 1) * itemsPerPage, filteredItems.length);
    setPaginatedItems(filteredItems.slice(from, to));
  }, [page, itemsPerPage, filteredItems]);

  const onItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setPage(0);
  };

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, filteredItems.length);

  return (
    <Card style={styles.card}>
      <Card.Title title="Inventory" />
      <Card.Content>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Name</DataTable.Title>
            <DataTable.Title numeric>Quantity</DataTable.Title>
            <DataTable.Title numeric>Total Price</DataTable.Title>
          </DataTable.Header>

          {paginatedItems.map((item) => (
            <DataTable.Row key={item.id}>
              <DataTable.Cell>{item.name}</DataTable.Cell>
              <DataTable.Cell numeric>{item.quantity}</DataTable.Cell>
              <DataTable.Cell numeric>{`$${(item.quantity * (item.price || 0)).toFixed(2)}`}</DataTable.Cell>
            </DataTable.Row>
          ))}

          <DataTable.Pagination
            page={page}
            numberOfPages={Math.ceil(filteredItems.length / itemsPerPage)}
            onPageChange={(newPage) => setPage(newPage)}
            label={`${from + 1}-${to} of ${filteredItems.length}`}
            numberOfItemsPerPageList={numberOfItemsPerPageList}
            numberOfItemsPerPage={itemsPerPage}
            onItemsPerPageChange={onItemsPerPageChange}
            showFastPaginationControls
          />
        </DataTable>
      </Card.Content>
      <View style={styles.actions}>
        <Button onPress={() => console.log('Add Item Pressed')}>Add Item</Button>
        <Button onPress={() => console.log('View All Pressed')}>View All</Button>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
  },
});

export default InventoryWidget;
