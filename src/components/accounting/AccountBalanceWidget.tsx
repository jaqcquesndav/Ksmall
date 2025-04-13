import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AccountBalanceWidgetProps {
  accountName: string;
  accountType: string;
  balance: number;
  currency: string;
  provider?: string;
  theme: any;
  onPress?: () => void;
}

const AccountBalanceWidget: React.FC<AccountBalanceWidgetProps> = ({
  accountName,
  accountType,
  balance,
  currency,
  provider,
  theme,
  onPress,
}) => {
  // Determine icon based on account type
  let iconName: string = 'wallet-outline';
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

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.card }]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
        {provider && (
          <Text style={[styles.provider, { color: theme.colors.text + '80' }]}>
            {provider}
          </Text>
        )}
      </View>
      
      <Text style={[styles.accountName, { color: theme.colors.text }]} numberOfLines={1}>
        {accountName}
      </Text>
      
      <View style={styles.balanceContainer}>
        <Text style={[styles.balance, { color: theme.colors.text }]}>
          {balance.toLocaleString()}
        </Text>
        <Text style={[styles.currency, { color: theme.colors.text + '99' }]}>
          {currency}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 160,
    borderRadius: 12,
    padding: 15,
    marginRight: 12,
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

export default AccountBalanceWidget;
