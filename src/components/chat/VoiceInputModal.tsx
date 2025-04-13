import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Button, IconButton, Surface, useTheme } from 'react-native-paper';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next';
import { CHAT_MODES } from './ModeSelector';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import logger from '../../utils/logger';

interface VoiceInputModalProps {
  onClose: () => void;
  onMessageSent: (message: string) => void;
  chatMode: CHAT_MODES;
}

const VoiceInputModal: React.FC<VoiceInputModalProps> = ({ onClose, onMessageSent, chatMode }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioStream, setAudioStream] = useState<Audio.Recording | null>(null);
  const [isFullDuplex, setIsFullDuplex] = useState(true);
  const [audioLevel, setAudioLevel] = useState<number[]>(Array(10).fill(0));

  // Initialize audio session
  useEffect(() => {
    const setupAudioSession = async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: true,
        });
        logger.debug('Audio session configured');
      } catch (error) {
        logger.error('Error setting up audio session', error);
      }
    };

    setupAudioSession();
    return () => {
      // Clean up audio resources
      if (audioStream) {
        audioStream.stopAndUnloadAsync();
      }
    };
  }, []);

  // Improve full-duplex simulation with a more realistic implementation
  const simulateFullDuplexRecognition = () => {
    if (!isFullDuplex) return;
    
    // In real full-duplex implementation, you'd connect to a streaming API
    // This is a robust simulation of progressive recognition
    const phrases = [
      "Bonjour, ",
      "je voudrais consulter ",
      "l'état des comptes clients ",
      "pour le trimestre en cours."
    ];
    
    // Use a more reliable approach with cleanup
    let index = 0;
    const processNextChunk = () => {
      if (!isListening || index >= phrases.length) return;
      
      setTranscript(prev => prev + phrases[index]);
      index++;
      
      if (index < phrases.length) {
        setTimeout(processNextChunk, 700);
      }
    };
    
    // Start the process
    processNextChunk();
  };

  // Improve voice recognition toggle with better error handling
  const toggleVoiceRecognition = async () => {
    try {
      if (isListening) {
        // Stop listening with proper cleanup
        setIsListening(false);
        if (audioStream) {
          await audioStream.stopAndUnloadAsync();
          const uri = audioStream.getURI();
          logger.debug('Audio recording stopped', { uri });
          
          if (isFullDuplex) {
            // For full-duplex we already have the transcript
          } else {
            // For half-duplex, simulate receiving the result now
            setTranscript(prev => prev.trim() + (prev ? ' ' : '') + 
              (chatMode === CHAT_MODES.ACCOUNTING ? 
                'Consulter les comptes clients et le bilan pour le trimestre en cours' : 
                'Montrer les tendances de ventes du dernier trimestre')
            );
          }
          
          setAudioStream(null);
        }
      } else {
        // Start listening with improved setup
        try {
          await Audio.requestPermissionsAsync();
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
            staysActiveInBackground: true,
          });
          
          setIsListening(true);
          const { recording } = await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
          );
          setAudioStream(recording);
          
          // Start recognition simulation based on mode
          if (isFullDuplex) {
            simulateFullDuplexRecognition();
          }
        } catch (error) {
          setIsListening(false);
          logger.error('Error starting voice recognition', error);
          // Show error to user
          alert(t('microphone_permission_error'));
        }
      }
    } catch (error) {
      logger.error('Voice recognition error:', error);
      setIsListening(false);
      setAudioStream(null);
    }
  };

  // Ajouter la visualisation des ondes sonores pendant l'enregistrement
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isListening) {
      interval = setInterval(() => {
        // Simuler les niveaux audio changeants
        const newLevels = audioLevel.map(() => Math.random() * 0.8 + 0.2);
        setAudioLevel(newLevels);
      }, 100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening]);

  const handleSendMessage = () => {
    if (transcript.trim()) {
      onMessageSent(transcript.trim());
    } else {
      onClose();
    }
  };

  const toggleFullDuplexMode = () => {
    setIsFullDuplex(!isFullDuplex);
  };

  // Rendu de la visualisation des ondes
  const renderWaveform = () => {
    return (
      <View style={styles.waveformContainer}>
        {audioLevel.map((level, index) => (
          <View
            key={`wave-${index}`}
            style={[
              styles.waveBar,
              {
                height: 40 * level,
                backgroundColor: theme.colors.primary,
                opacity: isListening ? 1 : 0.5,
              }
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="close" size={24} onPress={onClose} />
        <Text style={styles.title}>{t('voice_assistant')}</Text>
        <IconButton 
          icon={isFullDuplex ? "access-point" : "access-point-network-off"} 
          size={24} 
          onPress={toggleFullDuplexMode} 
          iconColor={isFullDuplex ? theme.colors.primary : "#757575"}
        />
      </View>
      
      <Surface style={styles.transcriptContainer}>
        {transcript ? (
          <Text style={styles.transcriptText}>{transcript}</Text>
        ) : (
          <>
            <Text style={styles.placeholderText}>{isListening ? t('listening') : t('press_mic_to_start')}</Text>
            {isListening && renderWaveform()}
          </>
        )}
      </Surface>
      
      <View style={styles.footer}>
        <Text style={styles.modeText}>{t('mode')}: {t(chatMode.toLowerCase())}</Text>
        
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={toggleVoiceRecognition}
          >
            <MaterialCommunityIcons 
              name={isListening ? "microphone" : "microphone-outline"} 
              size={36} 
              color={isListening ? "#fff" : "#000"} 
            />
          </TouchableOpacity>
          
          {transcript && (
            <Button 
              mode="contained" 
              style={styles.sendButton}
              onPress={handleSendMessage}
            >
              {t('send')}
            </Button>
          )}
        </View>
        
        {isFullDuplex && (
          <Text style={styles.fullDuplexIndicator}>
            {t('full_duplex_mode')}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transcriptContainer: {
    flex: 1,
    padding: 16,
    margin: 16,
    elevation: 2,
    borderRadius: 8,
  },
  transcriptText: {
    fontSize: 18,
    lineHeight: 24,
  },
  placeholderText: {
    fontSize: 18,
    color: '#757575',
    textAlign: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modeText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 16,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonActive: {
    backgroundColor: '#6200EE',
  },
  sendButton: {
    marginLeft: 16,
  },
  fullDuplexIndicator: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 8,
  },
  waveformContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 40,
    width: '80%',
    marginTop: 16,
    alignSelf: 'center',
    gap: 3,
  },
  waveBar: {
    width: 5,
    borderRadius: 3,
    backgroundColor: '#6200EE',
  },
});

export default VoiceInputModal;
