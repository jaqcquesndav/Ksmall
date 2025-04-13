import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Divider } from 'react-native-paper';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AppHeader from '../../components/common/AppHeader';
import { MainStackParamList } from '../../navigation/types';
import { accountingMockData } from '../../data/mockData';
import { useMainNavigation } from '../../hooks/useAppNavigation';

type JournalEntryDetailsRouteProp = RouteProp<MainStackParamList, 'JournalEntryDetails'>;

const JournalEntryDetailsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useMainNavigation();
  const route = useRoute<JournalEntryDetailsRouteProp>();
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

  // Utilisation typée sécurisée de la navigation
  const handleEdit = () => {
    navigation.navigate('AddJournalEntry', { draftId: entryId });
  };

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
            
            <Divider />

            <View style={styles.section}>
              <Text style={styles.label}>{t('description')}</Text>
              <Text style={styles.value}>{entry.description}</Text>
            </View>
            
            <Divider />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('journal_lines')}</Text>
              
              <ScrollView horizontal>
                <View>
                  <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderCell}>{t('account')}</Text>
                    <Text style={styles.tableHeaderCell}>{t('description')}</Text>
                    <Text style={styles.tableHeaderCell}>{t('debit')}</Text>
                    <Text style={styles.tableHeaderCell}>{t('credit')}</Text>
                  </View>
                  
                  {entry.lines.map((line, index) => (
                    <View key={`line-${index}`} style={styles.tableRow}>
                      <Text style={styles.tableCell}>{line.accountCode}</Text>
                      <Text style={styles.tableCell}>{line.description}</Text>
                      <Text style={styles.tableCell}>{line.debit > 0 ? line.debit.toFixed(2) : ''}</Text>
                      <Text style={styles.tableCell}>{line.credit > 0 ? line.credit.toFixed(2) : ''}</Text>
                    </View>
                  ))}
                  
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCell}>{t('total')}</Text>
                    <Text style={styles.tableCell}>{''}</Text>
                    <Text style={styles.tableCell}>
                      {entry.lines.reduce((sum, line) => sum + line.debit, 0).toFixed(2)}
                    </Text>
                    <Text style={styles.tableCell}>
                      {entry.lines.reduce((sum, line) => sum + line.credit, 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </Card.Content>
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            onPress={handleEdit} 
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
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 8,
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
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
