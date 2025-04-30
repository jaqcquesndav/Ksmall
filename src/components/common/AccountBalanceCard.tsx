import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface AccountBalanceCardProps {
  accountName: string;
  accountType: string;
  balance: number;
  currency?: string;
  provider?: string;
  onPress?: () => void;
}

const AccountBalanceCard: React.FC<AccountBalanceCardProps> = ({
  accountName,
  accountType,
  balance,
  currency = 'XOF',
  provider,
  onPress,
}) => {
  const theme = useTheme();
  
  // Determine icon based on account type
  let iconName = 'wallet-outline';
  let iconColor: string = theme.colors.primary;
  
  switch (accountType.toLowerCase()) {
    case 'cash':
      iconName = 'cash-outline';
      iconColor = '#4CAF50';
      break;
    case 'bank':
      iconName = 'business-outline';
      iconColor = '#2196F3';
      break;
    case 'mobile_money':
      iconName = 'phone-portrait-outline';
      iconColor = '#FF9800';
      break;
    case 'credit_card':
      iconName = 'card-outline';
      iconColor = '#9C27B0';
      break;
    case 'savings':
      iconName = 'save-outline';
      iconColor = '#00BCD4';
      break;
    default:
      // Default icon already set
      break;
  }

  // Determine text color based on balance
  const balanceColor = balance >= 0 ? theme.colors.primary : theme.colors.error;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
    >
      <Card style={[styles.card, { borderLeftWidth: 4, borderLeftColor: iconColor }]}>
        <Card.Content>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
              <Ionicons name={iconName as any} size={20} color={iconColor} />
            </View>
            {provider && (
              <Text style={[styles.provider, { color: theme.colors.onSurface + '80' }]}>
                {provider}
              </Text>
            )}
          </View>
          
          <Text style={[styles.accountName, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {accountName}
          </Text>
          
          <View style={styles.balanceContainer}>
            <Text style={[styles.balance, { color: balanceColor }]}>
              {balance.toLocaleString()}
            </Text>
            <Text style={[styles.currency, { color: theme.colors.onSurface + '99' }]}>
              {currency}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 160,
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
  },
  card: {
    borderRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  provider: {
    fontSize: 12,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 4,
  },
  currency: {
    fontSize: 12,
    marginBottom: 2,
  },
});

export default AccountBalanceCard;