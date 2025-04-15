import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../../components/common/AppHeader';
import { RootStackParamList } from '../../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

type AccountingScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const AccountingDashboardScreen: React.FC = () => {
  const navigation = useNavigation<AccountingScreenNavigationProp>();
  
  return (
    <View style={styles.container}>
      <AppHeader 
        title="Comptabilité" 
        rightAction={
          <Ionicons 
            name="settings-outline" 
            size={24} 
            color="#333" 
            onPress={() => navigation.navigate('AccountingSettings')}
          />
        }
      />
      <View style={styles.content}>
        <Text style={styles.title}>Module Comptabilité</Text>
        <View style={styles.buttonsContainer}>
          <Button 
            mode="contained"
            style={styles.button}
            onPress={() => navigation.navigate('JournalEntry')}
          >
            Journal Comptable
          </Button>
          <Button 
            mode="contained" 
            style={styles.button}
            onPress={() => navigation.navigate('Ledger')}
          >
            Grand Livre
          </Button>
          <Button 
            mode="contained" 
            style={styles.button}
            onPress={() => navigation.navigate('FinancialStatements')}
          >
            États Financiers
          </Button>
          <Button 
            mode="outlined" 
            style={styles.button}
            icon="cog"
            onPress={() => navigation.navigate('AccountingSettings')}
          >
            Paramètres Comptables
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonsContainer: {
    alignItems: 'center',
  },
  button: {
    marginVertical: 10,
    width: '80%',
  },
});

export default AccountingDashboardScreen;
