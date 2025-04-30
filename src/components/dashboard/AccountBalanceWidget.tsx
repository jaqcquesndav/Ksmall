import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { formatCurrency } from '../../utils/formatters';
import { AccountBalanceWidgetProps } from '../../types/dashboard';

const AccountBalanceWidget: React.FC<AccountBalanceWidgetProps> = ({
  accountName,
  accountType,
  balance,
  currency = 'USD',
  provider = 'Default',
  onPress,
  theme: propTheme,
}) => {
  // Use propTheme if provided, otherwise use useTheme()
  const theme = propTheme || useTheme();
  
  // Determine text color based on balance
  const balanceColor = balance >= 0 ? theme.colors.primary : theme.colors.error;

  // Determine card border color based on account type
  const getBorderColor = () => {
    switch (accountType.toLowerCase()) {
      case 'checking':
        return '#4CAF50'; // Green
      case 'savings':
        return '#2196F3'; // Blue
      case 'credit':
        return '#F44336'; // Red
      case 'investment':
        return '#FF9800'; // Orange
      default:
        return theme.colors.outline;
    }
  };

  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={styles.touchable}
      disabled={!onPress}
    >
      <Card 
        style={[
          styles.card,
          { borderLeftColor: getBorderColor() }
        ]}
      >
        <Card.Content>
          <Text style={styles.accountName}>
            {accountName}
          </Text>
          
          <Text style={styles.accountType}>
            {accountType}
          </Text>
          
          <Text style={[styles.balance, { color: balanceColor }]}>
            {formatCurrency(balance, currency)}
          </Text>
          
          <Text style={styles.provider}>
            {provider}
          </Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    margin: 8,
    minWidth: 150,
    maxWidth: 200,
  },
  card: {
    borderLeftWidth: 4,
    elevation: 2,
  },
  accountName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  balance: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  provider: {
    fontSize: 10,
    color: '#999',
  },
});

export default AccountBalanceWidget;
