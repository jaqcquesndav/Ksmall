import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Button, ProgressBar, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatNumber } from '../../utils/formatters';
import { useNavigation } from '@react-navigation/native';
import { useCurrency } from '../../hooks/useCurrency';
import CurrencyAmount from '../common/CurrencyAmount';

interface SubscriptionStatusWidgetProps {
  subscriptionData?: {
    plan: string;
    expiryDate: Date;
    isActive: boolean;
    features?: string[];
    tokens: {
      total: number;
      used: number;
      remaining: number;
      bonusDate: Date;
      bonusAmount: number;
    };
  };
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isLandscape?: boolean;
}

const SubscriptionStatusWidget: React.FC<SubscriptionStatusWidgetProps> = ({ 
  subscriptionData,
  collapsed: externalCollapsed,
  onToggleCollapse,
  isLandscape
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const { formatAmount } = useCurrency();
  
  // Use either external or internal collapsed state
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  
  // Mock data for when subscriptionData is not provided
  const defaultSubscriptionData = {
    plan: "Plan Standard",
    expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    isActive: true,
    features: ["Feature 1", "Feature 2"],
    tokens: {
      total: 1000,
      used: 250,
      remaining: 750,
      bonusDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      bonusAmount: 50
    }
  };
  
  // Use provided subscription data or default mock data
  const data = subscriptionData || defaultSubscriptionData;
  
  // Calcul du pourcentage de tokens utilisés
  const tokenPercentage = data.tokens.used / data.tokens.total;
  
  // Navigation vers les écrans
  const navigateToTokenPurchase = () => {
    navigation.navigate('TokenPurchase');
  };
  
  const navigateToSubscriptions = () => {
    navigation.navigate('Subscriptions');
  };
  
  // Fonction pour déterminer la couleur de la barre de progression en fonction du pourcentage
  const getProgressColor = (percentage: number) => {
    if (percentage < 0.5) return theme.colors.primary;
    if (percentage < 0.75) return '#ff9800'; // orange
    return '#f44336'; // rouge
  };

  // Handle toggle collapsed state
  const handleToggleCollapsed = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  return (
    <Card style={[styles.card, isLandscape && styles.cardLandscape]}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.title}>{t('subscription')}</Text>
          <TouchableOpacity onPress={handleToggleCollapsed}>
            <MaterialCommunityIcons 
              name={collapsed ? "chevron-down" : "chevron-up"} 
              size={24} 
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
        
        {!collapsed && (
          <>
            <View style={styles.subscriptionInfo}>
              <View>
                <Text style={[styles.planName, { color: theme.colors.primary }]}>
                  {data.plan}
                </Text>
                <Text style={styles.expiryDate}>
                  {t('expires')}: {format(data.expiryDate, 'dd MMMM yyyy', {locale: fr})}
                </Text>
              </View>
            </View>
            
            {/* Section des tokens */}
            <View style={styles.tokensSection}>
              <View style={styles.tokenHeader}>
                <Text style={styles.tokenTitle}>{t('tokens')}</Text>
                <View style={styles.tokenBadge}>
                  <Text style={styles.tokenBadgeText}>
                    {formatNumber(data.tokens.remaining)}
                  </Text>
                </View>
              </View>
              
              <ProgressBar
                progress={tokenPercentage}
                color={getProgressColor(tokenPercentage)}
                style={styles.progressBar}
              />
              
              <View style={styles.tokenStats}>
                <Text style={styles.tokenDetail}>
                  {t('used')}: {formatNumber(data.tokens.used)}
                </Text>
                <Text style={styles.tokenDetail}>
                  {t('total')}: {formatNumber(data.tokens.total)}
                </Text>
              </View>
              
              <View style={styles.bonusInfo}>
                <MaterialCommunityIcons name="gift-outline" size={16} color={theme.colors.primary} />
                <Text style={[styles.bonusText, { color: theme.colors.primary }]}>
                  {t('next_bonus')}: {format(data.tokens.bonusDate, 'dd/MM/yyyy')}
                  {' (+'}
                  <CurrencyAmount amount={data.tokens.bonusAmount} />
                  {')'}
                </Text>
              </View>
              
              <View style={styles.buttonRow}>
                <Button 
                  mode="contained" 
                  onPress={navigateToTokenPurchase}
                  style={[styles.button, { backgroundColor: theme.colors.primary }]}
                  labelStyle={styles.buttonLabel}
                >
                  {t('buy_tokens')}
                </Button>
                
                <Button 
                  mode="outlined" 
                  onPress={navigateToSubscriptions}
                  style={styles.button}
                  labelStyle={{ color: theme.colors.primary }}
                >
                  {t('renew')}
                </Button>
              </View>
            </View>
          </>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardLandscape: {
    flexDirection: 'row',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
  },
  subscriptionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  expiryDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tokensSection: {
    marginTop: 8,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tokenBadge: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  tokenBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  tokenStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tokenDetail: {
    fontSize: 12,
    color: '#666',
  },
  bonusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bonusText: {
    fontSize: 12,
    marginLeft: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  buttonLabel: {
    color: '#fff',
  },
});

export default SubscriptionStatusWidget;
