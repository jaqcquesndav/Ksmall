import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import logger from '../utils/logger';

// Variable globale pour suivre si un enregistrement est en cours
let isRecordingActive = false;

export const useAudioLevels = () => {
  const [isListening, setIsListening] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const recording = useRef<Audio.Recording | null>(null);
  const simulationInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Assurer le nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, []);
  
  const cleanupRecording = async () => {
    try {
      if (recording.current) {
        await recording.current.stopAndUnloadAsync();
        recording.current = null;
      }
      
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
        simulationInterval.current = null;
      }
      
      setIsListening(false);
      setAmplitude(0);
      isRecordingActive = false;
    } catch (error) {
      logger.error('Error cleaning up recording', error);
    }
  };
  
  const startListening = async () => {
    // Vérifier si un enregistrement est déjà en cours
    if (isRecordingActive) {
      logger.warn('Another recording is already active');
      return;
    }
    
    try {
      // Nettoyer tout enregistrement précédent
      await cleanupRecording();
      
      // Demander les permissions
      const permissionResponse = await Audio.requestPermissionsAsync();
      if (!permissionResponse.granted) {
        logger.error('Permission to access microphone denied');
        return;
      }
      
      // Configurer l'audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      // Marquer comme actif avant de commencer l'enregistrement
      isRecordingActive = true;
      
      // Démarrer l'enregistrement
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recording.current = newRecording;
      setIsListening(true);
      
      // Pour simulation - remplacer par une vraie détection de niveau audio
      simulationInterval.current = setInterval(() => {
        if (isListening) {
          // Générer une valeur aléatoire entre 0.1 et 0.7
          const randomAmplitude = 0.1 + Math.random() * 0.6;
          setAmplitude(randomAmplitude);
        }
      }, 200);
    } catch (error) {
      logger.error('Failed to start audio recording', error);
      isRecordingActive = false; // Réinitialiser le marqueur en cas d'erreur
      setIsListening(false);
    }
  };
  
  const stopListening = async () => {
    await cleanupRecording();
  };
  
  return {
    isListening,
    amplitude,
    startListening,
    stopListening
  };
};
