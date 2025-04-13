import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';
import * as DocumentPicker from 'expo-document-picker';

interface JournalLine {
  id: string;
  accountNumber: string;
  debitAmount: string;
  creditAmount: string;
  description: string;
}

interface JournalEntryFormProps {
  onSubmit: (data: any) => void;
}

const JournalEntryForm: React.FC<JournalEntryFormProps> = ({ onSubmit }) => {
  const { theme } = useContext(ThemeContext);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<Array<{ name: string; uri: string }>>([]);
  const [lines, setLines] = useState<JournalLine[]>([
    {
      id: '1',
      accountNumber: '',
      debitAmount: '',
      creditAmount: '',
      description: '',
    },
    {
      id: '2',
      accountNumber: '',
      debitAmount: '',
      creditAmount: '',
      description: '',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const addLine = () => {
    const newLine: JournalLine = {
      id: (lines.length + 1).toString(),
      accountNumber: '',
      debitAmount: '',
      creditAmount: '',
      description: '',
    };
    setLines([...lines, newLine]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 2) {
      Alert.alert('Attention', 'Une écriture comptable doit avoir au moins 2 lignes.');
      return;
    }
    setLines(lines.filter((line) => line.id !== id));
  };

  const updateLine = (id: string, field: keyof JournalLine, value: string) => {
    setLines(
      lines.map((line) => (line.id === id ? { ...line, [field]: value } : line))
    );
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAttachments([...attachments, { name: asset.name, uri: asset.uri }]);
      }
    } catch (error) {
      console.error('Error picking document', error);
    }
  };

  const removeAttachment = (uri: string) => {
    setAttachments(attachments.filter((att) => att.uri !== uri));
  };

  const calculateTotals = () => {
    const totalDebit = lines.reduce((sum, line) => sum + (parseFloat(line.debitAmount) || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (parseFloat(line.creditAmount) || 0), 0);
    
    return { totalDebit, totalCredit };
  };

  const { totalDebit, totalCredit } = calculateTotals();
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const validateForm = () => {
    // Check if required fields are filled
    if (!date || !reference || !description) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs requis.');
      return false;
    }

    // Check if all lines have account numbers and at least one amount
    for (const line of lines) {
      if (!line.accountNumber) {
        Alert.alert('Erreur', 'Chaque ligne doit avoir un numéro de compte.');
        return false;
      }
      
      if (!line.debitAmount && !line.creditAmount) {
        Alert.alert('Erreur', 'Chaque ligne doit avoir un montant débit ou crédit.');
        return false;
      }
    }

    // Check if the entry is balanced
    if (!isBalanced) {
      Alert.alert('Erreur', "L'écriture n'est pas équilibrée. Les totaux débit et crédit doivent être égaux.");
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    // Prepare data for submission
    const journalData = {
      date,
      reference,
      description,
      attachments,
      lines,
      totalDebit,
      totalCredit,
    };
    
    // Simulate network request
    setTimeout(() => {
      onSubmit(journalData);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: theme.colors.text }]}>Entrée Journal</Text>
      </View>
      
      <ScrollView style={styles.formContainer}>
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Date*</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme.colors.text + '80'}
          />
        </View>
        
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Référence*</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={reference}
            onChangeText={setReference}
            placeholder="Numéro de facture, etc."
            placeholderTextColor={theme.colors.text + '80'}
          />
        </View>
        
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Description*</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Description de l'écriture"
            placeholderTextColor={theme.colors.text + '80'}
          />
        </View>
        
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2, color: theme.colors.text }]}>Compte</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2, color: theme.colors.text }]}>Débit</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2, color: theme.colors.text }]}>Crédit</Text>
          <Text style={[styles.tableHeaderCell, { flex: 3, color: theme.colors.text }]}>Libellé</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, color: theme.colors.text }]}></Text>
        </View>
        
        {lines.map((line) => (
          <View key={line.id} style={styles.tableLine}>
            <TextInput
              style={[
                styles.tableCell,
                { flex: 2, color: theme.colors.text, borderColor: theme.colors.border }
              ]}
              value={line.accountNumber}
              onChangeText={(value) => updateLine(line.id, 'accountNumber', value)}
              placeholder="N° compte"
              placeholderTextColor={theme.colors.text + '80'}
              keyboardType="numeric"
            />
            <TextInput
              style={[
                styles.tableCell,
                { flex: 2, color: theme.colors.text, borderColor: theme.colors.border }
              ]}
              value={line.debitAmount}
              onChangeText={(value) => updateLine(line.id, 'debitAmount', value)}
              placeholder="0.00"
              placeholderTextColor={theme.colors.text + '80'}
              keyboardType="numeric"
            />
            <TextInput
              style={[
                styles.tableCell,
                { flex: 2, color: theme.colors.text, borderColor: theme.colors.border }
              ]}
              value={line.creditAmount}
              onChangeText={(value) => updateLine(line.id, 'creditAmount', value)}
              placeholder="0.00"
              placeholderTextColor={theme.colors.text + '80'}
              keyboardType="numeric"
            />
            <TextInput
              style={[
                styles.tableCell,
                { flex: 3, color: theme.colors.text, borderColor: theme.colors.border }
              ]}
              value={line.description}
              onChangeText={(value) => updateLine(line.id, 'description', value)}
              placeholder="Libellé"
              placeholderTextColor={theme.colors.text + '80'}
            />
            <TouchableOpacity
              style={[styles.tableCell, { flex: 1, borderWidth: 0 }]}
              onPress={() => removeLine(line.id)}
            >
              <Ionicons name="close-circle" size={18} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        ))}
        
        <TouchableOpacity
          style={[styles.addLineButton, { borderColor: theme.colors.primary }]}
          onPress={addLine}
        >
          <Ionicons name="add" size={18} color={theme.colors.primary} />
          <Text style={{ color: theme.colors.primary, marginLeft: 5 }}>Ajouter ligne</Text>
        </TouchableOpacity>
        
        <View style={styles.totalsContainer}>
          <View style={styles.totalItem}>
            <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total Débit</Text>
            <Text style={[styles.totalValue, { color: theme.colors.text }]}>
              {totalDebit.toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total Crédit</Text>
            <Text style={[styles.totalValue, { color: theme.colors.text }]}>
              {totalCredit.toFixed(2)}
            </Text>
          </View>
        </View>
        
        <View style={[styles.balanceContainer, { backgroundColor: isBalanced ? theme.colors.success + '20' : theme.colors.error + '20' }]}>
          <Text style={[styles.balanceText, { color: isBalanced ? theme.colors.success : theme.colors.error }]}>
            {isBalanced ? 'Écriture équilibrée' : 'Écriture non équilibrée'}
          </Text>
          {!isBalanced && (
            <Text style={{ color: theme.colors.error }}>
              Différence: {Math.abs(totalDebit - totalCredit).toFixed(2)}
            </Text>
          )}
        </View>
        
        <View style={styles.attachmentsContainer}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Pièces jointes</Text>
          
          {attachments.map((att, index) => (
            <View key={index} style={[styles.attachmentItem, { backgroundColor: theme.colors.background }]}>
              <Ionicons name="document-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.attachmentName, { color: theme.colors.text }]} numberOfLines={1}>
                {att.name}
              </Text>
              <TouchableOpacity onPress={() => removeAttachment(att.uri)}>
                <Ionicons name="close-circle" size={18} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity
            style={[styles.addAttachmentButton, { borderColor: theme.colors.border }]}
            onPress={pickDocument}
          >
            <Ionicons name="attach" size={18} color={theme.colors.text} />
            <Text style={[styles.addAttachmentText, { color: theme.colors.text }]}>
              Ajouter pièce jointe
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: theme.colors.border }]}
          onPress={() => onSubmit(null)}
        >
          <Text style={{ color: theme.colors.text }}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: isBalanced ? theme.colors.primary : theme.colors.border,
              opacity: isBalanced ? 1 : 0.5,
            },
          ]}
          onPress={handleSubmit}
          disabled={!isBalanced || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Valider</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    marginVertical: 15,
    overflow: 'hidden',
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    padding: 15,
  },
  fieldGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    marginTop: 15,
    marginBottom: 5,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableHeaderCell: {
    fontWeight: '600',
    fontSize: 14,
    paddingHorizontal: 4,
  },
  tableLine: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tableCell: {
    height: 40,
    borderWidth: 1,
    borderRadius: 6,
    marginHorizontal: 2,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  addLineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    marginTop: 10,
  },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalItem: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  balanceContainer: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 6,
    marginVertical: 15,
  },
  balanceText: {
    fontWeight: '600',
  },
  attachmentsContainer: {
    marginTop: 20,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  attachmentName: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
  },
  addAttachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
    marginTop: 5,
    borderStyle: 'dashed',
  },
  addAttachmentText: {
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default JournalEntryForm;
