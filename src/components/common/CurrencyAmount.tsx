import React from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';
import { useCurrency } from '../../hooks/useCurrency';
import CurrencyService from '../../services/CurrencyService';

interface CurrencyAmountProps {
  /**
   * Le montant à afficher
   */
  amount: number;
  
  /**
   * Afficher le symbole de la devise
   * @default true
   */
  showSymbol?: boolean;
  
  /**
   * Nombre de décimales à afficher (si non spécifié, utilise la valeur par défaut de la devise)
   */
  numberOfDecimals?: number;
  
  /**
   * Styles supplémentaires à appliquer au texte
   */
  style?: StyleProp<TextStyle>;
  
  /**
   * Appliquer une couleur différente si le montant est négatif
   * @default true
   */
  colorNegative?: boolean;
  
  /**
   * Couleur appliquée aux montants négatifs si colorNegative est true
   * @default '#F44336' (rouge)
   */
  negativeColor?: string;
  
  /**
   * Tester si le montant est un débit ou un crédit (inverse la logique de couleur)
   * @default false
   */
  isDebitCredit?: boolean;
}

/**
 * Composant pour afficher uniformément les montants avec devise dans toute l'application
 */
const CurrencyAmount: React.FC<CurrencyAmountProps> = ({
  amount,
  showSymbol = true,
  numberOfDecimals,
  style,
  colorNegative = true,
  negativeColor = '#F44336',
  isDebitCredit = false
}) => {
  // Utiliser le hook pour récupérer la devise actuelle
  const { currencyInfo } = useCurrency();
  
  // Si la devise n'est pas encore chargée, afficher une valeur par défaut
  if (!currencyInfo) {
    return <Text style={style}>...</Text>;
  }
  
  // Formater le montant
  const formattedAmount = CurrencyService.formatAmount(amount, currencyInfo.code, {
    showSymbol,
    numberOfDecimals
  });
  
  // Déterminer si la couleur négative doit être appliquée
  const isNegative = isDebitCredit ? amount > 0 : amount < 0;
  const textStyle = colorNegative && isNegative 
    ? [style, { color: negativeColor }] 
    : style;
  
  return (
    <Text style={textStyle}>{formattedAmount}</Text>
  );
};

export default CurrencyAmount;