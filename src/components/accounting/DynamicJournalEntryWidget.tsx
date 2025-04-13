import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, DataTable } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate } from '../../utils/formatters';

// Define the journal entry structure
export interface JournalEntryLine {
  id: string;
  accountCode: string;
  description: string;
  debit: number;
  credit: number;
  taxCode?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  lines: JournalEntryLine[];
  currency: string;
}

interface DynamicJournalEntryWidgetProps {
  data: JournalEntry;
  readOnly?: boolean;
}

const DynamicJournalEntryWidget: React.FC<DynamicJournalEntryWidgetProps> = ({
  data,
  readOnly = false
}) => {
  const { t } = useTranslation();

  const calculateTotals = () => {
    let totalDebit = 0;
    let totalCredit = 0;
    data.lines.forEach(line => {
      totalDebit += line.debit || 0;
      totalCredit += line.credit || 0;
    });
    return { totalDebit, totalCredit };
  };

  const { totalDebit, totalCredit } = calculateTotals();

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.title}>{t('journal_entry')}</Text>
        <View style={styles.headerInfo}>
          <View>
            <Text style={styles.label}>{t('date')}:</Text>
            <Text style={styles.value}>{formatDate(data.date)}</Text>
          </View>
          <View>
            <Text style={styles.label}>{t('reference')}:</Text>
            <Text style={styles.value}>{data.reference || 'N/A'}</Text>
          </View>
        </View>
        <Text style={styles.label}>{t('description')}:</Text>
        <Text style={styles.valueDescription} numberOfLines={2}>
          {data.description}
        </Text>

        <DataTable style={styles.table}>
          <DataTable.Header>
            <DataTable.Title>{t('account')}</DataTable.Title>
            <DataTable.Title>{t('description')}</DataTable.Title>
            <DataTable.Title numeric>{t('debit')}</DataTable.Title>
            <DataTable.Title numeric>{t('credit')}</DataTable.Title>
            <DataTable.Title numeric>{t('tax_code')}</DataTable.Title>
          </DataTable.Header>

          {data.lines.map((line, index) => (
            <DataTable.Row key={line.id || `line-${index}`}>
              <DataTable.Cell>{line.accountCode}</DataTable.Cell>
              <DataTable.Cell>{line.description}</DataTable.Cell>
              <DataTable.Cell numeric>{formatCurrency(line.debit || 0)}</DataTable.Cell>
              <DataTable.Cell numeric>{formatCurrency(line.credit || 0)}</DataTable.Cell>
              <DataTable.Cell numeric>{line.taxCode || ''}</DataTable.Cell>
            </DataTable.Row>
          ))}

          <DataTable.Row style={styles.totalsRow}>
            <DataTable.Cell><Text style={{fontWeight: 'bold'}}>{t('total')}</Text></DataTable.Cell>
            <DataTable.Cell><Text children={''}>{/* Empty text but with children prop */}</Text></DataTable.Cell>
            <DataTable.Cell numeric><Text style={{fontWeight: 'bold'}}>{formatCurrency(totalDebit)}</Text></DataTable.Cell>
            <DataTable.Cell numeric><Text style={{fontWeight: 'bold'}}>{formatCurrency(totalCredit)}</Text></DataTable.Cell>
            <DataTable.Cell><Text children={''}>{/* Empty text but with children prop */}</Text></DataTable.Cell>
          </DataTable.Row>
        </DataTable>

        {totalDebit !== totalCredit && (
          <Text style={styles.unbalancedWarning}>
            {t('warning_unbalanced_entry')}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 12,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    marginBottom: 8,
  },
  valueDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  table: {
    marginTop: 10,
  },
  totalsRow: {
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  unbalancedWarning: {
    color: '#FF5722',
    marginTop: 10,
  },
});

export default DynamicJournalEntryWidget;
