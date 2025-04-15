import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle, TextStyle, ImageSourcePropType } from 'react-native';
import { Colors } from '../../constants/Colors';

interface EmptyStateProps {
  message: string;
  subMessage?: string;
  icon?: ImageSourcePropType;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  subMessage,
  icon,
  containerStyle,
  textStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {icon && <Image source={icon} style={styles.icon} />}
      <Text style={[styles.message, textStyle]}>{message}</Text>
      {subMessage && <Text style={styles.subMessage}>{subMessage}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  icon: {
    width: 80,
    height: 80,
    marginBottom: 20,
    tintColor: Colors.light.text,
  },
  message: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    textAlign: 'center',
    color: Colors.light.text,
    opacity: 0.8,
  },
});

export default EmptyState;