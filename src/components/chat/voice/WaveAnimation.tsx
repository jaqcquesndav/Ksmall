import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface WaveAnimationProps {
  isActive: boolean;
  color: string;
  count?: number;
  duration?: number;
}

const WaveAnimation: React.FC<WaveAnimationProps> = ({
  isActive,
  color,
  count = 5,
  duration = 1000
}) => {
  const animValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    
    if (isActive) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      animValue.setValue(0);
    }
    
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [isActive, duration, animValue]);
  
  return (
    <View style={styles.container}>
      {[...Array(count)].map((_, i) => (
        <Animated.View
          key={`wave-${i}`}
          style={[
            styles.wave,
            {
              height: 10 + i * 10,
              opacity: Animated.multiply(
                animValue, 
                0.3 + i * 0.1
              ),
              backgroundColor: color,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    marginVertical: 16,
  },
  wave: {
    width: 6,
    marginHorizontal: 3,
    borderRadius: 3,
  },
});

export default WaveAnimation;
