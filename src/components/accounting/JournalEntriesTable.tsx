import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  total_debit: number;
  line_count: number;
  status?: 'pending' | 'validated' | 'rejected';
}

interface JournalEntriesTableProps {
  entries: JournalEntry[];
  theme: any;
  onPressEntry: (entryId: string) => void;
}

const JournalEntriesTable: React.FC<JournalEntriesTableProps> = ({
  entries,
  theme,
  onPressEntry,
}) => {
  const renderTableHeader = () => (
    <View style={[styles.tableHeader, { backgroundColor: theme.colors.background + '80' }]}>
      <Text style={[styles.headerText, { color: theme.colors.text }]}>Date</Text>
      <Text style={[styles.headerText, { color: theme.colors.text, flex: 1.5 }]}>Référence</Text>
      <Text style={[styles.headerText, { color: theme.colors.text, flex: 2 }]}>Description</Text>
      <Text style={[styles.headerText, { color: theme.colors.text, textAlign: 'right' }]}>Montant</Text>
      <View style={{ width: 30 }} />
    </View>
  );

  const renderEntry = ({ item }: { item: JournalEntry }) => {
    // Format date for display
    const dateObj = new Date(item.date);
    const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Determine status icon if available
    let statusIcon = null;
    if (item.status) {
      let iconName = 'ellipse';
      let iconColor = theme.colors.text;
      
      switch (item.status) {
        case 'validated':
          iconName = 'checkmark-circle';
          iconColor = theme.colors.success;
          break;
        case 'rejected':
          iconName = 'close-circle';
          iconColor = theme.colors.error;
          break;
        case 'pending':
          iconName = 'time';
          iconColor = theme.colors.warning;
          break;
      }
      
      statusIcon = <Ionicons name={iconName} size={16} color={iconColor} style={styles.statusIcon} />;
    }
    
    return (
      <TouchableOpacity
        style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}
        onPress={() => onPressEntry(item.id)}
      >
        <Text style={[styles.dateText, { color: theme.colors.text }]}>{formattedDate}</Text>
        
        <View style={[styles.referenceContainer, { flex: 1.5 }]}>
          {statusIcon}
          <Text style={{ color: theme.colors.text }} numberOfLines={1}>{item.reference}</Text>
        </View>
        
        <Text 
          style={[styles.descriptionText, { color: theme.colors.text + '99', flex: 2 }]}
          numberOfLines={1}
        >
          {item.description}
        </Text>
        
        <Text style={[styles.amountText, { color: theme.colors.text }]}>
          {item.total_debit.toLocaleString()}
        </Text>
        
        <Ionicons name="chevron-forward" size={18} color={theme.colors.text + '80'} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {renderTableHeader()}
      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={item => item.id}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 5,
  },
  descriptionText: {
    fontSize: 14,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
});

export default JournalEntriesTable;
