import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Alert, TouchableOpacity } from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Paragraph, 
  Divider, 
  Button, 
  TextInput, 
  ToggleButton, 
  Appbar,
  List,
  Chip, 
  FAB,
  ActivityIndicator
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import FinanceAccountingService from '../../services/FinanceAccountingService';
import { Colors } from '../../constants/Colors';
import useBondIssuances from '../../hooks/useBondIssuances';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import CurrencyAmount from '../../components/common/CurrencyAmount';
import { useCurrency } from '../../hooks/useCurrency';

const FINANCIAL_INSTITUTIONS = [
  {
    id: 'gov',
    name: 'Trésor Public',
    icon: 'account-balance',
    shortDesc: 'Émissions d\'État',
    ratings: { moodys: 'Aa3', sp: 'A+', fitch: 'AA-' },
    isPublic: true
  },
  {
    id: 'bnp',
    name: 'BNP Paribas',
    icon: 'account-balance',
    shortDesc: 'Grande banque française',
    ratings: { moodys: 'Aa3', sp: 'A+', fitch: 'A+' },
    isPublic: false
  },
  {
    id: 'ca',
    name: 'Crédit Agricole',
    icon: 'account-balance',
    shortDesc: 'Réseau bancaire coopératif',
    ratings: { moodys: 'Aa3', sp: 'A+', fitch: 'A+' },
    isPublic: false
  },
  {
    id: 'sg',
    name: 'Société Générale',
    icon: 'account-balance',
    shortDesc: 'Banque universelle',
    ratings: { moodys: 'A1', sp: 'A', fitch: 'A' },
    isPublic: false
  },
  {
    id: 'axa',
    name: 'AXA',
    icon: 'verified-user',
    shortDesc: 'Assurance et gestion d\'actifs',
    ratings: { moodys: 'A2', sp: 'A', fitch: 'A+' },
    isPublic: false
  },
  {
    id: 'me',
    name: 'Votre Entreprise',
    icon: 'business',
    shortDesc: 'Vos propres émissions',
    ratings: { internal: 'B+' },
    isSelf: true
  }
];

const investments = [
  {
    type: 'shortTermBonds',
    institution: 'gov',
    name: 'Bon du Trésor 1 an',
    rate: 1.8,
    term: 12,
    minAmount: 1000,
    description: 'Obligation d\'État à court terme avec risque minimal'
  },
  {
    type: 'governmentBonds',
    institution: 'gov',
    name: 'OAT 5 ans',
    rate: 2.5,
    term: 60,
    minAmount: 5000,
    description: 'Obligation Assimilable du Trésor à moyen terme'
  },
  {
    type: 'governmentBonds',
    institution: 'gov',
    name: 'OAT 10 ans',
    rate: 3.2,
    term: 120,
    minAmount: 5000,
    description: 'Obligation Assimilable du Trésor à long terme'
  },
  {
    type: 'privateBonds',
    institution: 'bnp',
    name: 'Obligation BNP Paribas 3 ans',
    rate: 3.9,
    term: 36,
    minAmount: 10000,
    description: 'Obligation d\'entreprise de BNP Paribas'
  },
  {
    type: 'privateBonds',
    institution: 'ca',
    name: 'Obligation CA 5 ans',
    rate: 4.1,
    term: 60,
    minAmount: 10000,
    description: 'Obligation d\'entreprise de Crédit Agricole'
  },
  {
    type: 'privateBonds',
    institution: 'sg',
    name: 'SG Green Bond 4 ans',
    rate: 4.2,
    term: 48,
    minAmount: 10000,
    description: 'Obligation verte de Société Générale'
  },
  {
    type: 'privateBonds',
    institution: 'axa',
    name: 'AXA Sustainable Bond 3 ans',
    rate: 3.8,
    term: 36,
    minAmount: 10000,
    description: 'Obligation durable d\'AXA'
  }
];

const FinanceInvestmentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { type } = route.params as { type: string };
  const { currencyInfo } = useCurrency();
  
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [isPublicFilter, setIsPublicFilter] = useState('both');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('buy'); // 'buy' ou 'manage'
  
  // Utiliser le hook pour récupérer les émissions d'obligations
  const { 
    issuances, 
    loading: issuancesLoading, 
    refreshIssuances,
    totalIssuanceAmount,
    totalInterestPaid
  } = useBondIssuances();

  // Filtrer les institutions financières
  const filteredInstitutions = FINANCIAL_INSTITUTIONS.filter(institution => {
    if (isPublicFilter === 'both') return true;
    if (isPublicFilter === 'public') return institution.isPublic === true;
    if (isPublicFilter === 'private') return institution.isPublic === false;
    return true;
  });

  // Filtrer les investissements disponibles
  const filteredInvestments = selectedInstitution 
    ? investments.filter(inv => inv.institution === selectedInstitution.id)
    : [];

  const handleInstitutionSelect = (institution) => {
    setSelectedInstitution(institution);
    setSelectedInvestment(null);
    
    // Si on sélectionne notre propre entreprise, basculer vers l'onglet de gestion
    if (institution.isSelf) {
      setActiveTab('manage');
    }
  };

  const handleInvestmentSelect = (investment) => {
    setSelectedInvestment(investment);
  };

  const handleInvest = async () => {
    if (!selectedInvestment || !amount) {
      Alert.alert('Information manquante', 'Veuillez sélectionner un investissement et saisir un montant.');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Montant invalide', 'Veuillez saisir un montant valide.');
      return;
    }

    if (amountValue < selectedInvestment.minAmount) {
      Alert.alert('Montant insuffisant', `Le montant minimum pour cet investissement est de ${selectedInvestment.minAmount} €.`);
      return;
    }

    setLoading(true);
    try {
      const institution = FINANCIAL_INSTITUTIONS.find(i => i.id === selectedInvestment.institution);
      
      await FinanceAccountingService.recordInvestmentPurchase({
        type: selectedInvestment.type,
        amount: amountValue,
        term: selectedInvestment.term,
        financialInstitution: institution.name,
        isPublic: institution.isPublic,
        interestRate: selectedInvestment.rate
      });

      Alert.alert(
        'Investissement réussi', 
        `Vous avez investi ${amountValue.toLocaleString()} ${currencyInfo.symbol} dans "${selectedInvestment.name}". Les écritures comptables ont été créées.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Erreur lors de l\'investissement:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'investissement.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmitBonds = () => {
    navigation.navigate('BondIssuance');
  };
  
  // Format une date au format français
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
    } catch (e) {
      return dateString;
    }
  };

  const getInvestmentTypeLabel = (type) => {
    const labels = {
      shortTermBonds: 'Obligations court terme',
      governmentBonds: 'Obligations publiques',
      privateBonds: 'Obligations privées',
      treasuryNotes: 'Bons de trésor',
      corporateBonds: 'Obligations d\'entreprise',
      convertibleBonds: 'Obligations convertibles'
    };
    
    return labels[type] || type;
  };

  // Rendu pour l'onglet d'achat d'obligations
  const renderBuyTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Choisir un émetteur</Title>
          
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Type d'émetteur:</Text>
            <ToggleButton.Row 
              onValueChange={value => setIsPublicFilter(value)} 
              value={isPublicFilter}
            >
              <ToggleButton icon="earth" value="public" />
              <ToggleButton icon="domain" value="private" />
              <ToggleButton icon="all-inclusive" value="both" />
            </ToggleButton.Row>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.institutionsContainer}
          >
            {filteredInstitutions.map((institution) => (
              <TouchableOpacity
                key={institution.id}
                onPress={() => handleInstitutionSelect(institution)}
                style={[
                  styles.institutionCard,
                  selectedInstitution?.id === institution.id && styles.selectedInstitution
                ]}
              >
                <MaterialIcons 
                  name={institution.icon as any} 
                  size={28} 
                  color={selectedInstitution?.id === institution.id ? Colors.primary : '#757575'} 
                />
                <Text style={styles.institutionName}>{institution.name}</Text>
                <Text style={styles.institutionDesc}>{institution.shortDesc}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card.Content>
      </Card>
      
      {selectedInstitution && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Options d'investissement</Title>
            {filteredInvestments.length > 0 ? (
              filteredInvestments.map((investment) => (
                <TouchableOpacity
                  key={`${investment.institution}-${investment.name}`}
                  style={[
                    styles.investmentOption,
                    selectedInvestment?.name === investment.name && styles.selectedInvestment
                  ]}
                  onPress={() => handleInvestmentSelect(investment)}
                >
                  <View style={styles.investmentHeader}>
                    <Text style={styles.investmentName}>{investment.name}</Text>
                    <Text style={styles.investmentRate}>{investment.rate}%</Text>
                  </View>
                  <View style={styles.investmentDetails}>
                    <Text style={styles.investmentTerm}>Durée: {investment.term} mois</Text>
                    <Text style={styles.investmentMinAmount}>
                      Min: <CurrencyAmount amount={investment.minAmount} />
                    </Text>
                  </View>
                  <Text style={styles.investmentDescription}>{investment.description}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Paragraph style={styles.noOptions}>
                Pas d'options d'investissement disponibles pour cet émetteur.
              </Paragraph>
            )}
          </Card.Content>
        </Card>
      )}
      
      {selectedInvestment && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Finaliser l'investissement</Title>
            <TextInput
              label="Montant à investir (€)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="currency-eur" />}
            />
            
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Émetteur:</Text>
                <Text style={styles.summaryValue}>
                  {FINANCIAL_INSTITUTIONS.find(i => i.id === selectedInvestment.institution).name}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Type:</Text>
                <Text style={styles.summaryValue}>
                  {getInvestmentTypeLabel(selectedInvestment.type)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Taux:</Text>
                <Text style={[styles.summaryValue, styles.rateHighlight]}>
                  {selectedInvestment.rate}%
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Durée:</Text>
                <Text style={styles.summaryValue}>{selectedInvestment.term} mois</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Intérêt annuel:</Text>
                <CurrencyAmount 
                  amount={amount ? (parseFloat(amount) * selectedInvestment.rate / 100) : 0}
                  style={styles.summaryValue}
                />
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total à échéance:</Text>
                <CurrencyAmount 
                  amount={amount ? (
                    parseFloat(amount) * (1 + (selectedInvestment.rate * (selectedInvestment.term / 12)) / 100)
                  ) : 0}
                  style={[styles.summaryValue, styles.totalHighlight]}
                />
              </View>
            </View>
            
            <Button
              mode="contained"
              onPress={handleInvest}
              loading={loading}
              disabled={!amount || loading}
              style={styles.investButton}
            >
              Investir maintenant
            </Button>
          </Card.Content>
        </Card>
      )}
    </View>
  );

  // Rendu pour l'onglet de gestion des émissions
  const renderManageTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title>Mes émissions d'obligations</Title>
            <Button
              mode="contained"
              onPress={handleEmitBonds}
              style={styles.emitButton}
              icon="plus"
            >
              Émettre
            </Button>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total émis</Text>
              <CurrencyAmount
                amount={totalIssuanceAmount}
                style={styles.statValue}
              />
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Intérêts payés</Text>
              <CurrencyAmount
                amount={totalInterestPaid}
                style={styles.statValue}
              />
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Émissions actives</Text>
              <Text style={styles.statValue}>
                {issuances.filter(i => i.status === 'active').length}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {issuancesLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement des émissions...</Text>
        </View>
      ) : issuances.length === 0 ? (
        <Card style={styles.card}>
          <Card.Content style={styles.emptyContainer}>
            <MaterialIcons name="attach-money" size={48} color="#BDBDBD" />
            <Text style={styles.emptyText}>
              Vous n'avez pas encore émis d'obligations. Émettez des obligations pour lever des fonds.
            </Text>
            <Button
              mode="contained"
              onPress={handleEmitBonds}
              style={{ marginTop: 16 }}
            >
              Émettre vos premières obligations
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <FlatList
          data={issuances}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Card style={styles.issuanceCard}>
              <Card.Content>
                <View style={styles.issuanceHeader}>
                  <View>
                    <Text style={styles.issuanceName}>
                      {getInvestmentTypeLabel(item.type)}
                    </Text>
                    <Text style={styles.issuanceDate}>
                      Émis le {formatDate(item.issuance_date)}
                    </Text>
                  </View>
                  <Chip
                    style={
                      item.status === 'active'
                        ? styles.activeChip
                        : item.status === 'completed'
                        ? styles.completedChip
                        : styles.cancelledChip
                    }
                  >
                    {item.status === 'active'
                      ? 'En cours'
                      : item.status === 'completed'
                      ? 'Remboursé'
                      : 'Annulé'}
                  </Chip>
                </View>
                
                <Divider style={styles.issuanceDivider} />
                
                <View style={styles.issuanceDetails}>
                  <View style={styles.issuanceDetailRow}>
                    <Text style={styles.issuanceDetailLabel}>Montant émis:</Text>
                    <CurrencyAmount 
                      amount={item.amount}
                      style={styles.issuanceDetailValue}
                    />
                  </View>
                  <View style={styles.issuanceDetailRow}>
                    <Text style={styles.issuanceDetailLabel}>Taux d'intérêt:</Text>
                    <Text style={styles.issuanceDetailValue}>{item.interest_rate}%</Text>
                  </View>
                  <View style={styles.issuanceDetailRow}>
                    <Text style={styles.issuanceDetailLabel}>Durée:</Text>
                    <Text style={styles.issuanceDetailValue}>{item.term_months} mois</Text>
                  </View>
                  <View style={styles.issuanceDetailRow}>
                    <Text style={styles.issuanceDetailLabel}>Type:</Text>
                    <Text style={styles.issuanceDetailValue}>
                      {item.is_public ? 'Publique' : 'Privée'}
                    </Text>
                  </View>
                  <View style={styles.issuanceDetailRow}>
                    <Text style={styles.issuanceDetailLabel}>Intérêts payés:</Text>
                    <CurrencyAmount 
                      amount={item.total_interest_paid}
                      style={styles.issuanceDetailValue}
                    />
                  </View>
                </View>
                
                <View style={styles.issuanceActions}>
                  <Button 
                    mode="outlined" 
                    onPress={() => {
                      /* Implémenter action de paiement d'intérêts */
                    }}
                    style={styles.issuanceButton}
                  >
                    Payer les intérêts
                  </Button>
                  <Button 
                    mode="outlined" 
                    onPress={() => {
                      /* Implémenter action de visualisation détaillée */
                    }}
                    style={styles.issuanceButton}
                  >
                    Détails
                  </Button>
                </View>
              </Card.Content>
            </Card>
          )}
          refreshing={issuancesLoading}
          onRefresh={refreshIssuances}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Investissements" />
      </Appbar.Header>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'buy' && styles.activeTab]}
          onPress={() => setActiveTab('buy')}
        >
          <Text style={activeTab === 'buy' ? styles.activeTabText : styles.tabText}>
            Acheter des obligations
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'manage' && styles.activeTab]}
          onPress={() => setActiveTab('manage')}
        >
          <Text style={activeTab === 'manage' ? styles.activeTabText : styles.tabText}>
            Gérer mes émissions
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {activeTab === 'buy' ? renderBuyTab() : renderManageTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    color: '#757575',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  filterLabel: {
    marginRight: 10,
  },
  institutionsContainer: {
    paddingVertical: 10,
  },
  institutionCard: {
    width: 100,
    height: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedInstitution: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  institutionName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  institutionDesc: {
    fontSize: 10,
    textAlign: 'center',
    color: '#757575',
  },
  investmentOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 10,
  },
  selectedInvestment: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  investmentName: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  investmentRate: {
    fontWeight: 'bold',
    color: Colors.primary,
    fontSize: 16,
  },
  investmentDetails: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  investmentTerm: {
    fontSize: 12,
    color: '#757575',
    marginRight: 10,
  },
  investmentMinAmount: {
    fontSize: 12,
    color: '#757575',
  },
  investmentDescription: {
    fontSize: 12,
    color: '#212121',
  },
  noOptions: {
    fontStyle: 'italic',
    color: '#757575',
  },
  input: {
    marginVertical: 16,
  },
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    color: '#616161',
  },
  summaryValue: {
    fontWeight: '600',
  },
  rateHighlight: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  totalHighlight: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  investButton: {
    marginTop: 10,
  },
  emitButton: {
    height: 36,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#757575',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#757575',
  },
  issuanceCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  issuanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issuanceName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  issuanceDate: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  activeChip: {
    backgroundColor: '#E3F2FD',
  },
  completedChip: {
    backgroundColor: '#E8F5E9',
  },
  cancelledChip: {
    backgroundColor: '#FFEBEE',
  },
  issuanceDivider: {
    marginVertical: 12,
  },
  issuanceDetails: {
    marginBottom: 12,
  },
  issuanceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  issuanceDetailLabel: {
    color: '#616161',
  },
  issuanceDetailValue: {
    fontWeight: '500',
  },
  issuanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  issuanceButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default FinanceInvestmentScreen;