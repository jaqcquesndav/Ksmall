import { useState } from 'react';
import { Audio } from 'expo-av';
import logger from '../utils/logger';
import { CHAT_MODES } from '../components/chat/ModeSelector';
import { getMockTranscriptForMode } from '../services/VoiceMockService';

export const useVoiceRecorder = (chatMode: CHAT_MODES) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [transcript, setTranscript] = useState('');

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setTranscript('');
    } catch (error) {
      logger.error('Failed to start recording', error);
    }
  };
  
  const stopRecording = async () => {
    if (!recording) return;
    
    setIsRecording(false);
    setIsListening(true);
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      if (uri) {
        // Simulate speech-to-text with a timeout
        setTimeout(() => {
          // This would be replaced with actual speech-to-text
          const demoTranscript = getMockTranscriptForMode(chatMode);
          setTranscript(demoTranscript);
          setIsListening(false);
        }, 1500);
      }
    } catch (error) {
      logger.error('Failed to stop recording', error);
      setIsListening(false);
    }
  };

  return {
    isRecording,
    isListening,
    transcript,
    startRecording,
    stopRecording,
    resetTranscript: () => setTranscript('')
  };
};
