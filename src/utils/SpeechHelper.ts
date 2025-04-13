/**
 * Simple speech helper that provides a fallback when expo-speech is not available
 */
const Speech = {
  speak: (text: string, options?: any) => {
    console.log('Speaking:', text);
    
    // Simulate speech duration based on text length
    const duration = Math.min(Math.max(text.length * 50, 1000), 10000);
    
    // Call the callbacks after appropriate delays
    if (options) {
      setTimeout(() => {
        if (options.onDone) options.onDone();
      }, duration);
    }
    
    return true;
  },
  
  stop: () => {
    console.log('Speech stopped');
    return true;
  },
  
  isSpeaking: () => {
    return false;
  }
};

export default Speech;
