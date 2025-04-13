import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { JournalEntry } from './DynamicJournalEntryWidget';
import DynamicJournalEntryWidget from './DynamicJournalEntryWidget';

interface JournalEntryCardProps {
  journalEntry: JournalEntry;
  status?: 'validated' | 'pending' | 'rejected';
}

const JournalEntryCard: React.FC<JournalEntryCardProps> = ({
  journalEntry,
  status = 'pending',
}) => {
  // Utiliser le rendu de fonction pour Card.Content plutôt que les enfants
  const renderContent = () => {
    return (
      <DynamicJournalEntryWidget
        data={journalEntry}
        readOnly={status === 'validated'}
      />
    );
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        {renderContent()}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
});

export default JournalEntryCard;
