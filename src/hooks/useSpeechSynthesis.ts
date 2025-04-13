import { useState } from 'react';
import Speech from '../utils/SpeechHelper';
import logger from '../utils/logger';

export const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const speak = async (text: string) => {
    try {
      setIsSpeaking(true);
      Speech.speak(text, {
        language: 'fr',
        onDone: () => {
          setIsSpeaking(false);
        },
        onStopped: () => {
          setIsSpeaking(false);
        },
        onError: () => {
          setIsSpeaking(false);
        }
      });
    } catch (error) {
      logger.error('Error speaking response', error);
      setIsSpeaking(false);
    }
  };
  
  const stop = () => {
    Speech.stop();
    setIsSpeaking(false);
  };
  
  return { isSpeaking, speak, stop };
};
