import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, List, Avatar, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { formatDateRelative, formatCurrency } from '../../utils/formatters';
import logger from '../../utils/logger';

interface Activity {
  id: string;
  type: 'journal_entry' | 'transaction' | 'inventory' | 'user_action';
  title: string;
  description?: string;
  amount?: number;
  timestamp: string;
  status?: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

interface RecentActivitiesWidgetProps {
  activities: Activity[];
}

const RecentActivitiesWidget: React.FC<RecentActivitiesWidgetProps> = ({ activities }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const handleActivityPress = (activity: Activity) => {
    logger.debug(`Activity pressed: ${activity.type}, ID: ${activity.id}`);
    
    try {
      switch (activity.type) {
        case 'journal_entry':
          logger.debug(`Navigating to JournalEntryDetails with entryId: ${activity.id}`);
          navigation.navigate('JournalEntryDetails', { entryId: activity.id });
          break;
        case 'transaction':
          navigation.navigate('TransactionDetails', { transactionId: activity.id });
          break;
        case 'inventory':
          navigation.navigate('ProductDetails', { productId: activity.id });
          break;
        default:
          // Do nothing for user actions or unknown types
          break;
      }
    } catch (error) {
      logger.error('Error navigating from activity:', error);
    }
  };

  const getIconForActivity = (type: Activity['type']) => {
    switch (type) {
      case 'journal_entry':
        return 'file-document-outline';
      case 'transaction':
        return 'bank-transfer';
      case 'inventory':
        return 'package-variant';
      case 'user_action':
        return 'account-outline';
      default:
        return 'information-outline';
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Title title={t('recent_activities')} />
      <Card.Content>
        {activities.length === 0 ? (
          <Text style={styles.emptyText}>{t('no_recent_activities')}</Text>
        ) : (
          activities.map((activity) => (
            <TouchableOpacity
              key={activity.id}
              onPress={() => handleActivityPress(activity)}
              style={styles.activityItem}
            >
              <List.Item
                title={activity.title}
                description={activity.description || formatDateRelative(activity.timestamp)}
                left={() => (
                  <Avatar.Icon 
                    size={40} 
                    icon={getIconForActivity(activity.type)}
                    style={{ backgroundColor: theme.colors.surfaceVariant }}
                  />
                )}
                right={() => activity.amount !== undefined ? (
                  <View style={styles.amountContainer}>
                    <Text 
                      style={[
                        styles.amount, 
                        { color: activity.amount >= 0 ? theme.colors.primary : theme.colors.error }
                      ]}
                    >
                      {formatCurrency(activity.amount)}
                    </Text>
                    {activity.status && (
                      <Text style={styles.status}>
                        {t(activity.status.toLowerCase())}
                      </Text>
                    )}
                  </View>
                ) : null}
              />
            </TouchableOpacity>
          ))
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  activityItem: {
    marginVertical: 4,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
    marginVertical: 16,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: 'bold',
  },
  status: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default RecentActivitiesWidget;
