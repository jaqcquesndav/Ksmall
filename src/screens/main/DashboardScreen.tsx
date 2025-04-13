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

const DashboardScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  
  // États pour les sections togglables
  const [showCreditScore, setShowCreditScore] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const [showSubscription, setShowSubscription] = useState(true);
  const [showTransactions, setShowTransactions] = useState(true);
  const [showActivities, setShowActivities] = useState(true);
  
  // États pour les dialogues d'information
  const [creditInfoVisible, setCreditInfoVisible] = useState(false);
  const [esgInfoVisible, setEsgInfoVisible] = useState(false);
  
  // Données des scores et soldes (normalement chargées depuis la base de données)
  const [creditScore, setCreditScore] = useState(78);
  const [esgRating, setEsgRating] = useState('B+');
  const [accountBalances, setAccountBalances] = useState({
    cash: 2500000,
    receivables: 1750000,
    payables: 950000
  });
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    plan: 'Premium',
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    features: ['Comptabilité avancée', 'Support prioritaire', 'Rapports illimités', 'API accès']
  });
  
  useEffect(() => {
    // Charger les données depuis la base de données SQLite
    const loadDashboardData = async () => {
      try {
        // Exemple de requête pour obtenir les données
        const db = await DatabaseService.getDBConnection();
        
        // Requête pour la cote de crédit
        const [creditScoreResult] = await DatabaseService.executeQuery(
          db,
          'SELECT value FROM user_metrics WHERE metric_name = ?',
          ['credit_score']
        );
        if (creditScoreResult && creditScoreResult.rows.length > 0) {
          setCreditScore(creditScoreResult.rows.item(0).value);
        }
        
        // Requête pour la note ESG
        const [esgResult] = await DatabaseService.executeQuery(
          db,
          'SELECT value FROM user_metrics WHERE metric_name = ?',
          ['esg_rating']
        );
        if (esgResult && esgResult.rows.length > 0) {
          setEsgRating(esgResult.rows.item(0).value);
        }
        
        // Requête pour les soldes de compte
        const [balancesResult] = await DatabaseService.executeQuery(
          db,
          'SELECT account_type, SUM(balance) as total FROM accounts GROUP BY account_type',
          []
        );
        if (balancesResult && balancesResult.rows.length > 0) {
          const newBalances = { cash: 0, receivables: 0, payables: 0 };
          for (let i = 0; i < balancesResult.rows.length; i++) {
            const item = balancesResult.rows.item(i);
            if (item.account_type === 'cash') newBalances.cash = item.total;
            if (item.account_type === 'receivable') newBalances.receivables = item.total;
            if (item.account_type === 'payable') newBalances.payables = item.total;
          }
          setAccountBalances(newBalances);
        }
        
        // Requête pour les informations d'abonnement
        const [subscriptionResult] = await DatabaseService.executeQuery(
          db,
          'SELECT * FROM subscription WHERE user_id = ? ORDER BY expiry_date DESC LIMIT 1',
          [1] // Supposant que l'ID utilisateur est 1
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
    
    loadDashboardData();
  }, []);

  // Fonctions pour les couleurs des scores
  const getCreditScoreColor = (score) => {
    if (score >= 80) return '#4CAF50'; // Vert
    if (score >= 60) return '#FFC107'; // Jaune
    return '#F44336'; // Rouge
  };
  
  const getESGRatingColor = (rating) => {
    const firstChar = rating.charAt(0);
    if (firstChar === 'A') return '#4CAF50';
    if (firstChar === 'B') return '#8BC34A';
    if (firstChar === 'C') return '#FFC107';
    if (firstChar === 'D') return '#FF9800';
    return '#F44336';
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('dashboard')} />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Carte de résumé financier */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Title>{t('financial_summary')}</Title>
                <IconButton 
                  icon="refresh" 
                  size={20} 
                  onPress={() => console.log('Refresh stats')} 
                />
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
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'XOF'
                          }).format(accountBalances.cash)}
                        </Text>
                      </View>
                      <View style={styles.balanceRow}>
                        <Text style={styles.balanceLabel}>{t('accounts_receivable')}</Text>
                        <Text style={styles.balanceValue}>
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'XOF'
                          }).format(accountBalances.receivables)}
                        </Text>
                      </View>
                      <View style={styles.balanceRow}>
                        <Text style={styles.balanceLabel}>{t('accounts_payable')}</Text>
                        <Text style={styles.balanceValue}>
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'XOF'
                          }).format(accountBalances.payables)}
                        </Text>
                      </View>
                    </View>
                  )}
                </Card.Content>
              </Card>
              
              {/* Section Abonnement - Togglable */}
              <Card style={[styles.innerCard, !showSubscription && styles.collapsedCard]}>
                <Card.Content>
                  <TouchableOpacity 
                    onPress={() => setShowSubscription(!showSubscription)}
                    style={styles.cardHeader}
                  >
                    <Title style={styles.innerCardTitle}>{t('subscription_status')}</Title>
                    <IconButton 
                      icon={showSubscription ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      onPress={() => setShowSubscription(!showSubscription)} 
                    />
                  </TouchableOpacity>
                  
                  {showSubscription && (
                    <View style={styles.subscriptionContainer}>
                      <View style={styles.subscriptionHeader}>
                        <View>
                          <Text style={styles.subscriptionPlanName}>{subscriptionInfo.plan}</Text>
                          <Text style={styles.subscriptionExpiry}>
                            {t('expires')}: {format(subscriptionInfo.expiryDate, 'dd MMMM yyyy', {locale: fr})}
                          </Text>
                        </View>
                        <Button mode="contained">{t('upgrade')}</Button>
                      </View>
                      
                      <Divider style={styles.divider} />
                      
                      <Text style={styles.featureTitle}>{t('included_features')}:</Text>
                      {subscriptionInfo.features.map((feature, index) => (
                        <View key={`feature-${index}`} style={styles.featureItem}>
                          <MaterialCommunityIcons name="check-circle" size={18} color={theme.colors.primary} />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Card.Content>
              </Card>
            </Card.Content>
          </Card>
          
          {/* Section Transactions Récentes - Togglable */}
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
                <View style={styles.transactionsContainer}>
                  {/* Contenu des transactions récentes */}
                </View>
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
      </ScrollView>
      
      {/* Dialogue d'information sur la cote de crédit */}
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
    </View>
  );
};

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
});

const styles = StyleSheet.create({
  ...existingStyles,
  ...additionalStyles,
});

export default DashboardScreen;