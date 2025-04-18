import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Text, IconButton, Button, Dialog, Portal, Divider, ProgressBar, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

// Import des composants et données
import SubscriptionStatusWidget from '../../components/dashboard/SubscriptionStatusWidget';
import RecentTransactionsWidget from '../../components/dashboard/RecentTransactionsWidget';
import QuickFinanceActionsButton from '../../components/dashboard/QuickFinanceActionsButton';

const DashboardScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isLandscape, dimensions } = useOrientation();
  
  // États pour les sections togglables
  const [showCreditScore, setShowCreditScore] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const [showSubscription, setShowSubscription] = useState(true);
  const [showTransactions, setShowTransactions] = useState(true);
  const [showActivities, setShowActivities] = useState(true);
  
  // États pour les dialogues d'information
  const [creditInfoVisible, setCreditInfoVisible] = useState(false);
  const [esgInfoVisible, setEsgInfoVisible] = useState(false);
  
  // Données des scores et soldes
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
  
  // Informations sur l'abonnement (ajout de l'état manquant)
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    plan: '',
    expiryDate: new Date(),
    features: []
  });
  
  useEffect(() => {
    // Charger les données du tableau de bord depuis le service centralisé
    loadDashboardData();
  }, []);
  
  // Fonction pour charger les données du tableau de bord
  const loadDashboardData = async () => {
    try {
      // Obtenir les informations sur la devise actuelle
      const currency = await DashboardAccountingService.getCurrentCurrencyInfo();
      setCurrencyInfo(currency);
      
      // Obtenir la cote de crédit
      const score = await DashboardAccountingService.calculateCreditScore();
      setCreditScore(score);
      
      // Obtenir la notation ESG
      const esgRatingValue = await DashboardAccountingService.getESGRating();
      setEsgRating(esgRatingValue);
      
      // Obtenir les soldes des comptes
      const balances = await DashboardAccountingService.getDashboardBalances();
      setAccountBalances(balances);
      
      // Obtenir les métriques financières
      const metrics = await DashboardAccountingService.getFinancialMetrics();
      setFinancialMetrics(metrics);
      
      // Obtenir les transactions récentes
      const transactions = await DashboardAccountingService.getRecentTransactions(5);
      setRecentTransactions(transactions);
      
      // Charger les informations d'abonnement
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
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données du tableau de bord:", error);
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

  // Fonction pour formater les montants selon la devise sélectionnée
  const formatCurrency = (value) => {
    if (currencyInfo) {
      return currencyInfo.format(value);
    }
    
    // Fallback au format par défaut si pas d'info sur la devise
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
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          isLandscape && styles.contentLandscape
        ]}
      >
        {isLandscape ? (
          // Disposition en mode paysage - Utilisation de la grille adaptive
          <AdaptiveGrid
            portraitColumns={1}
            landscapeColumns={2}
            spacing={12}
          >
            {/* Carte de résumé financier */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Title>{t('financial_summary')}</Title>
                  <View style={styles.actionButtonsContainer}>
                    <QuickFinanceActionsButton />
                    <IconButton 
                      icon="refresh" 
                      size={20} 
                      onPress={() => loadDashboardData()} 
                    />
                  </View>
                </View>
                
                {/* Section Cote de Crédit et ESG - Togglable */}
                <Card style={[styles.innerCard, !showCreditScore && styles.collapsedCard]}>
                  <Card.Content>
                    <TouchableOpacity 
                      onPress={() => setShowCreditScore(!showCreditScore)}
                      style={styles.cardHeader}
                    >
                      <Title style={styles.innerCardTitle}>{t('credit_score_and_ratings')}</Title>
                      <View style={styles.actionButtons}>
                        <IconButton 
                          icon="information-outline" 
                          size={20} 
                          onPress={() => setCreditInfoVisible(true)} 
                        />
                        <IconButton 
                          icon={showCreditScore ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          onPress={() => setShowCreditScore(!showCreditScore)} 
                        />
                      </View>
                    </TouchableOpacity>
                    
                    {showCreditScore && (
                      <View style={styles.ratingsContainer}>
                        <View style={styles.ratingItem}>
                          <View>
                            <Text style={styles.ratingLabel}>{t('credit_score')}</Text>
                            <Text style={[styles.scoreValue, { color: getCreditScoreColor(creditScore) }]}>
                              {creditScore}/100
                            </Text>
                          </View>
                          <View style={[styles.scoreIndicator, { backgroundColor: getCreditScoreColor(creditScore) }]} />
                        </View>
                        
                        <View style={styles.ratingDivider} />
                        
                        <View style={styles.ratingItem}>
                          <View>
                            <View style={styles.ratingLabelContainer}>
                              <Text style={styles.ratingLabel}>{t('esg_rating')}</Text>
                              <IconButton 
                                icon="information-outline" 
                                size={16} 
                                onPress={() => setEsgInfoVisible(true)} 
                                style={styles.infoButton}
                              />
                            </View>
                            <Text style={[styles.scoreValue, { color: getESGRatingColor(esgRating) }]}>
                              {esgRating}
                            </Text>
                          </View>
                          <View style={[styles.scoreIndicator, { backgroundColor: getESGRatingColor(esgRating) }]} />
                        </View>
                      </View>
                    )}
                  </Card.Content>
                </Card>
                
                {/* Section Soldes - Togglable */}
                <Card style={[styles.innerCard, !showBalances && styles.collapsedCard]}>
                  <Card.Content>
                    <TouchableOpacity 
                      onPress={() => setShowBalances(!showBalances)}
                      style={styles.cardHeader}
                    >
                      <Title style={styles.innerCardTitle}>{t('balances')}</Title>
                      <IconButton 
                        icon={showBalances ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        onPress={() => setShowBalances(!showBalances)} 
                      />
                    </TouchableOpacity>
                    
                    {showBalances && (
                      <View style={styles.balancesContainer}>
                        <View style={styles.balanceRow}>
                          <Text style={styles.balanceLabel}>{t('cash')}</Text>
                          <Text style={styles.balanceValue}>
                            {formatCurrency(accountBalances.cash)}
                          </Text>
                        </View>
                        <View style={styles.balanceRow}>
                          <Text style={styles.balanceLabel}>{t('accounts_receivable')}</Text>
                          <Text style={styles.balanceValue}>
                            {formatCurrency(accountBalances.receivables)}
                          </Text>
                        </View>
                        <View style={styles.balanceRow}>
                          <Text style={styles.balanceLabel}>{t('accounts_payable')}</Text>
                          <Text style={styles.balanceValue}>
                            {formatCurrency(accountBalances.payables)}
                          </Text>
                        </View>
                        <View style={[styles.balanceRow, styles.totalRow]}>
                          <Text style={styles.balanceLabelTotal}>{t('net_position')}</Text>
                          <Text style={[
                            styles.balanceValueTotal,
                            {color: financialMetrics.netIncome >= 0 ? '#4CAF50' : '#F44336'}
                          ]}>
                            {formatCurrency(financialMetrics.netIncome)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              </Card.Content>
            </Card>
            
            {/* Widget Statut de l'Abonnement avec Tokens */}
            <SubscriptionStatusWidget 
              collapsed={!showSubscription} 
              onToggleCollapse={() => setShowSubscription(!showSubscription)} 
              isLandscape={isLandscape}
            />
            
            {/* Widget des transactions récentes */}
            <Card style={styles.card}>
              <Card.Content>
                <TouchableOpacity 
                  onPress={() => setShowTransactions(!showTransactions)}
                  style={styles.cardHeader}
                >
                  <Title>{t('recent_transactions')}</Title>
                  <IconButton 
                    icon={showTransactions ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    onPress={() => setShowTransactions(!showTransactions)} 
                  />
                </TouchableOpacity>
                
                {showTransactions && (
                  <RecentTransactionsWidget transactions={recentTransactions} />
                )}
              </Card.Content>
            </Card>
            
            {/* Section Activités Récentes - Togglable */}
            <Card style={styles.card}>
              <Card.Content>
                <TouchableOpacity 
                  onPress={() => setShowActivities(!showActivities)}
                  style={styles.cardHeader}
                >
                  <Title>{t('recent_activities')}</Title>
                  <IconButton 
                    icon={showActivities ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    onPress={() => setShowActivities(!showActivities)} 
                  />
                </TouchableOpacity>
                
                {showActivities && (
                  <View style={styles.activitiesContainer}>
                    {/* Contenu des activités récentes */}
                  </View>
                )}
              </Card.Content>
            </Card>
          </AdaptiveGrid>
        ) : (
          // Disposition en mode portrait - Structure originale
          <View>
            {/* Carte de résumé financier */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Title>{t('financial_summary')}</Title>
                  <View style={styles.actionButtonsContainer}>
                    <QuickFinanceActionsButton />
                    <IconButton 
                      icon="refresh" 
                      size={20} 
                      onPress={() => loadDashboardData()} 
                    />
                  </View>
                </View>
                
                {/* Section Cote de Crédit et ESG - Togglable */}
                <Card style={[styles.innerCard, !showCreditScore && styles.collapsedCard]}>
                  <Card.Content>
                    <TouchableOpacity 
                      onPress={() => setShowCreditScore(!showCreditScore)}
                      style={styles.cardHeader}
                    >
                      <Title style={styles.innerCardTitle}>{t('credit_score_and_ratings')}</Title>
                      <View style={styles.actionButtons}>
                        <IconButton 
                          icon="information-outline" 
                          size={20} 
                          onPress={() => setCreditInfoVisible(true)} 
                        />
                        <IconButton 
                          icon={showCreditScore ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          onPress={() => setShowCreditScore(!showCreditScore)} 
                        />
                      </View>
                    </TouchableOpacity>
                    
                    {showCreditScore && (
                      <View style={styles.ratingsContainer}>
                        <View style={styles.ratingItem}>
                          <View>
                            <Text style={styles.ratingLabel}>{t('credit_score')}</Text>
                            <Text style={[styles.scoreValue, { color: getCreditScoreColor(creditScore) }]}>
                              {creditScore}/100
                            </Text>
                          </View>
                          <View style={[styles.scoreIndicator, { backgroundColor: getCreditScoreColor(creditScore) }]} />
                        </View>
                        
                        <View style={styles.ratingDivider} />
                        
                        <View style={styles.ratingItem}>
                          <View>
                            <View style={styles.ratingLabelContainer}>
                              <Text style={styles.ratingLabel}>{t('esg_rating')}</Text>
                              <IconButton 
                                icon="information-outline" 
                                size={16} 
                                onPress={() => setEsgInfoVisible(true)} 
                                style={styles.infoButton}
                              />
                            </View>
                            <Text style={[styles.scoreValue, { color: getESGRatingColor(esgRating) }]}>
                              {esgRating}
                            </Text>
                          </View>
                          <View style={[styles.scoreIndicator, { backgroundColor: getESGRatingColor(esgRating) }]} />
                        </View>
                      </View>
                    )}
                  </Card.Content>
                </Card>
                
                {/* Section Soldes - Togglable */}
                <Card style={[styles.innerCard, !showBalances && styles.collapsedCard]}>
                  <Card.Content>
                    <TouchableOpacity 
                      onPress={() => setShowBalances(!showBalances)}
                      style={styles.cardHeader}
                    >
                      <Title style={styles.innerCardTitle}>{t('balances')}</Title>
                      <IconButton 
                        icon={showBalances ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        onPress={() => setShowBalances(!showBalances)} 
                      />
                    </TouchableOpacity>
                    
                    {showBalances && (
                      <View style={styles.balancesContainer}>
                        <View style={styles.balanceRow}>
                          <Text style={styles.balanceLabel}>{t('cash')}</Text>
                          <Text style={styles.balanceValue}>
                            {formatCurrency(accountBalances.cash)}
                          </Text>
                        </View>
                        <View style={styles.balanceRow}>
                          <Text style={styles.balanceLabel}>{t('accounts_receivable')}</Text>
                          <Text style={styles.balanceValue}>
                            {formatCurrency(accountBalances.receivables)}
                          </Text>
                        </View>
                        <View style={styles.balanceRow}>
                          <Text style={styles.balanceLabel}>{t('accounts_payable')}</Text>
                          <Text style={styles.balanceValue}>
                            {formatCurrency(accountBalances.payables)}
                          </Text>
                        </View>
                        <View style={[styles.balanceRow, styles.totalRow]}>
                          <Text style={styles.balanceLabelTotal}>{t('net_position')}</Text>
                          <Text style={[
                            styles.balanceValueTotal,
                            {color: financialMetrics.netIncome >= 0 ? '#4CAF50' : '#F44336'}
                          ]}>
                            {formatCurrency(financialMetrics.netIncome)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              </Card.Content>
            </Card>
            
            {/* Widget Statut de l'Abonnement avec Tokens */}
            <SubscriptionStatusWidget 
              collapsed={!showSubscription} 
              onToggleCollapse={() => setShowSubscription(!showSubscription)} 
            />
            
            {/* Widget des transactions récentes */}
            <Card style={styles.card}>
              <Card.Content>
                <TouchableOpacity 
                  onPress={() => setShowTransactions(!showTransactions)}
                  style={styles.cardHeader}
                >
                  <Title>{t('recent_transactions')}</Title>
                  <IconButton 
                    icon={showTransactions ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    onPress={() => setShowTransactions(!showTransactions)} 
                  />
                </TouchableOpacity>
                
                {showTransactions && (
                  <RecentTransactionsWidget transactions={recentTransactions} />
                )}
              </Card.Content>
            </Card>
            
            {/* Section Activités Récentes - Togglable */}
            <Card style={styles.card}>
              <Card.Content>
                <TouchableOpacity 
                  onPress={() => setShowActivities(!showActivities)}
                  style={styles.cardHeader}
                >
                  <Title>{t('recent_activities')}</Title>
                  <IconButton 
                    icon={showActivities ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    onPress={() => setShowActivities(!showActivities)} 
                  />
                </TouchableOpacity>
                
                {showActivities && (
                  <View style={styles.activitiesContainer}>
                    {/* Contenu des activités récentes */}
                  </View>
                )}
              </Card.Content>
            </Card>
          </View>
        )}
      </ScrollView>
      
      {/* Dialogues d'information - aucun changement nécessaire ici */}
      <Portal>
        <Dialog 
          visible={creditInfoVisible} 
          onDismiss={() => setCreditInfoVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>{t('credit_score_information')}</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <Text style={styles.dialogSubtitle}>{t('what_is_credit_score')}</Text>
              <Text style={styles.dialogText}>
                La cote de crédit est une évaluation de votre solvabilité sur une échelle de 0 à 100. 
                Elle est calculée automatiquement à partir de vos données comptables.
                Elle est utilisée par les institutions financières pour déterminer le risque associé à vous accorder un crédit.
              </Text>
              
              <Text style={styles.dialogSubtitle}>{t('score_ranges')}</Text>
              
              <Text style={[styles.scoreRangeTitle, {color: '#4CAF50'}]}>80-100: Excellent</Text>
              <Text style={styles.dialogText}>
                • Accès aux meilleures conditions de crédit
                • Taux d'intérêt préférentiels
                • Garantie de crédit minimale ou absente
                • Accès prioritaire aux programmes de leasing d'équipements
                • Conditions d'achat préférentielles chez les fournisseurs partenaires
              </Text>
              
              <Text style={[styles.scoreRangeTitle, {color: '#8BC34A'}]}>60-79: Bon</Text>
              <Text style={styles.dialogText}>
                • Bonnes conditions de crédit
                • Taux d'intérêt compétitifs
                • Garantie de crédit partielle requise
                • Accès aux programmes de leasing standard
                • Conditions d'achat avantageuses
              </Text>
              
              <Text style={[styles.scoreRangeTitle, {color: '#FFC107'}]}>40-59: Moyen</Text>
              <Text style={styles.dialogText}>
                • Accès limité au crédit
                • Taux d'intérêt plus élevés
                • Garantie substantielle requise
                • Accès conditionnel aux programmes de leasing
                • Conditions d'achat standards
              </Text>
              
              <Text style={[styles.scoreRangeTitle, {color: '#FF9800'}]}>20-39: Risqué</Text>
              <Text style={styles.dialogText}>
                • Accès très limité au crédit
                • Taux d'intérêt élevés
                • Garantie complète requise
                • Pas d'accès au leasing
                • Paiement à l'avance requis chez certains fournisseurs
              </Text>
              
              <Text style={[styles.scoreRangeTitle, {color: '#F44336'}]}>0-19: Critique</Text>
              <Text style={styles.dialogText}>
                • Accès au crédit généralement refusé
                • Besoin d'un garant solide
                • Conditions d'achat restrictives
                • Plan de redressement financier recommandé
              </Text>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setCreditInfoVisible(false)}>{t('close')}</Button>
          </Dialog.Actions>
        </Dialog>
        
        {/* Dialogue d'information sur la note ESG */}
        <Dialog 
          visible={esgInfoVisible} 
          onDismiss={() => setEsgInfoVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>{t('esg_rating_information')}</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <Text style={styles.dialogSubtitle}>{t('what_is_esg')}</Text>
              <Text style={styles.dialogText}>
                La note ESG (Environnement, Social et Gouvernance) évalue les pratiques responsables de votre entreprise.
                Elle reflète vos performances dans les domaines environnementaux, sociaux et de gouvernance d'entreprise.
              </Text>
              
              <Text style={styles.dialogSubtitle}>{t('esg_rating_scale')}</Text>
              
              <Text style={[styles.scoreRangeTitle, {color: '#4CAF50'}]}>A+ / A : Excellence</Text>
              <Text style={styles.dialogText}>
                • Leadership exemplaire en matière de pratiques ESG
                • Admissibilité aux financements verts et durables à taux préférentiels
                • Attractivité accrue pour les investisseurs responsables
                • Reconnaissance sur le marché comme leader en développement durable
                • Avantages réputationnels significatifs
              </Text>
              
              <Text style={[styles.scoreRangeTitle, {color: '#8BC34A'}]}>B+ / B : Bonne performance</Text>
              <Text style={styles.dialogText}>
                • Bonnes pratiques ESG au-dessus de la moyenne du secteur
                • Accès à certains financements durables
                • Image positive auprès des clients et partenaires
                • Intégration efficace des principes de durabilité
              </Text>
              
              <Text style={[styles.scoreRangeTitle, {color: '#FFC107'}]}>C+ / C : Performance moyenne</Text>
              <Text style={styles.dialogText}>
                • Conformité basique aux exigences ESG
                • Risques ESG modérés
                • Opportunités d'amélioration identifiées
                • Nécessité d'une stratégie ESG plus robuste
              </Text>
              
              <Text style={[styles.scoreRangeTitle, {color: '#FF9800'}]}>D+ / D : Performance limitée</Text>
              <Text style={styles.dialogText}>
                • Lacunes significatives dans les pratiques ESG
                • Risques ESG élevés
                • Accès limité aux financements verts
                • Nécessité d'un plan d'action correctif
              </Text>
              
              <Text style={[styles.scoreRangeTitle, {color: '#F44336'}]}>E+ / E : Performance insuffisante</Text>
              <Text style={styles.dialogText}>
                • Non-conformité aux standards ESG essentiels
                • Risques réputationnels et réglementaires majeurs
                • Exclusion possible de certains marchés et opportunités de financement
                • Besoin urgent d'une transformation des pratiques
              </Text>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setEsgInfoVisible(false)}>{t('close')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  // Styles pour les ratings (crédit et ESG)
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
  // Styles pour les balances
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
  // Styles pour l'abonnement
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
  // Styles pour les dialogues
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
  }
});

// Nouveaux styles pour l'adaptation à l'orientation
const orientationStyles = StyleSheet.create({
  containerLandscape: {
    backgroundColor: '#f5f5f5',
  },
  contentLandscape: {
    padding: 12, // Légèrement réduit en mode paysage
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardLandscape: {
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 12,
    minWidth: '48%', // Pour garantir un affichage sur deux colonnes
  },
});

const styles = StyleSheet.create({
  ...existingStyles,
  ...additionalStyles,
  ...orientationStyles,
});

export default DashboardScreen;

// Définir correctement la fonction setSubscriptionInfo au niveau du composant
function setSubscriptionInfo(subscriptionData: { plan: string; expiryDate: Date; features: any[] }) {
  // Vous pouvez implémenter cette fonction selon vos besoins
  // Par exemple, mettre à jour un état local ou global, ou appeler une API
  console.log('Subscription info updated:', subscriptionData);
  
  // Si vous avez un état global de gestion d'abonnement, vous pouvez l'utiliser ici
  // Par exemple avec un hook personnalisé : useSubscription().updateSubscription(subscriptionData);
}
