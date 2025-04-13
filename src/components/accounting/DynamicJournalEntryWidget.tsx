import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput } from 'react-native';
import { Card, DataTable, Button, useTheme, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

export interface JournalEntry {
  id?: string;    // Add the ID field
  date: string;
  reference?: string; // Add reference field
  description: string;
  entries: Array<{
    account: string;
    accountNumber: string;
    debit: number;
    credit: number;
  }>;
  totalDebit: number;
  totalCredit: number;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
  }>;
}

export interface DynamicJournalEntryWidgetProps {
  data: JournalEntry;
  status?: 'pending' | 'validated' | 'error';
  onValidate?: () => void;
  readOnly?: boolean; 
  isEditing?: boolean;
  onEditChange?: (data: JournalEntry) => void;
}

const JournalEntryWidget: React.FC<DynamicJournalEntryWidgetProps> = ({ 
  data, 
  status,
  onValidate,
  readOnly = false,
  isEditing = false,
  onEditChange
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [localData, setLocalData] = useState<JournalEntry>(data);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const updateLocalData = (newData: Partial<JournalEntry>) => {
    const updated = { ...localData, ...newData };
    setLocalData(updated);
    if (onEditChange) onEditChange(updated);
  };

  const updateEntry = (index: number, field: string, value: any) => {
    const newEntries = [...localData.entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    
    // Recalculate totals
    const totalDebit = newEntries.reduce((sum, entry) => sum + (parseFloat(entry.debit.toString()) || 0), 0);
    const totalCredit = newEntries.reduce((sum, entry) => sum + (parseFloat(entry.credit.toString()) || 0), 0);
    
    updateLocalData({ entries: newEntries, totalDebit, totalCredit });
  };

  const addEntry = () => {
    const newEntries = [...localData.entries, { account: '', accountNumber: '', debit: 0, credit: 0 }];
    updateLocalData({ entries: newEntries });
  };

  const removeEntry = (index: number) => {
    const newEntries = localData.entries.filter((_, i) => i !== index);
    
    // Recalculate totals
    const totalDebit = newEntries.reduce((sum, entry) => sum + (parseFloat(entry.debit.toString()) || 0), 0);
    const totalCredit = newEntries.reduce((sum, entry) => sum + (parseFloat(entry.credit.toString()) || 0), 0);
    
    updateLocalData({ entries: newEntries, totalDebit, totalCredit });
  };

  // Utiliser les données locales si en mode édition, sinon utiliser les données fournies
  const displayData = isEditing ? localData : data;

  return (
    <Card style={styles.container}>
      <Card.Title title={t('journal_entry')} />
      <Card.Content>
        <View style={styles.headerInfo}>
          {isEditing ? (
            <>
              <Text style={styles.fieldLabel}>{t('date')}:</Text>
              <TextInput
                style={styles.textInput}
                value={displayData.date.split('T')[0]}
                onChangeText={(text) => updateLocalData({ date: text })}
                placeholder="YYYY-MM-DD"
              />
              <Text style={styles.fieldLabel}>{t('description')}:</Text>
              <TextInput
                style={[styles.textInput, styles.descriptionInput]}
                value={displayData.description}
                onChangeText={(text) => updateLocalData({ description: text })}
                placeholder={t('enter_description')}
                multiline
              />
            </>
          ) : (
            <>
              <Text style={styles.date}>{formatDate(displayData.date)}</Text>
              <Text style={styles.description}>{displayData.description}</Text>
            </>
          )}
        </View>
        
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>{t('account')}</DataTable.Title>
            <DataTable.Title numeric>{t('debit')}</DataTable.Title>
            <DataTable.Title numeric>{t('credit')}</DataTable.Title>
            {isEditing && (
              <DataTable.Title style={{ width: 40 }}>
                <Text></Text>
              </DataTable.Title>
            )}
          </DataTable.Header>

          {displayData.entries.map((entry, index) => (
            <DataTable.Row key={index}>
              {isEditing ? (
                <>
                  <DataTable.Cell>
                    <View>
                      <TextInput
                        style={styles.textInput}
                        value={entry.account}
                        onChangeText={(text) => updateEntry(index, 'account', text)}
                        placeholder={t('account_name')}
                      />
                      <TextInput
                        style={[styles.textInput, styles.accountNumber]}
                        value={entry.accountNumber}
                        onChangeText={(text) => updateEntry(index, 'accountNumber', text)}
                        placeholder={t('account_number')}
                      />
                    </View>
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    <TextInput
                      style={[styles.textInput, styles.numberInput]}
                      value={entry.debit > 0 ? entry.debit.toString() : ''}
                      onChangeText={(text) => updateEntry(index, 'debit', parseFloat(text) || 0)}
                      keyboardType="numeric"
                      placeholder="0.00"
                    />
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    <TextInput
                      style={[styles.textInput, styles.numberInput]}
                      value={entry.credit > 0 ? entry.credit.toString() : ''}
                      onChangeText={(text) => updateEntry(index, 'credit', parseFloat(text) || 0)}
                      keyboardType="numeric"
                      placeholder="0.00"
                    />
                  </DataTable.Cell>
                  <DataTable.Cell style={{ width: 40 }}>
                    <IconButton
                      icon="minus-circle"
                      size={16}
                      onPress={() => removeEntry(index)}
                    />
                  </DataTable.Cell>
                </>
              ) : (
                <>
                  <DataTable.Cell>
                    <Text>
                      {entry.account}
                      <Text style={styles.accountNumber}> ({entry.accountNumber})</Text>
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    {entry.debit > 0 ? `€${entry.debit.toFixed(2)}` : ''}
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    {entry.credit > 0 ? `€${entry.credit.toFixed(2)}` : ''}
                  </DataTable.Cell>
                </>
              )}
            </DataTable.Row>
          ))}

          {isEditing && (
            <View style={styles.addButtonContainer}>
              <Button
                mode="text"
                icon="plus"
                onPress={addEntry}
              >
                {t('add_entry')}
              </Button>
            </View>
          )}

          <DataTable.Row style={styles.totalRow}>
            <DataTable.Cell>
              <Text style={styles.totalLabel}>{t('total')}</Text>
            </DataTable.Cell>
            <DataTable.Cell numeric>
              <Text style={styles.totalValue}>€{displayData.totalDebit.toFixed(2)}</Text>
            </DataTable.Cell>
            <DataTable.Cell numeric>
              <Text style={styles.totalValue}>€{displayData.totalCredit.toFixed(2)}</Text>
            </DataTable.Cell>
            {isEditing && (
              <DataTable.Cell style={{ width: 40 }}>
                <Text></Text>
              </DataTable.Cell>
            )}
          </DataTable.Row>
        </DataTable>

        {displayData.totalDebit !== displayData.totalCredit && isEditing && (
          <Text style={styles.errorText}>
            {t('debit_credit_must_match')}
          </Text>
        )}

        {status === 'pending' && !readOnly && !isEditing && (
          <Button 
            mode="contained" 
            style={styles.validateButton}
            onPress={onValidate}
          >
            {t('validate_entry')}
          </Button>
        )}

        {status === 'validated' && (
          <Text style={[styles.statusText, { color: theme.colors.primary }]}>
            {t('entry_validated')}
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
  headerInfo: {
    marginBottom: 16,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  accountNumber: {
    fontSize: 12,
    color: '#888',
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
  },
  numberInput: {
    width: 80,
    textAlign: 'right',
  },
  fieldLabel: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  descriptionInput: {
    height: 60,
  },
  addButtonContainer: {
    marginVertical: 8,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default JournalEntryWidget;
