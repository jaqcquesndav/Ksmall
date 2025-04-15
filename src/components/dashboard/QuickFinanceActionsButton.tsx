import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton, Menu } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import DashboardAccountingService from '../../services/DashboardAccountingService';

/**
 * Bouton d'actions rapides pour les opérations financières
 */
const QuickFinanceActionsButton = () => {
  const navigation = useNavigation<any>();
  const [visible, setVisible] = useState(false);
  const [creditScore, setCreditScore] = useState(0);
  
  useEffect(() => {
    const loadCreditScore = async () => {
      try {
        // Récupérer le score de crédit depuis le service comptable
        const score = await DashboardAccountingService.calculateCreditScore();
        setCreditScore(score);
      } catch (error) {
        console.error("Erreur lors du chargement du score de crédit:", error);
      }
    };
    
    loadCreditScore();
  }, []);
  
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);
  
  // Navigation vers les écrans financiers
  const navigateToFinance = (type: string) => {
    closeMenu();
    navigation.navigate('FinanceRequest', { 
      type,
      creditScore // Transmettre le score de crédit pour le calcul des conditions
    });
  };
  
  const navigateToInvestment = (type: string) => {
    closeMenu();
    navigation.navigate('FinanceInvestment', { 
      type,
      creditScore // Transmettre le score de crédit
    });
  };

  return (
    <View>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <IconButton 
            icon="cash-multiple" 
            size={20} 
            onPress={openMenu} 
          />
        }
      >
        <Menu.Item 
          onPress={() => navigateToFinance('businessLoan')} 
          title="Crédit entreprise"
          leadingIcon="bank"
        />
        <Menu.Item 
          onPress={() => navigateToFinance('lineOfCredit')} 
          title="Ligne de crédit"
          leadingIcon="cash-check"
        />
        <Menu.Item 
          onPress={() => navigateToFinance('equipmentLease')} 
          title="Leasing équipement"
          leadingIcon="truck"
        />
        <Menu.Item 
          onPress={() => navigateToInvestment('bonds')} 
          title="Investir"
          leadingIcon="chart-line"
        />
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    marginLeft: 8,
  },
});

export default QuickFinanceActionsButton;