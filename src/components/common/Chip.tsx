import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChipProps {
  label: string;
  color?: string;
  textColor?: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  onClose?: () => void;
  onPress?: () => void;
}

const Chip: React.FC<ChipProps> = ({ 
  label, 
  color = '#e0e0e0', 
  textColor = '#000000', 
  size = 'medium',
  style,
  textStyle,
  onClose,
  onPress
}) => {
  const chipSize = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 12 };
      case 'large':
        return { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 };
      default:
        return { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 16 };
    }
  };

  const textSize = () => {
    switch (size) {
      case 'small':
        return { fontSize: 10 };
      case 'large':
        return { fontSize: 14 };
      default:
        return { fontSize: 12 };
    }
  };

  const ChipContent = () => (
    <>
      <Text 
        style={[
          styles.label, 
          textSize(), 
          { color: textColor },
          textStyle
        ]}
      >
        {label}
      </Text>
      
      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons 
            name="close-circle" 
            size={size === 'small' ? 12 : size === 'large' ? 18 : 14} 
            color={textColor} 
          />
        </TouchableOpacity>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.chip, 
          chipSize(), 
          { backgroundColor: color },
          style
        ]}
      >
        <ChipContent />
      </TouchableOpacity>
    );
  }

  return (
    <View 
      style={[
        styles.chip, 
        chipSize(), 
        { backgroundColor: color },
        style
      ]}
    >
      <ChipContent />
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontWeight: '500',
  },
  closeButton: {
    marginLeft: 4,
  }
});

export default Chip;