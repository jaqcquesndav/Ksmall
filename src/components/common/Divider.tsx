import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface DividerProps {
  style?: ViewStyle;
}

const Divider: React.FC<DividerProps> = ({ style }) => {
  return <View style={[styles.divider, style]} />;
};

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    width: '100%',
  },
});

export default Divider;