import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, DataTable } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import AppHeader from '../../components/common/AppHeader';
import { accountingMockData } from '../../data/mockData';

type Props = NativeStackScreenProps<MainStackParamList, 'JournalEntryDetails'>;

const JournalEntryDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { entryId } = route.params;
  
  // Find the entry in mock data
  const entry = accountingMockData.journalEntries.find(e => e.id === entryId);
  
  if (!entry) {
    return (
      <View style={styles.container}>
        <AppHeader 
          title={t('journal_entry')} 
          showBack 
        />
        <View style={styles.notFoundContainer}>
          <Text>{t('entry_not_found')}</Text>
          <Button mode="contained" style={styles.button} onPress={() => navigation.goBack()}>
            {t('go_back')}
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader 
        title={t('journal_entry')} 
        subtitle={entry.reference} 
        showBack 
      />
      
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.label}>{t('date')}</Text>
                <Text style={styles.value}>{entry.date}</Text>
              </View>
              <View>
                <Text style={styles.label}>{t('status')}</Text>
                <Text style={styles.value}>{entry.status}</Text>
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.label}>{t('description')}</Text>
              <Text style={styles.value}>{entry.description}</Text>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('journal_lines')}</Text>
              
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>{t('account')}</DataTable.Title>
                  <DataTable.Title>{t('description')}</DataTable.Title>
                  <DataTable.Title numeric>{t('debit')}</DataTable.Title>
                  <DataTable.Title numeric>{t('credit')}</DataTable.Title>
                </DataTable.Header>
                
                {entry.lines.map((line, index) => (
                  <DataTable.Row key={`line-${index}`}>
                    <DataTable.Cell>{line.accountCode}</DataTable.Cell>
                    <DataTable.Cell>{line.description}</DataTable.Cell>
                    <DataTable.Cell numeric>{line.debit > 0 ? line.debit.toFixed(2) : ''}</DataTable.Cell>
                    <DataTable.Cell numeric>{line.credit > 0 ? line.credit.toFixed(2) : ''}</DataTable.Cell>
                  </DataTable.Row>
                ))}
                
                <DataTable.Row style={styles.totalRow}>
                  <DataTable.Cell>{t('total')}</DataTable.Cell>
                  <DataTable.Cell>{''}</DataTable.Cell>
                  <DataTable.Cell numeric>
                    {entry.lines.reduce((sum, line) => sum + line.debit, 0).toFixed(2)}
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    {entry.lines.reduce((sum, line) => sum + line.credit, 0).toFixed(2)}
                  </DataTable.Cell>
                </DataTable.Row>
              </DataTable>
            </View>
          </Card.Content>
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            onPress={() => {}} 
            style={styles.button}
          >
            {entry.status === 'pending' ? t('validate') : t('edit')}
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={() => {}} 
            style={styles.button}
          >
            {t('print')}
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  totalRow: {
    backgroundColor: '#f0f0f0',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default JournalEntryDetailsScreen;
