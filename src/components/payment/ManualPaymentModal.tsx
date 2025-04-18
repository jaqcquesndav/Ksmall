import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Modal, Text, Button, Portal, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@react-navigation/native';
import useCurrency from '../../hooks/useCurrency';

export interface ManualPaymentDetails {
  amount: number;
  reference?: string;
  description?: string;
  smsVerificationCode: string;
  proofDocument?: any; // DocumentPicker résultat
}

interface ManualPaymentModalProps {
  visible: boolean;
  onDismiss: () => void;
  onPaymentComplete: (details: ManualPaymentDetails) => void;
  title?: string;
  amount?: number;
  description?: string;
}

const ManualPaymentModal: React.FC<ManualPaymentModalProps> = ({
  visible,
  onDismiss,
  onPaymentComplete,
  title = 'Paiement Manuel',
  amount = 0,
  description,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { formatAmount, currencyInfo } = useCurrency();

  const [step, setStep] = useState(1);
  const [proofDocument, setProofDocument] = useState<any>(null);
  const [smsCode, setSmsCode] = useState('');
  const [reference, setReference] = useState('');

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.type !== "cancel") {
        setProofDocument(result);
        setStep(2);
        // Simuler l'envoi d'un SMS après téléchargement du justificatif
        Alert.alert(
          'Justificatif reçu',
          'Votre justificatif a été reçu. Un code SMS va vous être envoyé pour confirmer le paiement.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner le document');
    }
  };

  const handleVerifyCode = () => {
    if (smsCode.trim() === '') {
      Alert.alert('Erreur', 'Veuillez entrer le code reçu par SMS');
      return;
    }

    // Dans une application réelle, vous enverriez ce code à votre backend pour validation
    // Ici, pour la démo, on simule une validation simple (le code est "123456")
    if (smsCode === '123456') {
      onPaymentComplete({
        amount,
        reference,
        description,
        smsVerificationCode: smsCode,
        proofDocument
      });
      
      // Réinitialiser l'état
      setStep(1);
      setSmsCode('');
      setProofDocument(null);
      setReference('');
    } else {
      Alert.alert('Code incorrect', 'Le code que vous avez entré est incorrect. Veuillez réessayer.');
    }
  };

  const reset = () => {
    setStep(1);
    setSmsCode('');
    setProofDocument(null);
    setReference('');
    onDismiss();
  };

  const renderStep1 = () => (
    <View>
      <Text style={styles.modalText}>
        Pour effectuer un paiement manuel, veuillez télécharger un justificatif de paiement (reçu, capture d'écran, etc).
      </Text>
      
      {amount > 0 && (
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Montant à payer:</Text>
          <Text style={[styles.amountValue, { color: theme.colors.primary }]}>
            {formatAmount(amount)} {currencyInfo?.symbol}
          </Text>
        </View>
      )}
      
      <TextInput
        label={t('reference_number')}
        value={reference}
        onChangeText={setReference}
        style={styles.input}
        placeholder="Numéro de référence du paiement (optionnel)"
      />
      
      <View style={styles.proofContainer}>
        {proofDocument ? (
          <View style={styles.documentInfo}>
            <MaterialCommunityIcons name="file-document-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.documentName} numberOfLines={1}>{proofDocument.name}</Text>
          </View>
        ) : null}
        <Button
          mode="contained"
          onPress={handlePickDocument}
          style={styles.uploadButton}
        >
          {proofDocument ? t('change_document') : t('upload_document')}
        </Button>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.modalText}>
        Veuillez entrer le code de confirmation qui vous a été envoyé par SMS pour valider votre paiement.
      </Text>
      <TextInput
        label={t('sms_code')}
        value={smsCode}
        onChangeText={setSmsCode}
        keyboardType="number-pad"
        style={styles.input}
        placeholder="Code à 6 chiffres"
      />
      <Button
        mode="contained"
        onPress={handleVerifyCode}
        style={styles.verifyButton}
        disabled={smsCode.length < 6}
      >
        {t('verify_code')}
      </Button>
    </View>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={reset}
        contentContainerStyle={styles.modalContainer}
      >
        <Text style={styles.modalTitle}>{title}</Text>
        
        {step === 1 ? renderStep1() : renderStep2()}
        
        <Button mode="text" onPress={reset} style={styles.cancelButton}>
          {t('cancel')}
        </Button>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalText: {
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  proofContainer: {
    marginTop: 20,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  documentName: {
    marginLeft: 10,
    flex: 1,
  },
  uploadButton: {
    marginTop: 10,
  },
  verifyButton: {
    marginTop: 20,
  },
  cancelButton: {
    marginTop: 20,
  },
  input: {
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
});

export default ManualPaymentModal;