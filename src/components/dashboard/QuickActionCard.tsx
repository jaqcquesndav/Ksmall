import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface QuickActionCardProps {
  icon: string;  // Icon name from MaterialCommunityIcons
  label: string;
  onPress: () => void;
  color?: string;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon,
  label,
  onPress,
  color,
}) => {
  const theme = useTheme();
  const iconColor = color || theme.colors.primary;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <MaterialCommunityIcons
            name={icon as any}
            size={28}
            color={iconColor}
            style={styles.icon}
          />
          <Text style={styles.label}>
            {label}
          </Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 8,
    minWidth: 100,
    maxWidth: 120,
  },
  card: {
    elevation: 2,
  },
  content: {
    alignItems: 'center',
    padding: 12,
  },
  icon: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default QuickActionCard;
