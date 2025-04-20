import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList, TouchableOpacity } from 'react-native';
import {
  Text,
  TextInput,
  Card,
  Button,
  Appbar,
  Divider,
  Chip,
  ProgressBar,
  RadioButton,
  ActivityIndicator,
  FAB,
  List,
  IconButton,
  Badge,
  Modal,
  Portal,
  Surface,
  Avatar
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import CurrencyAmount from '../../components/common/CurrencyAmount';
import { useCurrency } from '../../hooks/useCurrency';
import DatabaseService from '../../services/DatabaseService';
import MockDataService from '../../services/MockDataService';
import * as Clipboard from 'expo-clipboard';

const typeLabels = {
  loan: 'Prêt bancaire',
  credit: 'Ligne de crédit',
  equipment: 'Financement d\'équipement',
  working_capital: 'Fonds de roulement',
  growth: 'Financement de croissance',
};

// Banques en RDC
const financialInstitutions = [
  { id: 'tmb', name: 'TMB' },
  { id: 'equity', name: 'EQUITYBCDC' },
  { id: 'ecobank', name: 'ECOBANK' },
  { id: 'rawbank', name: 'RAWBANK' },
  { id: 'fbn', name: 'FBN BANK' },
];

// Statut des demandes en français
const requestStatusLabels = {
  'pending': 'En attente',
  'approved': 'Approuvée',
  'rejected': 'Rejetée',
  'processing': 'En traitement',
  'completed': 'Complétée',
  'draft': 'Brouillon',
  'code_generated': 'Code généré',
  'waiting_for_equipment': 'En attente d\'équipement'
};

// Interface pour les demandes de financement
interface FinanceRequest {
  id: number;
  type: string;
  amount: string;
  term: string;
  purpose: string;
  equipment_code?: string;
  bank_id: string;
  interest_rate: number;
  status: string;
  created_at: string;
  order_code?: string;
}

const FinanceRequestScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { currencyInfo } = useCurrency();
  
  // Récupérer le type de financement depuis les paramètres de la route
  const { type } = route.params as { type: string };
  
  // États pour le formulaire
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('');
  const [purpose, setPurpose] = useState('');
  const [equipmentCode, setEquipmentCode] = useState(''); 
  const [selectedBank, setSelectedBank] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [creditScore, setCreditScore] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [orderCode, setOrderCode] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [savedRequests, setSavedRequests] = useState<FinanceRequest[]>([]);
  const [showRequestsView, setShowRequestsView] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<FinanceRequest | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  
  // Chargement de la cote de crédit depuis le service centralisé
  useEffect(() => {
    const fetchCreditScore = async () => {
      try {
        // Utiliser le service MockDataService comme source unique de vérité
        const score = await MockDataService.getCreditScore();
        setCreditScore(score);
        console.log('Score de crédit récupéré depuis MockDataService:', score);
      } catch (error) {
        console.error('Erreur lors de la récupération du credit score:', error);
        setCreditScore(70); // Valeur par défaut cohérente avec le Dashboard
      } finally {
        setInitialLoading(false);
      }
    };
    
    // Initialiser les données mockées pour garantir la cohérence des données
    MockDataService.initializeMockData()
      .then(() => fetchCreditScore())
      .then(() => loadSavedRequests());
  }, []);
  
  // Chargement des demandes sauvegardées
  const loadSavedRequests = async () => {
    try {
      const db = await DatabaseService.getDatabase();
      const [result] = await DatabaseService.executeQuery(
        db,
        'SELECT * FROM finance_requests WHERE type = ? ORDER BY created_at DESC',
        [type]
      );
      
      const requests: FinanceRequest[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        requests.push(result.rows.item(i));
      }
      
      setSavedRequests(requests);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
    }
  };
  
  // Calculer le taux d'intérêt estimé en fonction du score de crédit et d'autres facteurs
  useEffect(() => {
    if (initialLoading) return;
    
    let baseRate = 0;
    
    // Déterminer le taux de base en fonction du score de crédit (sur 100)
    if (creditScore >= 75) baseRate = 3.5;
    else if (creditScore >= 70) baseRate = 4.0;
    else if (creditScore >= 65) baseRate = 4.5;
    else if (creditScore >= 60) baseRate = 5.5;
    else baseRate = 7.0;
    
    // Ajuster en fonction du type de financement
    if (type === 'loan') baseRate += 0;
    else if (type === 'credit') baseRate += 0.5;
    else if (type === 'equipment') baseRate -= 0.3;
    else if (type === 'working_capital') baseRate += 1.0;
    else if (type === 'growth') baseRate += 0.7;
    
    // Ajuster en fonction de la banque sélectionnée
    if (selectedBank) {
      const bankAdjustment = {
        tmb: 0.1,
        equity: -0.1,
        ecobank: 0.2,
        rawbank: -0.2,
        fbn: 0.1,
      }[selectedBank] || 0;
      
      baseRate += bankAdjustment;
    }
    
    setInterestRate(baseRate.toFixed(2) + '%');
  }, [creditScore, type, selectedBank, initialLoading]);
  
  // Génération d'un code de commande (simulé)
  const generateOrderCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `KS-${randomChars}-${timestamp}`;
  };

  const getCreditScoreColor = () => {
    if (creditScore >= 75) return '#4CAF50'; // Excellent - vert
    if (creditScore >= 65) return '#FFC107'; // Bon - jaune
    return '#F44336'; // À améliorer - rouge
  };

  const getCreditScoreText = () => {
    if (creditScore >= 75) return 'Excellent';
    if (creditScore >= 70) return 'Très bien';
    if (creditScore >= 65) return 'Bon';
    if (creditScore >= 60) return 'Correct';
    if (creditScore >= 55) return 'Moyen';
    return 'À améliorer';
  };

  const getCreditScoreProgress = () => {
    // Utiliser une échelle sur 100 au lieu de 850
    return creditScore / 100;
  };

  // Vérification du code d'équipement
  const verifyEquipmentCode = async () => {
    try {
      const db = await DatabaseService.getDatabase();
      const [result] = await DatabaseService.executeQuery(
        db,
        'SELECT * FROM equipment WHERE code = ?',
        [equipmentCode]
      );
      
      if (result.rows.length > 0) {
        return true;
      } else {
        Alert.alert('Code invalide', 'Le code d\'équipement n\'est pas valide.');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du code d\'équipement:', error);
      Alert.alert('Erreur', 'Impossible de vérifier le code d\'équipement.');
      return false;
    }
  };

  // Génération d'un code et création d'une demande en brouillon
  const handleGenerateCode = async () => {
    setLoading(true);
    
    try {
      // Valider les champs obligatoires
      if (!amount || !term || !selectedBank || !purpose) {
        Alert.alert('Information manquante', 'Veuillez remplir tous les champs requis');
        setLoading(false);
        return;
      }
      
      const newOrderCode = generateOrderCode();
      setOrderCode(newOrderCode);
      
      // Date actuelle pour created_at et updated_at
      const currentDate = new Date().toISOString();
      
      // Enregistrement de la demande en tant que brouillon avec le code généré
      const db = await DatabaseService.getDatabase();
      
      // Ajout des champs user_id et updated_at qui sont obligatoires (NOT NULL)
      const [insertResult, insertError] = await DatabaseService.executeQuery(
        db,
        'INSERT INTO finance_requests (type, amount, term, purpose, bank_id, interest_rate, status, created_at, updated_at, order_code, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          type,
          amount,
          term,
          purpose,
          selectedBank,
          parseFloat(interestRate.replace('%', '')),
          'code_generated',
          currentDate,
          currentDate, // updated_at avec la même date que created_at
          newOrderCode,
          1 // Utiliser l'ID de l'utilisateur de démonstration
        ]
      );
      
      if (insertError) {
        throw insertError;
      }
      
      // Récupérer l'ID de la dernière insertion
      const [lastIdResult, lastIdError] = await DatabaseService.executeQuery(
        db,
        'SELECT last_insert_rowid() as id',
        []
      );
      
      if (lastIdError || !lastIdResult) {
        throw lastIdError || new Error('Impossible de récupérer l\'ID de la demande');
      }
      
      const requestId = lastIdResult.rows.item(0).id;
      setShowCodeModal(true);
      
      // Recharger les demandes
      await loadSavedRequests();
      
    } catch (error) {
      console.error('Erreur lors de la génération du code:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la génération du code de commande.');
    } finally {
      setLoading(false);
    }
  };

  // Finalisation d'une commande existante avec équipement sélectionné
  const handleFinalizeLease = async () => {
    setLoading(true);
    
    try {
      if (!currentRequest) {
        Alert.alert('Erreur', 'Aucune demande sélectionnée');
        setLoading(false);
        return;
      }
      
      if (!equipmentCode) {
        Alert.alert('Code manquant', 'Veuillez saisir le code de l\'équipement');
        setLoading(false);
        return;
      }
      
      if (!await verifyEquipmentCode()) {
        setLoading(false);
        return;
      }
      
      const db = await DatabaseService.getDatabase();
      await DatabaseService.executeQuery(
        db,
        'UPDATE finance_requests SET equipment_code = ?, status = ? WHERE id = ?',
        [equipmentCode, 'processing', currentRequest.id]
      );
      
      Alert.alert(
        'Demande finalisée',
        'Votre demande de leasing a été finalisée avec succès. Elle est maintenant en cours de traitement.',
        [{ text: 'OK', onPress: () => {
          setCurrentRequest(null);
          loadSavedRequests();
        }}]
      );
      
    } catch (error) {
      console.error('Erreur lors de la finalisation de la demande:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la finalisation de votre demande.');
    } finally {
      setLoading(false);
    }
  };
  
  // Copier le code dans le presse-papier
  const copyOrderCodeToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(orderCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie du code:', error);
    }
  };
  
  // Sélectionner une demande existante
  const selectRequest = (request: FinanceRequest) => {
    setCurrentRequest(request);
    setAmount(request.amount);
    setTerm(request.term);
    setPurpose(request.purpose);
    setSelectedBank(request.bank_id);
    setEquipmentCode(request.equipment_code || '');
    setOrderCode(request.order_code || '');
    setShowRequestsView(false);
  };
  
  // Créer une nouvelle demande
  const createNewRequest = () => {
    setCurrentRequest(null);
    setAmount('');
    setTerm('');
    setPurpose('');
    setEquipmentCode('');
    setSelectedBank('');
    setOrderCode('');
    setShowRequestsView(false);
  };
  
  // Déterminer le statut du bouton selon l'état de la demande
  const getActionButtonProps = () => {
    if (!currentRequest) {
      return {
        label: 'Générer le code de commande',
        onPress: handleGenerateCode,
        disabled: !amount || !term || !selectedBank || !purpose,
        icon: 'barcode'
      };
    } else if (currentRequest.status === 'code_generated' || currentRequest.status === 'draft') {
      return {
        label: 'Finaliser la commande',
        onPress: handleFinalizeLease,
        disabled: !equipmentCode,
        icon: 'check-circle'
      };
    } else {
      return {
        label: 'Voir le statut',
        onPress: () => {},
        disabled: false,
        icon: 'information'
      };
    }
  };
  
  // Obtenir la couleur selon le statut
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'pending': return '#FFC107';
      case 'processing': return '#2196F3';
      case 'completed': return '#4CAF50';
      case 'draft': return '#757575';
      case 'code_generated': return '#9C27B0';
      case 'waiting_for_equipment': return '#FF9800';
      default: return '#757575';
    }
  };

  // Affichage du chargement initial
  if (initialLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement des données...</Text>
      </View>
    );
  }
  
  // Affichage de la liste des demandes sauvegardées
  if (showRequestsView) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => setShowRequestsView(false)} />
          <Appbar.Content title="Mes demandes de financement" />
        </Appbar.Header>
        
        {savedRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="receipt-long" size={64} color="#BDBDBD" />
            <Text style={styles.emptyText}>Aucune demande trouvée</Text>
            <Text style={styles.emptySubText}>
              Créez votre première demande de financement
            </Text>
            <Button 
              mode="contained" 
              onPress={createNewRequest}
              style={styles.emptyButton}
            >
              Nouvelle demande
            </Button>
          </View>
        ) : (
          <FlatList
            data={savedRequests}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <Card style={styles.requestCard} onPress={() => selectRequest(item)}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.requestTitle}>
                        {typeLabels[item.type]}
                      </Text>
                      <Text style={styles.requestDate}>
                        {new Date(item.created_at).toLocaleDateString('fr-FR', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </Text>
                    </View>
                    <Chip 
                      mode="flat"
                      style={{ backgroundColor: getStatusColor(item.status) + '20' }}
                      textStyle={{ color: getStatusColor(item.status) }}
                    >
                      {requestStatusLabels[item.status]}
                    </Chip>
                  </View>
                  
                  <Divider style={styles.miniDivider} />
                  
                  <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Montant:</Text>
                      <CurrencyAmount amount={parseInt(item.amount)} style={styles.detailValue} />
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Durée:</Text>
                      <Text style={styles.detailValue}>{item.term} mois</Text>
                    </View>
                    
                    {item.order_code && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Code:</Text>
                        <Text style={styles.codeValue}>{item.order_code}</Text>
                      </View>
                    )}
                  </View>
                </Card.Content>
              </Card>
            )}
          />
        )}
        
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={createNewRequest}
          label="Nouvelle demande"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content 
          title={currentRequest ? 
            `Modifier demande: ${currentRequest.id}` : 
            typeLabels[type] || 'Demande de financement'
          } 
        />
        <Appbar.Action 
          icon="format-list-bulleted" 
          onPress={() => setShowRequestsView(true)} 
        />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {currentRequest && (
          <Card style={styles.statusCard}>
            <Card.Content style={styles.statusContent}>
              <View>
                <Text style={styles.statusLabel}>Statut de la demande</Text>
                <Text style={[styles.statusValue, { color: getStatusColor(currentRequest.status) }]}>
                  {requestStatusLabels[currentRequest.status]}
                </Text>
              </View>
              {currentRequest.order_code && (
                <View style={styles.codeContainer}>
                  <Text style={styles.codeLabel}>Code:</Text>
                  <TouchableOpacity 
                    onPress={copyOrderCodeToClipboard}
                    style={styles.codeBox}
                  >
                    <Text style={styles.code}>{currentRequest.order_code}</Text>
                    <MaterialIcons name="content-copy" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </Card.Content>
          </Card>
        )}
      
        <Card style={styles.creditScoreCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Cote de crédit</Text>
            <View style={styles.scoreRow}>
              <Text style={[styles.creditScore, { color: getCreditScoreColor() }]}>
                {creditScore}
              </Text>
              <Text style={styles.creditScoreLabel}>
                {getCreditScoreText()}
              </Text>
            </View>
            <ProgressBar
              progress={getCreditScoreProgress()}
              color={getCreditScoreColor()}
              style={styles.progressBar}
            />
          </Card.Content>
        </Card>

        <Text style={styles.sectionTitle}>Détails de la demande</Text>
        
        <TextInput
          label={`Montant demandé (${currencyInfo.symbol})`}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={styles.input}
          mode="outlined"
          left={<TextInput.Icon icon={currencyInfo.icon || "cash"} />}
          disabled={currentRequest && currentRequest.status !== 'draft' && currentRequest.status !== 'code_generated'}
        />
        
        <TextInput
          label="Durée (mois)"
          value={term}
          onChangeText={setTerm}
          keyboardType="numeric"
          style={styles.input}
          mode="outlined"
          left={<TextInput.Icon icon="calendar-month" />}
          disabled={currentRequest && currentRequest.status !== 'draft' && currentRequest.status !== 'code_generated'}
        />

        {(type === 'equipment' || currentRequest?.type === 'equipment') && (
          <TextInput
            label="Code de l'équipement"
            value={equipmentCode}
            onChangeText={setEquipmentCode}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="barcode-scan" />}
            placeholder="Entrez le code de l'équipement choisi"
            disabled={currentRequest && currentRequest.status !== 'code_generated' && currentRequest.status !== 'draft' && currentRequest.status !== 'waiting_for_equipment'}
          />
        )}
        
        <TextInput
          label="Objet du financement"
          value={purpose}
          onChangeText={setPurpose}
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={3}
          left={<TextInput.Icon icon="information-outline" />}
          disabled={currentRequest && currentRequest.status !== 'draft' && currentRequest.status !== 'code_generated'}
        />

        <Divider style={styles.divider} />

        <Text style={styles.sectionTitle}>Institution financière</Text>
        <Text style={styles.sectionSubtitle}>Sélectionnez votre partenaire financier</Text>
        
        <View style={styles.chipsContainer}>
          {financialInstitutions.map(bank => (
            <Chip
              key={bank.id}
              selected={selectedBank === bank.id}
              onPress={() => setSelectedBank(bank.id)}
              style={[
                styles.chip,
                selectedBank === bank.id && { backgroundColor: Colors.primary + '20' }
              ]}
              textStyle={selectedBank === bank.id ? { color: Colors.primary } : {}}
              disabled={currentRequest && currentRequest.status !== 'draft' && currentRequest.status !== 'code_generated'}
            >
              {bank.name}
            </Chip>
          ))}
        </View>

        <Divider style={styles.divider} />

        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Type de financement</Text>
              <Text style={styles.summaryValue}>{typeLabels[type] || type}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taux d'intérêt estimé</Text>
              <Text style={styles.interestRate}>{interestRate}</Text>
            </View>
            {amount && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Montant demandé</Text>
                <CurrencyAmount
                  amount={parseInt(amount)}
                  style={styles.summaryValue}
                />
              </View>
            )}
            {term && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Durée</Text>
                <Text style={styles.summaryValue}>{term} mois</Text>
              </View>
            )}
            {(type === 'equipment' || currentRequest?.type === 'equipment') && equipmentCode && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Code équipement</Text>
                <Text style={styles.summaryValue}>{equipmentCode}</Text>
              </View>
            )}
          </Card.Content>
        </Card>
        
        <Button
          mode="contained"
          onPress={getActionButtonProps().onPress}
          style={styles.submitButton}
          loading={loading}
          disabled={getActionButtonProps().disabled}
          icon={getActionButtonProps().icon}
        >
          {getActionButtonProps().label}
        </Button>
        
        {currentRequest && (currentRequest.status === 'draft' || currentRequest.status === 'code_generated') && (
          <Button
            mode="outlined"
            onPress={createNewRequest}
            style={styles.cancelButton}
            icon="close"
          >
            Nouvelle demande
          </Button>
        )}
      </ScrollView>
      
      {/* Modal pour afficher le code généré */}
      <Portal>
        <Modal
          visible={showCodeModal}
          onDismiss={() => setShowCodeModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalContent}>
            <MaterialIcons name="check-circle" size={64} color={Colors.primary} style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Code généré avec succès</Text>
            <Text style={styles.modalSubtitle}>
              Utilisez ce code sur le site Kiota Store pour sélectionner votre équipement
            </Text>
            
            <View style={styles.codeBox}>
              <Text style={styles.modalCode}>{orderCode}</Text>
            </View>
            
            <Button 
              mode="contained" 
              onPress={copyOrderCodeToClipboard}
              style={styles.copyButton}
              icon={codeCopied ? "check" : "content-copy"}
            >
              {codeCopied ? "Code copié" : "Copier le code"}
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => setShowCodeModal(false)}
              style={styles.closeButton}
            >
              Fermer
            </Button>
          </Surface>
        </Modal>
      </Portal>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  creditScoreCard: {
    marginBottom: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  creditScore: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 12,
  },
  creditScoreLabel: {
    fontSize: 16,
    color: '#333',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 16,
    color: Colors.primary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    margin: 4,
  },
  radioContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
  },
  radioItem: {
    paddingVertical: 4,
    paddingLeft: 0,
  },
  summaryCard: {
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#757575',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  interestRate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  submitButton: {
    marginVertical: 16,
    paddingVertical: 6,
  },
  cancelButton: {
    marginBottom: 24,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  modalContainer: {
    padding: 16,
    marginHorizontal: 24,
  },
  modalContent: {
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  copyButton: {
    marginTop: 16,
    width: '100%',
  },
  closeButton: {
    marginTop: 8,
    width: '100%',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
  },
  listContainer: {
    padding: 16,
  },
  requestCard: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  requestDate: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  cardDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#757575',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  codeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  miniDivider: {
    marginVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
  },
  statusCard: {
    marginBottom: 16,
  },
  statusContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  codeContainer: {
    alignItems: 'flex-end',
  },
  codeLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 2,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  code: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginRight: 8,
  },
});

export default FinanceRequestScreen;