import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, ProgressBar, Button, useTheme, Title } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/types';
import { formatNumber } from '../../utils/formatters';

interface SubscriptionStatusWidgetProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SubscriptionStatusWidget: React.FC<SubscriptionStatusWidgetProps> = ({
  collapsed = false,
  onToggleCollapse = () => {}
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();

  // Ces données seraient normalement chargées depuis un service d'API
  const subscriptionData = {
    plan: 'Premium',
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 jours à partir d'aujourd'hui
    features: ['Comptabilité avancée', 'Support prioritaire', 'Rapports illimités', 'API accès'],
    tokens: {
      // Statistiques de tokens
      total: 5000000,
      used: 3200000,
      remaining: 1800000,
      bonusDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Date du prochain bonus mensuel
      bonusAmount: 1000000, // Bonus mensuel de 1 million de tokens
    }
  };

  // Calcul du pourcentage de tokens utilisés
  const tokenPercentage = subscriptionData.tokens.used / subscriptionData.tokens.total;

  // Fonction pour déterminer la couleur de la barre de progression
  const getProgressColor = (percentage: number) => {
    if (percentage > 0.9) return theme.colors.error;
    if (percentage > 0.7) return '#FFA500'; // Replace with a custom warning color (e.g., orange)
    return theme.colors.primary; // Replace 'primary' with a valid color property or custom color if needed
  };

  // Naviguer vers l'écran de gestion des abonnements
  const navigateToSubscriptions = () => {
    navigation.navigate('Subscriptions');
  };

  // Naviguer vers l'écran d'achat de tokens
  const navigateToTokenPurchase = () => {
    navigation.navigate('TokenPurchase');
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <TouchableOpacity 
          onPress={onToggleCollapse}
          style={styles.header}
        >
          <Title style={styles.title}>{t('subscription_status')}</Title>
          <MaterialCommunityIcons 
            name={collapsed ? "chevron-down" : "chevron-up"} 
            size={24} 
            color={theme.colors.primary}
          />
        </TouchableOpacity>
        
        {!collapsed && (
          <>
            <View style={styles.subscriptionInfo}>
              <View>
                <Text style={[styles.planName, { color: theme.colors.primary }]}>
                  {subscriptionData.plan}
                </Text>
                <Text style={styles.expiryDate}>
                  {t('expires')}: {format(subscriptionData.expiryDate, 'dd MMMM yyyy', {locale: fr})}
                </Text>
              </View>
            </View>
            
            {/* Section des tokens */}
            <View style={styles.tokensSection}>
              <View style={styles.tokenHeader}>
                <Text style={styles.tokenTitle}>{t('tokens')}</Text>
                <View style={styles.tokenBadge}>
                  <Text style={styles.tokenBadgeText}>
                    {formatNumber(subscriptionData.tokens.remaining)}
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
                  {t('used')}: {formatNumber(subscriptionData.tokens.used)}
                </Text>
                <Text style={styles.tokenDetail}>
                  {t('total')}: {formatNumber(subscriptionData.tokens.total)}
                </Text>
              </View>
              
              <View style={styles.bonusInfo}>
                <MaterialCommunityIcons name="gift-outline" size={16} color={theme.colors.primary} />
                <Text style={[styles.bonusText, { color: theme.colors.primary }]}>
                  {t('next_bonus')}: {format(subscriptionData.tokens.bonusDate, 'dd/MM/yyyy')}
                  {' (+'}{formatNumber(subscriptionData.tokens.bonusAmount)}{')'}
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
