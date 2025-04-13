import React from 'react';
import { StyleSheet } from 'react-native';
import { IconButton, ActivityIndicator, useTheme } from 'react-native-paper';

interface RecordButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onToggleRecording: () => void;
}

const RecordButton: React.FC<RecordButtonProps> = ({
  isRecording,
  isProcessing,
  onToggleRecording
}) => {
  const theme = useTheme();
  
  if (isProcessing) {
    return <ActivityIndicator size={60} color={theme.colors.primary} />;
  }
  
  return (
    <IconButton
      icon={isRecording ? "stop-circle" : "microphone"}
      size={60}
      iconColor={isRecording ? "#FF3B30" : theme.colors.primary}
      style={styles.recordButton}
      onPress={onToggleRecording}
    />
  );
};

const styles = StyleSheet.create({
  recordButton: {
    backgroundColor: '#f0f0f0',
  },
});

export default RecordButton;
