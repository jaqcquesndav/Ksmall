import React from 'react';
import { StyleSheet, ScrollView, Text } from 'react-native';
import { Surface, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import WaveAnimation from './WaveAnimation';

interface ResponseCardProps {
  response: string;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
}

const ResponseCard: React.FC<ResponseCardProps> = ({
  response,
  isSpeaking,
  onStopSpeaking
}) => {
  const { t } = useTranslation();
  
  return (
    <Surface style={[styles.card, styles.responseCard]}>
      <Text style={styles.sectionTitle}>{t('assistant_response')}</Text>
      
      <WaveAnimation 
        isActive={isSpeaking}
        color="#4CAF50"
        duration={800}
      />
      
      {response ? (
        <ScrollView style={styles.responseScrollView}>
          <Text style={styles.response}>{response}</Text>
        </ScrollView>
      ) : (
        <Text style={styles.placeholderText}>
          {t('waiting_for_response')}
        </Text>
      )}
      
      {isSpeaking && (
        <Button 
          mode="outlined" 
          onPress={onStopSpeaking}
          style={styles.stopSpeakingButton}
        >
          {t('stop_speaking')}
        </Button>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    flex: 1,
  },
  responseCard: {
    backgroundColor: '#F0F8FF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  responseScrollView: {
    maxHeight: 120,
  },
  response: {
    fontSize: 16,
    lineHeight: 24,
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#757575',
    marginVertical: 16,
  },
  stopSpeakingButton: {
    marginTop: 16,
  }
});

export default ResponseCard;
