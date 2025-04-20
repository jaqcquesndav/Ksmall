import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput } from 'react-native';
import { Card, DataTable, Button, useTheme, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../hooks/useCurrency';

export interface JournalEntry {
  id?: string;
  date: string;
  reference?: string;
  description: string;
  entries: Array<{
    account: string;
    accountNumber: string;
    debit: number;
    credit: number;
    description?: string; // Ajout du champ description pour chaque ligne
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
  const { formatAmount } = useCurrency();
  
  // Générer une référence si elle n'existe pas
  useEffect(() => {
    if (!localData.reference) {
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const randomId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const newReference = `JL-${today.getFullYear()}${month}${day}-${randomId}`;
      
      updateLocalData({ reference: newReference });
    }
  }, []);
  
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
    const newEntries = [...localData.entries, { account: '', accountNumber: '', description: '', debit: 0, credit: 0 }];
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
      <Card.Title title={t('journal_entry')} subtitle={displayData.reference ? `Réf: ${displayData.reference}` : ''} />
      <Card.Content>
        <View style={styles.headerInfo}>
          {isEditing ? (
            <>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>{t('reference')}:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={displayData.reference || ''}
                    onChangeText={(text) => updateLocalData({ reference: text })}
                    placeholder="JL-YYYYMMDD-####"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>{t('date')}:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={displayData.date.split('T')[0]}
                    onChangeText={(text) => updateLocalData({ date: text })}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>
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
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>{t('date')}:</Text>
                  <Text style={styles.date}>{formatDate(displayData.date)}</Text>
                </View>
                {displayData.reference && (
                  <View style={styles.col}>
                    <Text style={styles.fieldLabel}>{t('reference')}:</Text>
                    <Text style={styles.reference}>{displayData.reference}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.fieldLabel}>{t('description')}:</Text>
              <Text style={styles.description}>{displayData.description}</Text>
            </>
          )}
        </View>
        
        <DataTable>
          <DataTable.Header>
            <DataTable.Title style={styles.accountCol}>{t('account')}</DataTable.Title>
            <DataTable.Title style={styles.descriptionCol}>{t('account_description')}</DataTable.Title>
            <DataTable.Title numeric style={styles.amountCol}>{t('debit')}</DataTable.Title>
            <DataTable.Title numeric style={styles.amountCol}>{t('credit')}</DataTable.Title>
            {isEditing && (
              <DataTable.Title style={styles.actionCol}>
                <Text></Text>
              </DataTable.Title>
            )}
          </DataTable.Header>

          {displayData.entries.map((entry, index) => (
            <DataTable.Row key={index}>
              {isEditing ? (
                <>
                  <DataTable.Cell style={styles.accountCol}>
                    <TextInput
                      style={styles.textInput}
                      value={entry.accountNumber}
                      onChangeText={(text) => updateEntry(index, 'accountNumber', text)}
                      placeholder={t('account_number')}
                    />
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.descriptionCol}>
                    <View>
                      <TextInput
                        style={styles.textInput}
                        value={entry.account}
                        onChangeText={(text) => updateEntry(index, 'account', text)}
                        placeholder={t('account_name')}
                      />
                      <TextInput
                        style={styles.textInput}
                        value={entry.description || ''}
                        onChangeText={(text) => updateEntry(index, 'description', text)}
                        placeholder={t('entry_description')}
                      />
                    </View>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={styles.amountCol}>
                    <TextInput
                      style={[styles.textInput, styles.numberInput]}
                      value={entry.debit > 0 ? entry.debit.toString() : ''}
                      onChangeText={(text) => updateEntry(index, 'debit', parseFloat(text) || 0)}
                      keyboardType="numeric"
                      placeholder="0.00"
                    />
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={styles.amountCol}>
                    <TextInput
                      style={[styles.textInput, styles.numberInput]}
                      value={entry.credit > 0 ? entry.credit.toString() : ''}
                      onChangeText={(text) => updateEntry(index, 'credit', parseFloat(text) || 0)}
                      keyboardType="numeric"
                      placeholder="0.00"
                    />
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.actionCol}>
                    <IconButton
                      icon="minus-circle"
                      size={16}
                      onPress={() => removeEntry(index)}
                    />
                  </DataTable.Cell>
                </>
              ) : (
                <>
                  <DataTable.Cell style={styles.accountCol}>
                    <Text style={styles.accountNumber}>{entry.accountNumber}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.descriptionCol}>
                    <Text style={styles.accountName}>{entry.account}</Text>
                    {entry.description && (
                      <Text style={styles.entryDescription}>{entry.description}</Text>
                    )}
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={styles.amountCol}>
                    {entry.debit > 0 ? formatAmount(entry.debit) : ''}
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={styles.amountCol}>
                    {entry.credit > 0 ? formatAmount(entry.credit) : ''}
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
            <DataTable.Cell style={styles.accountCol}>
              <Text style={styles.totalLabel}>{t('total')}</Text>
            </DataTable.Cell>
            <DataTable.Cell style={styles.descriptionCol}>
              <Text></Text>
            </DataTable.Cell>
            <DataTable.Cell numeric style={styles.amountCol}>
              <Text style={styles.totalValue}>{formatAmount(displayData.totalDebit)}</Text>
            </DataTable.Cell>
            <DataTable.Cell numeric style={styles.amountCol}>
              <Text style={styles.totalValue}>{formatAmount(displayData.totalCredit)}</Text>
            </DataTable.Cell>
            {isEditing && (
              <DataTable.Cell style={styles.actionCol}>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  col: {
    flex: 1,
    marginRight: 8,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  reference: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#444',
  },
  description: {
    fontSize: 15,
    marginTop: 4,
  },
  accountNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  accountName: {
    fontSize: 14,
  },
  entryDescription: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  accountCol: {
    flex: 2,
  },
  descriptionCol: {
    flex: 4,
  },
  amountCol: {
    flex: 2,
  },
  actionCol: {
    width: 40,
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
    padding: 6,
    marginVertical: 2,
    fontSize: 14,
  },
  numberInput: {
    width: 80,
    textAlign: 'right',
  },
  fieldLabel: {
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 2,
    fontSize: 13,
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
