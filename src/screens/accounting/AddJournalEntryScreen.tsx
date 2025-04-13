import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Card, Title, Divider, IconButton, Text, List, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../../components/common/AppHeader';
import { MainStackParamList } from '../../navigation/types';
import { spacing, commonStyles, borderRadius } from '../../theme/theme';

type AddJournalEntryRouteProp = RouteProp<MainStackParamList, 'AddJournalEntry'>;

interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: string;
  credit: string;
  description: string;
}

const AddJournalEntryScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<AddJournalEntryRouteProp>();
  const theme = useTheme();
  const draftId = route.params?.draftId;
  
  // State for form
  const [reference, setReference] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [lines, setLines] = useState<JournalLine[]>([
    { id: '1', accountCode: '', accountName: '', debit: '0', credit: '0', description: '' },
    { id: '2', accountCode: '', accountName: '', debit: '0', credit: '0', description: '' }
  ]);
  
  // Calculate totals
  const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  const isBalanced = totalDebit === totalCredit;
  
  // Handle adding a new line
  const addLine = () => {
    const newLine = { 
      id: Date.now().toString(), 
      accountCode: '', 
      accountName: '', 
      debit: '0', 
      credit: '0', 
      description: '' 
    };
    setLines([...lines, newLine]);
  };
  
  // Handle removing a line
  const removeLine = (id: string) => {
    if (lines.length <= 2) return; // Minimum 2 lines
    setLines(lines.filter(line => line.id !== id));
  };
  
  // Handle updating a line
  const updateLine = (id: string, field: keyof JournalLine, value: string) => {
    setLines(lines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
  };
  
  // Handle saving the journal entry
  const saveJournalEntry = () => {
    // Save logic would go here
    console.log('Saving journal entry:', { reference, date, description, lines });
    navigation.goBack();
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader 
        title={draftId ? t('edit_journal_entry') : t('add_journal_entry')} 
        showBack 
      />
      
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface }}>{t('journal_entry_details')}</Title>
            
            <View style={styles.formRow}>
              <TextInput
                label={t('reference')}
                value={reference}
                onChangeText={setReference}
                style={styles.input}
                mode="outlined"
                theme={{ colors: { primary: theme.colors.primary }}}
              />
              <TextInput
                label={t('date')}
                value={date}
                onChangeText={setDate}
                style={styles.input}
                mode="outlined"
                theme={{ colors: { primary: theme.colors.primary }}}
              />
            </View>
            
            <TextInput
              label={t('description')}
              value={description}
              onChangeText={setDescription}
              style={styles.fullWidthInput}
              mode="outlined"
              multiline
              theme={{ colors: { primary: theme.colors.primary }}}
            />
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title style={{ color: theme.colors.onSurface }}>{t('journal_lines')}</Title>
              <IconButton
                icon="plus"
                size={20}
                onPress={addLine}
                iconColor={theme.colors.primary}
              />
            </View>
            
            <View style={styles.tableHeader}>
              <Text style={styles.accountHeader}>{t('account')}</Text>
              <Text style={styles.amountHeader}>{t('debit')}</Text>
              <Text style={styles.amountHeader}>{t('credit')}</Text>
              <Text style={styles.actionHeader}>{/* Action column */}</Text>
            </View>
            
            <Divider style={{ backgroundColor: theme.colors.outline }} />
            
            {lines.map((line) => (
              <View key={line.id} style={styles.lineContainer}>
                <View style={styles.accountSection}>
                  <TextInput
                    label={t('account_code')}
                    value={line.accountCode}
                    onChangeText={(value) => updateLine(line.id, 'accountCode', value)}
                    style={styles.codeInput}
                    mode="outlined"
                    dense
                    theme={{ colors: { primary: theme.colors.primary }}}
                  />
                  <TextInput
                    label={t('description')}
                    value={line.description}
                    onChangeText={(value) => updateLine(line.id, 'description', value)}
                    style={styles.descriptionInput}
                    mode="outlined"
                    dense
                    theme={{ colors: { primary: theme.colors.primary }}}
                  />
                </View>
                <TextInput
                  label={t('debit')}
                  value={line.debit}
                  onChangeText={(value) => updateLine(line.id, 'debit', value)}
                  keyboardType="numeric"
                  style={styles.amountInput}
                  mode="outlined"
                  dense
                  theme={{ colors: { primary: theme.colors.primary }}}
                />
                <TextInput
                  label={t('credit')}
                  value={line.credit}
                  onChangeText={(value) => updateLine(line.id, 'credit', value)}
                  keyboardType="numeric"
                  style={styles.amountInput}
                  mode="outlined"
                  dense
                  theme={{ colors: { primary: theme.colors.primary }}}
                />
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => removeLine(line.id)}
                  disabled={lines.length <= 2}
                  style={styles.deleteButton}
                  iconColor={theme.colors.error}
                />
              </View>
            ))}
            
            <Divider style={{ backgroundColor: theme.colors.outline }} />
            
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.colors.onSurface }]}>{t('totals')}</Text>
              <Text style={[styles.totalAmount, { color: theme.colors.onSurface }]}>{totalDebit.toFixed(2)}</Text>
              <Text style={[styles.totalAmount, { color: theme.colors.onSurface }]}>{totalCredit.toFixed(2)}</Text>
              <View style={styles.deleteButton} />
            </View>
            
            {!isBalanced && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {t('journal_must_balance')}
              </Text>
            )}
          </Card.Content>
        </Card>
        
        <Button
          mode="contained"
          onPress={saveJournalEntry}
          style={styles.saveButton}
          disabled={!isBalanced}
          buttonColor={theme.colors.primary}
        >
          {t('save_journal_entry')}
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    ...commonStyles.card,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  input: {
    flex: 1,
    marginRight: spacing.sm,
  },
  fullWidthInput: {
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  accountHeader: {
    flex: 6,
    fontWeight: 'bold',
  },
  amountHeader: {
    flex: 2,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  actionHeader: {
    width: 40,
  },
  lineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  accountSection: {
    flex: 6,
    marginRight: spacing.sm,
  },
  codeInput: {
    marginBottom: spacing.xs,
  },
  descriptionInput: {
    marginBottom: spacing.xs,
  },
  amountInput: {
    flex: 2,
    marginRight: spacing.xs,
  },
  deleteButton: {
    width: 40,
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  totalLabel: {
    flex: 6,
    fontWeight: 'bold',
  },
  totalAmount: {
    flex: 2,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  errorText: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  saveButton: {
    margin: spacing.md,
    borderRadius: borderRadius.full,
  },
});

export default AddJournalEntryScreen;
