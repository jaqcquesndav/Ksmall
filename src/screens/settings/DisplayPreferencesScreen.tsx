import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Text, Divider, RadioButton, Switch, List, SegmentedButtons, useTheme } from 'react-native-paper';
import AppHeader from '../../components/common/AppHeader';
import { Colors } from '../../constants/Colors';

const DisplayPreferencesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  
  const [currencyPosition, setCurrencyPosition] = useState<string>('after');
  const [dateFormat, setDateFormat] = useState<string>('dd/MM/yyyy');
  const [decimals, setDecimals] = useState<string>('2');
  const [thousandSeparator, setThousandSeparator] = useState<string>(' ');
  const [decimalSeparator, setDecimalSeparator] = useState<string>(',');
  const [negativeNumberFormat, setNegativeNumberFormat] = useState<string>('parentheses');
  const [showCurrencySymbol, setShowCurrencySymbol] = useState<boolean>(true);
  
  const saveSettings = () => {
    // À implémenter: sauvegarde des paramètres dans AsyncStorage ou autre service
    console.log('Saving display preferences settings...');
    console.log({
      currencyPosition,
      dateFormat,
      decimals,
      thousandSeparator,
      decimalSeparator,
      negativeNumberFormat,
      showCurrencySymbol
    });
    
    // Afficher notification de succès
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Préférences d'affichage"
        onBack={() => navigation.goBack()}
        actions={[
          { icon: 'check', onPress: saveSettings }
        ]}
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Format des montants</Text>
            <Divider style={styles.divider} />
            
            <View style={styles.switchOption}>
              <Text>Afficher le symbole monétaire</Text>
              <Switch 
                value={showCurrencySymbol}
                onValueChange={setShowCurrencySymbol}
                color={Colors.primary}
              />
            </View>
            
            <Divider style={styles.divider} />
            
            <Text style={styles.label}>Position du symbole monétaire</Text>
            <RadioButton.Group onValueChange={value => setCurrencyPosition(value)} value={currencyPosition}>
              <View style={styles.radioOption}>
                <RadioButton value="before" />
                <Text>Avant le montant (ex: € 1000,00)</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="after" />
                <Text>Après le montant (ex: 1000,00 €)</Text>
              </View>
            </RadioButton.Group>
            
            <Divider style={styles.divider} />
            
            <Text style={styles.label}>Nombre de décimales</Text>
            <SegmentedButtons
              value={decimals}
              onValueChange={setDecimals}
              buttons={[
                { value: '0', label: '0' },
                { value: '1', label: '1' },
                { value: '2', label: '2' },
                { value: '3', label: '3' },
              ]}
              style={styles.segmentedButtons}
            />
            
            <Divider style={styles.divider} />
            
            <Text style={styles.label}>Séparateur de milliers</Text>
            <SegmentedButtons
              value={thousandSeparator}
              onValueChange={setThousandSeparator}
              buttons={[
                { value: ' ', label: 'Espace' },
                { value: '.', label: 'Point' },
                { value: ',', label: 'Virgule' },
                { value: '', label: 'Aucun' },
              ]}
              style={styles.segmentedButtons}
            />
            
            <Divider style={styles.divider} />
            
            <Text style={styles.label}>Séparateur décimal</Text>
            <SegmentedButtons
              value={decimalSeparator}
              onValueChange={setDecimalSeparator}
              buttons={[
                { value: ',', label: 'Virgule' },
                { value: '.', label: 'Point' },
              ]}
              style={styles.segmentedButtons}
            />
            
            <Divider style={styles.divider} />
            
            <Text style={styles.label}>Format des nombres négatifs</Text>
            <RadioButton.Group onValueChange={value => setNegativeNumberFormat(value)} value={negativeNumberFormat}>
              <View style={styles.radioOption}>
                <RadioButton value="minus" />
                <Text>Avec un signe moins (ex: -1000,00)</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="parentheses" />
                <Text>Entre parenthèses (ex: (1000,00))</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="red" />
                <Text>En rouge</Text>
              </View>
            </RadioButton.Group>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Format des dates</Text>
            <Divider style={styles.divider} />
            
            <RadioButton.Group onValueChange={value => setDateFormat(value)} value={dateFormat}>
              <View style={styles.radioOption}>
                <RadioButton value="dd/MM/yyyy" />
                <Text>JJ/MM/AAAA (31/12/2023)</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="MM/dd/yyyy" />
                <Text>MM/JJ/AAAA (12/31/2023)</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="yyyy-MM-dd" />
                <Text>AAAA-MM-JJ (2023-12-31)</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="dd-MMM-yyyy" />
                <Text>JJ-MMM-AAAA (31-déc-2023)</Text>
              </View>
            </RadioButton.Group>
          </Card.Content>
        </Card>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
  }
});

export default DisplayPreferencesScreen;