import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface AudioWaveformProps {
  amplitude: number;
  color: string;
  isActive: boolean;
  waveCount?: number;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ 
  amplitude, 
  color, 
  isActive,
  waveCount = 5
}) => {
  const animations = useRef<Animated.Value[]>([]);
  
  // Initialiser les animations si ce n'est pas déjà fait
  if (animations.current.length === 0) {
    for (let i = 0; i < waveCount; i++) {
      animations.current.push(new Animated.Value(0));
    }
  }
  
  useEffect(() => {
    if (!isActive) {
      animations.current.forEach(anim => anim.setValue(0));
      return;
    }

    // Créer des animations séquentielles pour chaque barre
    const animSequences = animations.current.map((anim, i) => {
      // Réinitialiser l'état
      anim.setValue(0);
      
      // Créer une séquence qui monte et descend
      return Animated.sequence([
        Animated.timing(anim, {
          toValue: amplitude * (0.3 + (i / waveCount) * 0.7),
          duration: 300 + i * 50,
          useNativeDriver: false, // Important: false pour permettre l'animation de hauteur
          delay: i * 50
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 300 + i * 50,
          useNativeDriver: false, // Important: false pour permettre l'animation de hauteur
        })
      ]);
    });
    
    // Lancer les animations en boucle
    const animationLoops = animSequences.map(seq => Animated.loop(seq));
    animationLoops.forEach(anim => anim.start());
    
    return () => {
      animationLoops.forEach(anim => anim.stop());
    };
  }, [isActive, amplitude, waveCount]);
  
  return (
    <View style={styles.container}>
      {animations.current.map((anim, i) => {
        // Utiliser l'interpolation pour la hauteur
        const height = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [5, 60], // Hauteur min et max
        });
        
        return (
          <React.Fragment key={i}>
            <Animated.View
              style={[
                styles.bar,
                {
                  backgroundColor: color,
                  height, // Utiliser directement la valeur interpolée
                  opacity: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 0.8],
                  }),
                },
              ]}
            />
            <View style={{ width: 6 }} />
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    padding: 10,
  },
  bar: {
    width: 6,
    borderRadius: 3,
  },
});

export default AudioWaveform;
