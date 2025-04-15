import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Text, Divider, RadioButton, Switch, List, useTheme } from 'react-native-paper';
import AppHeader from '../../components/common/AppHeader';
import { Colors } from '../../constants/Colors';

const ReportFormatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  
  const [paperSize, setPaperSize] = useState<string>('A4');
  const [orientation, setOrientation] = useState<string>('portrait');
  const [showGridLines, setShowGridLines] = useState<boolean>(true);
  const [showHeaders, setShowHeaders] = useState<boolean>(true);
  const [colorScheme, setColorScheme] = useState<string>('standard');
  const [fontStyle, setFontStyle] = useState<string>('default');
  const [includeCompanyLogo, setIncludeCompanyLogo] = useState<boolean>(true);
  const [showPageNumbers, setShowPageNumbers] = useState<boolean>(true);

  const saveSettings = () => {
    // À implémenter: sauvegarde des paramètres dans AsyncStorage ou autre service
    console.log('Saving report format settings...');
    console.log({
      paperSize,
      orientation,
      showGridLines,
      showHeaders,
      colorScheme,
      fontStyle,
      includeCompanyLogo,
      showPageNumbers
    });
    
    // Afficher notification de succès
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Format des rapports"
        onBack={() => navigation.goBack()}
        actions={[
          { icon: 'check', onPress: saveSettings }
        ]}
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Mise en page</Text>
            <Divider style={styles.divider} />
            
            <Text style={styles.label}>Format du papier</Text>
            <RadioButton.Group onValueChange={value => setPaperSize(value)} value={paperSize}>
              <View style={styles.radioOption}>
                <RadioButton value="A4" />
                <Text>A4</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="Letter" />
                <Text>Letter</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="Legal" />
                <Text>Legal</Text>
              </View>
            </RadioButton.Group>
            
            <Divider style={styles.divider} />
            
            <Text style={styles.label}>Orientation</Text>
            <RadioButton.Group onValueChange={value => setOrientation(value)} value={orientation}>
              <View style={styles.radioOption}>
                <RadioButton value="portrait" />
                <Text>Portrait</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="landscape" />
                <Text>Paysage</Text>
              </View>
            </RadioButton.Group>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Éléments visuels</Text>
            <Divider style={styles.divider} />
            
            <View style={styles.switchOption}>
              <Text>Afficher les lignes de grille</Text>
              <Switch 
                value={showGridLines}
                onValueChange={setShowGridLines}
                color={Colors.primary}
              />
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.switchOption}>
              <Text>Afficher les en-têtes</Text>
              <Switch 
                value={showHeaders}
                onValueChange={setShowHeaders}
                color={Colors.primary}
              />
            </View>
            
            <Divider style={styles.divider} />
            
            <Text style={styles.label}>Palette de couleurs</Text>
            <RadioButton.Group onValueChange={value => setColorScheme(value)} value={colorScheme}>
              <View style={styles.radioOption}>
                <RadioButton value="standard" />
                <Text>Standard</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="monochrome" />
                <Text>Monochrome</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="high-contrast" />
                <Text>Contraste élevé</Text>
              </View>
            </RadioButton.Group>
            
            <Divider style={styles.divider} />
            
            <Text style={styles.label}>Police de caractères</Text>
            <RadioButton.Group onValueChange={value => setFontStyle(value)} value={fontStyle}>
              <View style={styles.radioOption}>
                <RadioButton value="default" />
                <Text>Par défaut</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="serif" />
                <Text>Serif</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="sans-serif" />
                <Text>Sans Serif</Text>
              </View>
            </RadioButton.Group>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Options supplémentaires</Text>
            <Divider style={styles.divider} />
            
            <View style={styles.switchOption}>
              <Text>Inclure le logo de l'entreprise</Text>
              <Switch 
                value={includeCompanyLogo}
                onValueChange={setIncludeCompanyLogo}
                color={Colors.primary}
              />
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.switchOption}>
              <Text>Afficher les numéros de page</Text>
              <Switch 
                value={showPageNumbers}
                onValueChange={setShowPageNumbers}
                color={Colors.primary}
              />
            </View>
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
  }
});

export default ReportFormatScreen;