import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Text, IconButton, Button, Dialog, Portal, Divider, ProgressBar, useTheme, Snackbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import AppHeader from '../../components/common/AppHeader';
import DatabaseService from '../../services/DatabaseService';
import Chart from '../../components/common/Chart';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as CompanyService from '../../services/CompanyService';
import DashboardAccountingService from '../../services/DashboardAccountingService';
import { CurrencyInfo } from '../../services/CurrencyService';
import useOrientation from '../../hooks/useOrientation';
import OrientationAwareView from '../../components/common/OrientationAwareView';
import AdaptiveGrid from '../../components/common/AdaptiveGrid';

// Import des hooks API
import { useDashboard } from '../../hooks/api/useDashboard';
import { usePayment } from '../../hooks/api/usePayment';

// Import des composants et données
import SubscriptionStatusWidget from '../../components/dashboard/SubscriptionStatusWidget';
import RecentTransactionsWidget from '../../components/dashboard/RecentTransactionsWidget';
import QuickFinanceActionsButton from '../../components/dashboard/QuickFinanceActionsButton';

const DashboardScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isLandscape, dimensions } = useOrientation();
  const netInfo = useNetInfo();
  const isConnected = netInfo.isConnected;

  // États pour les sections togglables
  const [showCreditScore, setShowCreditScore] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const [showSubscription, setShowSubscription] = useState(true);
  const [showTransactions, setShowTransactions] = useState(true);
  const [showActivities, setShowActivities] = useState(true);

  // Hook de notification hors ligne
  const [offlineSnackVisible, setOfflineSnackVisible] = useState(false);

  // Utilisation des hooks API avec gestion du mode hors ligne
  const dashboard = useDashboard();
  const payment = usePayment();
  
  // Récupération des métriques financières
  const { 
    data: financialMetricsData, 
    isLoading: isFinancialLoading,
    isFromCache: isFinancialFromCache,
    error: financialError
  } = dashboard.useFinancialMetrics({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // 1er janvier année courante
    endDate: new Date().toISOString().split('T')[0], // aujourd'hui
  });

  // Récupération des métriques d'inventaire
  const { 
    data: inventoryMetricsData, 
    isLoading: isInventoryLoading,
    isFromCache: isInventoryFromCache
  } = dashboard.useInventoryMetrics();

  // Récupération des métriques de vente
  const { 
    data: salesMetricsData, 
    isLoading: isSalesLoading,
    isFromCache: isSalesFromCache
  } = dashboard.useSalesMetrics();

  // Récupération des alertes du tableau de bord
  const { 
    data: alertsData, 
    isLoading: isAlertsLoading,
    isFromCache: isAlertsFromCache
  } = dashboard.useAlerts();

  // Récupération de l'abonnement actif
  const { 
    data: subscriptionData, 
    isLoading: isSubscriptionLoading,
    isFromCache: isSubscriptionFromCache
  } = payment.useActiveSubscription();

  // États adaptés pour les données
  const [creditScore, setCreditScore] = useState(0);
  const [esgRating, setEsgRating] = useState('B+');
  const [accountBalances, setAccountBalances] = useState({
    cash: 0,
    receivables: 0,
    payables: 0
  });
  const [financialMetrics, setFinancialMetrics] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    profitMargin: 0
  });
  
  // Information sur la devise actuelle
  const [currencyInfo, setCurrencyInfo] = useState<CurrencyInfo | null>(null);
  
  // Données des transactions récentes
  const [recentTransactions, setRecentTransactions] = useState([]);
  
  // Informations sur l'abonnement
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    plan: '',
    expiryDate: new Date(),
    features: []
  });
  
  // Effet pour détecter les changements de connectivité
  useEffect(() => {
    // Si nous passons de connecté à déconnecté, afficher une notification
    if (isConnected === false) {
      setOfflineSnackVisible(true);
    }
  }, [isConnected]);

  // Effet pour traiter les données financières
  useEffect(() => {
    if (financialMetricsData) {
      // Données du tableau de bord disponibles via l'API
      try {
        // Extraire le score de crédit s'il existe
        const creditScoreMetric = financialMetricsData.find(m => m.key === 'creditScore');
        if (creditScoreMetric) {
          setCreditScore(creditScoreMetric.value);
        }
        
        // Extraire la notation ESG si elle existe
        const esgMetric = financialMetricsData.find(m => m.key === 'esgRating');
        if (esgMetric) {
          setEsgRating(esgMetric.value.toString());
        }
        
        // Mettre à jour les métriques financières
        const revenue = financialMetricsData.find(m => m.key === 'totalRevenue')?.value || 0;
        const expenses = financialMetricsData.find(m => m.key === 'totalExpenses')?.value || 0;
        const netIncome = revenue - expenses;
        const margin = revenue > 0 ? (netIncome / revenue) * 100 : 0;

        setFinancialMetrics({
          totalRevenue: revenue,
          totalExpenses: expenses,
          netIncome: netIncome,
          profitMargin: parseFloat(margin.toFixed(1))
        });
        
      } catch (error) {
        console.error('Erreur lors du traitement des métriques financières:', error);
        // Fallback vers les données locales
        loadFallbackDashboardData();
      }
    } else if (financialError && !isFinancialLoading) {
      console.warn('Erreur lors du chargement des métriques financières:', financialError);
      // En cas d'erreur, charger les données de fallback
      loadFallbackDashboardData();
    }
  }, [financialMetricsData, financialError, isFinancialLoading]);

  // Effet pour traiter les données d'inventaire et créer les balances
  useEffect(() => {
    if (inventoryMetricsData) {
      try {
        const cash = inventoryMetricsData.find(m => m.key === 'cashOnHand')?.value || 0;
        const receivables = inventoryMetricsData.find(m => m.key === 'accountsReceivable')?.value || 0;
        const payables = inventoryMetricsData.find(m => m.key === 'accountsPayable')?.value || 0;

        setAccountBalances({
          cash,
          receivables,
          payables
        });
      } catch (error) {
        console.error('Erreur lors du traitement des métriques d\'inventaire:', error);
        // Fallback pour récupérer les soldes locaux
        DashboardAccountingService.getDashboardBalances()
          .then(balances => setAccountBalances(balances))
          .catch(err => {
            console.warn("Fallback pour balances a échoué:", err);
            // Données par défaut en cas d'échec
            setAccountBalances({
              cash: 1750000,
              receivables: 850000,
              payables: 525000
            });
          });
      }
    }
  }, [inventoryMetricsData]);

  // Effet pour traiter les données de vente
  useEffect(() => {
    if (salesMetricsData) {
      try {
        // Transformer les données de vente en transactions récentes si disponible
        const recentTransactionsData = salesMetricsData
          .filter(m => m.key.startsWith('transaction_'))
          .map(m => {
            // Vérifier si la propriété metadata existe avant de l'utiliser
            return (m as any).metadata || {};
          })
          .filter(t => t.id && t.date && t.amount);

        if (recentTransactionsData.length > 0) {
          setRecentTransactions(recentTransactionsData);
        } else {
          // Aucune transaction trouvée dans les données API, fallback vers les données locales
          DashboardAccountingService.getRecentTransactions(5)
            .then(transactions => setRecentTransactions(transactions))
            .catch(error => {
              console.warn("Fallback pour transactions récentes a échoué:", error);
              // Garder l'état actuel ou utiliser des données par défaut
            });
        }
      } catch (error) {
        console.error('Erreur lors du traitement des métriques de vente:', error);
        // Fallback vers les données locales pour les transactions
        DashboardAccountingService.getRecentTransactions(5)
          .then(transactions => setRecentTransactions(transactions))
          .catch(err => {
            console.warn("Fallback pour transactions récentes a échoué:", err);
            // Données par défaut en cas d'échec
            setRecentTransactions([
              {
                id: 't1',
                date: new Date('2025-03-15'),
                reference: 'INV-2025-022',
                description: 'Paiement client Alpha SARL',
                amount: 450000,
                status: 'validated'
              },
              {
                id: 't2',
                date: new Date('2025-03-10'),
                reference: 'PO-2025-018',
                description: 'Achat fournitures',
                amount: 85000,
                status: 'validated'
              }
            ]);
          });
      }
    }
  }, [salesMetricsData]);
  
  // Effet pour traiter les données d'abonnement
  useEffect(() => {
    if (subscriptionData) {
      try {
        setSubscriptionInfo({
          plan: subscriptionData.planName,
          expiryDate: new Date(subscriptionData.endDate),
          features: subscriptionData.metadata?.features || []
        });
      } catch (error) {
        console.error('Erreur lors du traitement des données d\'abonnement:', error);
        // Utiliser des données par défaut en cas d'erreur
        setSubscriptionInfo({
          plan: 'Pro',
          expiryDate: new Date('2025-12-31'),
          features: ['Comptabilité avancée', 'Support prioritaire', 'Rapports personnalisés']
        });
      }
    }
  }, [subscriptionData]);
  
  useEffect(() => {
    // Charger les informations de devise
    loadCurrencyInfo();
    
    // Si aucune donnée n'est récupérée de l'API ou si en mode hors ligne,
    // charger les données de fallback
    if (!isConnected || 
        (financialError) || 
        (!financialMetricsData && !isFinancialLoading && !inventoryMetricsData && !salesMetricsData)) {
      loadFallbackDashboardData();
    }
  }, [isConnected, financialError, financialMetricsData, isFinancialLoading, inventoryMetricsData, salesMetricsData]);

  // Fonction pour charger les informations de devise
  const loadCurrencyInfo = async () => {
    try {
      const currency = await DashboardAccountingService.getCurrentCurrencyInfo();
      setCurrencyInfo(currency);
    } catch (error) {
      console.warn("Erreur lors du chargement des informations de devise:", error);
      // Fallback pour la devise
      setCurrencyInfo({
        code: 'XOF',
        symbol: 'FCFA',
        name: 'Franc CFA BCEAO',
        format: (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(value),
        position: 'after',
        decimals: 0,
        defaultLocale: 'fr-FR'
      });
    }
  };

  // Fonction pour charger les données du tableau de bord depuis le stockage local
  const loadFallbackDashboardData = async () => {
    try {
      // Vérifier si nous sommes en mode démo ou développement
      const isDemoMode = true; // Pour le développement, toujours utiliser les données de démo
      
      // Informer le service que nous sommes en mode démo
      DashboardAccountingService.setDemoMode(isDemoMode);
      
      // Obtenir la cote de crédit
      try {
        const score = await DashboardAccountingService.calculateCreditScore();
        setCreditScore(score);
      } catch (error) {
        console.warn("Erreur lors du calcul du score de crédit:", error);
        setCreditScore(75); // Valeur par défaut
      }
      
      // Obtenir la notation ESG
      try {
        const esgRatingValue = await DashboardAccountingService.getESGRating();
        setEsgRating(esgRatingValue);
      } catch (error) {
        console.warn("Erreur lors de la récupération de la notation ESG:", error);
        setEsgRating('B+'); // Valeur par défaut
      }
      
      // Obtenir les soldes des comptes
      try {
        const balances = await DashboardAccountingService.getDashboardBalances();
        setAccountBalances(balances);
      } catch (error) {
        console.warn("Erreur lors du chargement des soldes des comptes:", error);
        // Données par défaut
        setAccountBalances({
          cash: 1750000,
          receivables: 850000,
          payables: 525000
        });
      }
      
      // Obtenir les métriques financières
      try {
        const metrics = await DashboardAccountingService.getFinancialMetrics();
        setFinancialMetrics(metrics);
      } catch (error) {
        console.warn("Erreur lors du chargement des métriques financières:", error);
        // Données par défaut
        setFinancialMetrics({
          totalRevenue: 3500000,
          totalExpenses: 2425000,
          netIncome: 1075000,
          profitMargin: 30.7
        });
      }
      
      // Obtenir les transactions récentes
      try {
        const transactions = await DashboardAccountingService.getRecentTransactions(5);
        setRecentTransactions(transactions);
      } catch (error) {
        console.warn("Erreur lors du chargement des transactions récentes:", error);
        // Données par défaut pour les transactions
        setRecentTransactions([
          {
            id: 't1',
            date: new Date('2025-03-15'),
            reference: 'INV-2025-022',
            description: 'Paiement client Alpha SARL',
            amount: 450000,
            status: 'validated'
          },
          {
            id: 't2',
            date: new Date('2025-03-10'),
            reference: 'PO-2025-018',
            description: 'Achat fournitures',
            amount: 85000,
            status: 'validated'
          },
          {
            id: 't3',
            date: new Date('2025-03-01'),
            reference: 'UTIL-MAR25',
            description: 'Paiement factures utilités',
            amount: 75000,
            status: 'validated'
          }
        ]);
      }
      
      // Charger les informations d'abonnement
      try {
        const db = await DatabaseService.getDBConnection();
        const [subscriptionResult] = await DatabaseService.executeQuery(
          db,
          'SELECT * FROM subscription WHERE user_id = ? ORDER BY expiry_date DESC LIMIT 1',
          [1]
        );
        if (subscriptionResult && subscriptionResult.rows.length > 0) {
          const sub = subscriptionResult.rows.item(0);
          setSubscriptionInfo({
            plan: sub.plan_name,
            expiryDate: new Date(sub.expiry_date),
            features: JSON.parse(sub.features)
          });
        } else {
          // Données par défaut pour l'abonnement
          setSubscriptionInfo({
            plan: 'Pro',
            expiryDate: new Date('2025-12-31'),
            features: ['Comptabilité avancée', 'Support prioritaire', 'Rapports personnalisés']
          });
        }
      } catch (error) {
        console.warn("Erreur lors du chargement des informations d'abonnement:", error);
        // Données par défaut pour l'abonnement
        setSubscriptionInfo({
          plan: 'Pro',
          expiryDate: new Date('2025-12-31'),
          features: ['Comptabilité avancée', 'Support prioritaire', 'Rapports personnalisés']
        });
      }
    } catch (error) {
      console.error("Erreur générale lors du chargement des données du tableau de bord:", error);
    }
  };
  
  const getCreditScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFC107';
    return '#F44336';
  };
  
  const getESGRatingColor = (rating) => {
    const firstChar = rating.charAt(0);
    if (firstChar === 'A') return '#4CAF50';
    if (firstChar === 'B') return '#8BC34A';
    if (firstChar === 'C') return '#FFC107';
    if (firstChar === 'D') return '#FF9800';
    return '#F44336';
  };

  const formatCurrency = (value) => {
    if (currencyInfo) {
      return currencyInfo.format(value);
    }
    
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(value);
  };

  return (
    <OrientationAwareView
      style={styles.container}
      landscapeStyle={styles.containerLandscape}
    >
      <AppHeader title={t('dashboard')} />
      
      {/* Indicateur de mode hors ligne ou données issues du cache */}
      {(!isConnected || isFinancialFromCache) && (
        <View style={styles.offlineIndicator}>
          <MaterialCommunityIcons 
            name={isConnected ? "database" : "wifi-off"} 
            size={16} 
            color="#FFF" 
          />
          <Text style={styles.offlineText}>
            {isConnected ? t('using_cached_data') : t('offline_mode')}
          </Text>
        </View>
      )}
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          isLandscape && styles.contentLandscape
        ]}
      >
        {/* ...existing code... */}
      </ScrollView>

      {/* Snackbar pour notification mode hors ligne */}
      <Snackbar
        visible={offlineSnackVisible}
        onDismiss={() => setOfflineSnackVisible(false)}
        duration={3000}
        action={{
          label: t('ok'),
          onPress: () => setOfflineSnackVisible(false),
        }}
        style={styles.offlineSnackbar}
      >
        {t('offline_mode_enabled')}
      </Snackbar>
      
      {/* ...existing code for Portal with dialogs... */}
    </OrientationAwareView>
  );
};

// Styles existants
const existingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  innerCard: {
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 1,
  },
  collapsedCard: {
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  innerCardTitle: {
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButton: {
    margin: 0,
    padding: 0,
  },
  ratingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  ratingItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
    alignSelf: 'center',
  },
  ratingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  scoreIndicator: {
    width: 12,
    height: '80%',
    borderRadius: 6,
  },
  balancesContainer: {
    marginTop: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#757575',
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  subscriptionContainer: {
    marginTop: 8,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionPlanName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  subscriptionExpiry: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  divider: {
    marginVertical: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
  },
  dialog: {
    maxHeight: '80%',
  },
  dialogScrollArea: {
    height: 400,
  },
  dialogSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  dialogText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  scoreRangeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
});

// Styles additionnels
const additionalStyles = StyleSheet.create({
  transactionsContainer: {
    marginTop: 8,
  },
  activitiesContainer: {
    marginTop: 8,
  },
  collapsedCard: {
    marginBottom: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalRow: {
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 0,
    paddingTop: 12,
    paddingBottom: 8,
  },
  balanceLabelTotal: {
    fontSize: 15,
    fontWeight: '600',
  },
  balanceValueTotal: {
    fontSize: 15,
    fontWeight: '700',
  },
  landscapeContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  landscapeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  landscapeColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  fullWidthCard: {
    flex: 1,
    marginHorizontal: 8,
    marginBottom: 16,
  },
});

// Nouveaux styles pour l'adaptation à l'orientation
const orientationStyles = StyleSheet.create({
  containerLandscape: {
    backgroundColor: '#f5f5f5',
  },
  contentLandscape: {
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardLandscape: {
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 12,
    minWidth: '48%',
  },
});

// Nouveaux styles pour la gestion du mode hors ligne
const offlineStyles = StyleSheet.create({
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    padding: 4,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  offlineText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  offlineSnackbar: {
    backgroundColor: '#455A64',
  },
  dataSourceBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dataSourceBadgeText: {
    color: '#FFF',
    fontSize: 10,
  },
});

const styles = StyleSheet.create({
  ...existingStyles,
  ...additionalStyles,
  ...orientationStyles,
  ...offlineStyles,
});

export default DashboardScreen;
