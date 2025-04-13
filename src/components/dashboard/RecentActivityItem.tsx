import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { formatCurrency, formatDate } from '../../utils/formatters';

export interface Activity {
  id: string;
  description: string;
  amount: number;
  date: string;
  category?: string;
  account?: string;
}

interface RecentActivityItemProps {
  activity: Activity;
  onPress?: (activity: Activity) => void;
}

const RecentActivityItem: React.FC<RecentActivityItemProps> = ({
  activity,
  onPress,
}) => {
  const theme = useTheme();
  
  // Determine text color based on amount
  const amountColor = activity.amount >= 0 ? theme.colors.primary : theme.colors.error;
  
  // Format amount with + sign for positive values
  const formattedAmount = activity.amount >= 0 
    ? `+${formatCurrency(activity.amount)}` 
    : formatCurrency(activity.amount);

  const handlePress = () => {
    if (onPress) {
      onPress(activity);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
      disabled={!onPress}
    >
      <View style={styles.content}>
        <View style={styles.mainInfo}>
          <Text style={styles.description}>
            {activity.description}
          </Text>
          
          {activity.category && (
            <Text style={styles.category}>
              {activity.category}
            </Text>
          )}
          
          <Text style={styles.date}>
            {formatDate(activity.date)}
          </Text>
        </View>
        
        <View style={styles.amountContainer}>
          <Text style={[styles.amount, { color: amountColor }]}>
            {formattedAmount}
          </Text>
          
          {activity.account && (
            <Text style={styles.account}>
              {activity.account}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.divider} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainInfo: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  account: {
    fontSize: 12,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginTop: 8,
  },
});

export default RecentActivityItem;
