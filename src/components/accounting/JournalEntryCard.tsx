import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { JournalEntry } from './DynamicJournalEntryWidget';

interface JournalEntryCardProps {
  data: JournalEntry;
  readOnly?: boolean;
}

const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ data, readOnly = false }) => {
  return (
    <Card style={styles.container}>
      <Card.Title 
        title={data.description} 
        subtitle={new Date(data.date).toLocaleDateString()} 
      />
      <Card.Content>
        <Text>Débit total: {data.totalDebit.toFixed(2)}</Text>
        <Text>Crédit total: {data.totalCredit.toFixed(2)}</Text>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
});

export default JournalEntryCard;
