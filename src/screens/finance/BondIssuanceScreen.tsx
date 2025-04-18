import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Appbar,
  Switch,
  ProgressBar,
  Chip,
  useTheme
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import FinanceAccountingService from '../../services/FinanceAccountingService';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import CurrencyAmount from '../../components/common/CurrencyAmount';
import { useCurrency } from '../../hooks/useCurrency';

const BondIssuanceScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { companyInfo } = useCompanyInfo();
  const { currencyInfo } = useCurrency();

  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [interestRate, setInterestRate] = useState('');
  const [bondType, setBondType] = useState('shortTermBonds');
  const [loading, setLoading] = useState(false);
  const [riskLevel, setRiskLevel] = useState(0.2);

  // Types d'obligations que l'entreprise peut émettre
  const bondTypes = [
    { id: 'shortTermBonds', label: 'Obligations court terme', riskLevel: 0.2, baseRate: 3.8 },
    { id: 'privateBonds', label: 'Obligations privées', riskLevel: 0.4, baseRate: 4.5 },
    { id: 'corporateBonds', label: 'Obligations d\'entreprise', riskLevel: 0.3, baseRate: 4.2 },
    { id: 'convertibleBonds', label: 'Obligations convertibles', riskLevel: 0.5, baseRate: 5.0 },
  ];

  // Recalculer le taux d'intérêt lorsque les données changent
  const calculateInterestRate = (bondTypeId: string, amountValue: string, termValue: string) => {
    const selectedType = bondTypes.find(type => type.id === bondTypeId);
    if (!selectedType) return '4.0';

    let rate = selectedType.baseRate;
    
    // Ajuster le taux en fonction du montant
    const amountNum = parseFloat(amountValue);
    if (!isNaN(amountNum)) {
      if (amountNum > 10000000) rate -= 0.3; // Réduction pour gros volumes
      else if (amountNum < 1000000) rate += 0.3; // Prime pour petits volumes
    }
    
    // Ajuster le taux en fonction de la durée
    const termNum = parseFloat(termValue);
    if (!isNaN(termNum)) {
      if (termNum > 60) rate += 0.8; // Prime pour long terme
      else if (termNum > 36) rate += 0.4; // Prime pour moyen-long terme
      else if (termNum <= 12) rate -= 0.2; // Réduction pour court terme
    }
    
    // Ajuster en fonction du type d'émission (public/privé)
    if (isPublic) {
      rate -= 0.2; // Réduction car plus sécurisé/régulé
    }
    
    return rate.toFixed(1);
  };

  // Fonction pour obtenir les taux alternatifs de financement
  const getAlternativeRate = (type: string): string => {
    switch (type) {
      case "banking":
        return "5.2";
      case "equity":
        return "7.5";
      case "leasing":
        return "6.8";
      default:
        return "5.0";
    }
  };

  // Mettre à jour les valeurs calculées lorsque les entrées changent
  React.useEffect(() => {
    const calculatedRate = calculateInterestRate(bondType, amount, term);
    setInterestRate(calculatedRate);
    
    // Définir le niveau de risque
    const selectedType = bondTypes.find(type => type.id === bondType);
    if (selectedType) {
      setRiskLevel(selectedType.riskLevel);
    }
  }, [bondType, amount, term, isPublic]);

  const handleSubmit = async () => {
    if (!amount || !term || !interestRate) {
      Alert.alert("Informations incomplètes", "Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);
    try {
      const amountValue = parseFloat(amount);
      const termValue = parseInt(term);
      const interestRateValue = parseFloat(interestRate);

      const issuanceId = await FinanceAccountingService.recordBondIssuance({
        bondType: bondType,
        amount: amountValue,
        termMonths: termValue,
        interestRate: interestRateValue,
        isPublic: isPublic,
        description: `Émission obligataire - ${bondTypes.find(t => t.id === bondType)?.label || bondType}`
      });

      setLoading(false);
      Alert.alert(
        "Émission réussie", 
        `Les obligations ont été émises avec succès. Les écritures comptables correspondantes ont été créées.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("Erreur lors de l'émission d'obligations:", error);
      setLoading(false);
      Alert.alert("Erreur", "Une erreur est survenue lors de l'émission des obligations.");
    }
  };

  const getRiskLevelColor = () => {
    if (riskLevel < 0.2) return '#4CAF50'; // Très faible
    if (riskLevel < 0.3) return '#8BC34A'; // Faible
    if (riskLevel < 0.4) return '#FFC107'; // Modéré
    if (riskLevel < 0.5) return '#FF9800'; // Élevé
    return '#F44336'; // Très élevé
  };

  const getRiskLevelText = () => {
    if (riskLevel < 0.2) return 'Très faible';
    if (riskLevel < 0.3) return 'Faible';
    if (riskLevel < 0.4) return 'Modéré';
    if (riskLevel < 0.5) return 'Élevé';
    return 'Très élevé';
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Émettre des obligations" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Informations sur l'émetteur</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Entreprise:</Text>
              <Text style={styles.infoValue}>{companyInfo?.name || 'Votre entreprise'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>SIREN:</Text>
              <Text style={styles.infoValue}>{companyInfo?.registrationNumber || '123456789'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cote de crédit:</Text>
              <View style={styles.creditScoreContainer}>
                <Text style={[styles.creditScore, { color: '#4CAF50' }]}>82/100</Text>
                <MaterialIcons name="verified" size={16} color="#4CAF50" style={styles.verifiedIcon} />
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Détails de l'émission</Text>
            
            <Text style={styles.sectionSubtitle}>Type d'obligation</Text>
            <View style={styles.chipsContainer}>
              {bondTypes.map((type) => (
                <Chip
                  key={type.id}
                  selected={bondType === type.id}
                  onPress={() => setBondType(type.id)}
                  style={[
                    styles.chip,
                    bondType === type.id && { backgroundColor: Colors.primary + '20' }
                  ]}
                  textStyle={bondType === type.id ? { color: Colors.primary } : {}}
                >
                  {type.label}
                </Chip>
              ))}
            </View>
            
            <TextInput
              label={`Montant de l'émission (${currencyInfo.symbol})`}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon={currencyInfo.code === 'USD' ? "currency-usd" : "cash"} />}
            />
            
            <TextInput
              label="Durée (mois)"
              value={term}
              onChangeText={setTerm}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="calendar-month" />}
            />
            
            <View style={styles.switchContainer}>
              <Text>Émission publique</Text>
              <Switch 
                value={isPublic} 
                onValueChange={() => setIsPublic(!isPublic)} 
                color={Colors.primary}
              />
            </View>
            
            <View style={styles.infoBox}>
              <MaterialIcons name="info-outline" size={20} color="#757575" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                {isPublic ? 
                  "Une émission publique nécessite l'approbation des autorités réglementaires et permet à tout investisseur d'acheter vos obligations." :
                  "Une émission privée est réservée à un groupe limité d'investisseurs qualifiés et nécessite moins de formalités administratives."}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Profil de l'émission</Text>
            
            <View style={styles.rateContainer}>
              <Text style={styles.rateLabel}>Taux d'intérêt proposé:</Text>
              <Text style={styles.rateValue}>{interestRate}%</Text>
            </View>
            
            <Text style={styles.riskTitle}>Niveau de risque pour les investisseurs:</Text>
            <View style={styles.riskContainer}>
              <ProgressBar
                progress={riskLevel}
                color={getRiskLevelColor()}
                style={styles.progressBar}
              />
              <View style={styles.riskLabelsContainer}>
                <Text style={styles.riskLevel}>
                  {getRiskLevelText()} <Text style={{ color: getRiskLevelColor() }}>•</Text>
                </Text>
              </View>
            </View>
            
            <View style={styles.comparisonContainer}>
              <Text style={styles.comparisonTitle}>Comparaison des taux:</Text>
              <View style={styles.comparisonRow}>
                <Text>Obligations d'État:</Text>
                <Text>2.5%</Text>
              </View>
              <View style={styles.comparisonRow}>
                <Text>Moyenne du secteur:</Text>
                <Text>4.1%</Text>
              </View>
              <View style={styles.comparisonRow}>
                <Text>Votre émission:</Text>
                <Text style={{ fontWeight: 'bold', color: Colors.primary }}>{interestRate}%</Text>
              </View>
              <View style={styles.comparisonRow}>
                <Text>Coût de financement bancaire</Text>
                <Text>{getAlternativeRate("banking")}%</Text>
              </View>
              <View style={styles.comparisonRow}>
                <Text>Coût en intérêts sur 1 an</Text>
                <CurrencyAmount 
                  amount={(amount && interestRate) ? (parseInt(amount) * parseFloat(interestRate) / 100) : 0}
                  style={{}}
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Impact comptable</Text>
            
            <View style={styles.accountingRow}>
              <Text style={styles.accountLabel}>Trésorerie (Débit):</Text>
              <CurrencyAmount 
                amount={amount ? parseInt(amount) : 0}
                style={styles.accountValue}
              />
            </View>
            
            <View style={styles.accountingRow}>
              <Text style={styles.accountLabel}>Emprunts obligataires (Crédit):</Text>
              <CurrencyAmount 
                amount={amount ? parseInt(amount) : 0}
                style={styles.accountValue}
              />
            </View>
            
            <View style={styles.warningBox}>
              <MaterialIcons name="warning" size={20} color="#FF9800" style={styles.warningIcon} />
              <Text style={styles.warningText}>
                Cette émission créera des obligations de paiement récurrentes pour le versement des intérêts.
              </Text>
            </View>
          </Card.Content>
        </Card>
        
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          loading={loading}
          disabled={!amount || !term || loading}
        >
          Émettre les obligations
        </Button>
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
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  creditScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditScore: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    margin: 4,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E1F5FE',
    padding: 10,
    borderRadius: 4,
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#01579B',
  },
  rateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rateLabel: {
    fontSize: 16,
    color: '#212121',
  },
  rateValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  riskTitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  riskContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginBottom: 6,
  },
  riskLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  riskLevel: {
    fontSize: 14,
  },
  comparisonContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 4,
  },
  comparisonTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  accountingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accountLabel: {
    fontSize: 14,
    color: '#424242',
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 4,
    marginTop: 16,
  },
  warningIcon: {
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#E65100',
  },
  submitButton: {
    marginVertical: 24,
    paddingVertical: 6,
  },
});

export default BondIssuanceScreen;