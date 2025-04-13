import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Surface, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import WaveAnimation from './WaveAnimation';
import RecordButton from './RecordButton';

interface TranscriptCardProps {
  transcript: string;
  isRecording: boolean;
  isListening: boolean;
  onToggleRecording: () => void;
}

const TranscriptCard: React.FC<TranscriptCardProps> = ({
  transcript,
  isRecording,
  isListening,
  onToggleRecording
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  
  return (
    <Surface style={styles.card}>
      <Text style={styles.sectionTitle}>{t('your_message')}</Text>
      
      <WaveAnimation 
        isActive={isRecording || isListening}
        color={theme.colors.primary}
      />
      
      {transcript ? (
        <Text style={styles.transcript}>{transcript}</Text>
      ) : (
        <Text style={styles.placeholderText}>
          {isRecording
            ? t('listening')
            : isListening
            ? t('processing')
            : t('press_button_to_speak')}
        </Text>
      )}
      
      <View style={styles.controlsContainer}>
        <RecordButton 
          isRecording={isRecording}
          isProcessing={isListening}
          onToggleRecording={onToggleRecording}
        />
      </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  transcript: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 24,
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#757575',
    marginVertical: 16,
  },
  controlsContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
});

export default TranscriptCard;
