import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

// Clé pour stocker la devise sélectionnée
const SELECTED_CURRENCY_KEY = 'settings.selectedCurrency';

// Types de devise disponibles
export type Currency = 'USD' | 'CDF' | 'XOF';

// Interface pour les informations sur les devises
export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  format: (amount: number) => string;
}

// Définitions des devises disponibles
export const CURRENCIES: { [key in Currency]: CurrencyInfo } = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dollar américain',
    format: (amount: number) => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  },
  CDF: {
    code: 'CDF',
    symbol: 'FC',
    name: 'Franc congolais',
    format: (amount: number) => new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  },
  XOF: {
    code: 'XOF',
    symbol: 'FCFA',
    name: 'Franc CFA',
    format: (amount: number) => new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount)
  }
};

// Devise par défaut
const DEFAULT_CURRENCY: Currency = 'XOF';

/**
 * Service pour gérer les paramètres et fonctionnalités liés aux devises
 */
class CurrencyService {
  /**
   * Récupère la devise actuellement sélectionnée par l'utilisateur
   */
  async getSelectedCurrency(): Promise<Currency> {
    try {
      const currency = await AsyncStorage.getItem(SELECTED_CURRENCY_KEY);
      return (currency as Currency) || DEFAULT_CURRENCY;
    } catch (error) {
      logger.error('Erreur lors de la récupération de la devise:', error);
      return DEFAULT_CURRENCY;
    }
  }

  /**
   * Définit la devise sélectionnée par l'utilisateur
   */
  async setSelectedCurrency(currency: Currency): Promise<void> {
    try {
      await AsyncStorage.setItem(SELECTED_CURRENCY_KEY, currency);
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde de la devise:', error);
    }
  }

  /**
   * Récupère les informations complètes sur la devise sélectionnée
   */
  async getSelectedCurrencyInfo(): Promise<CurrencyInfo> {
    const currencyCode = await this.getSelectedCurrency();
    return CURRENCIES[currencyCode];
  }

  /**
   * Formate un montant selon la devise sélectionnée
   */
  async formatAmount(amount: number): Promise<string> {
    const currencyInfo = await this.getSelectedCurrencyInfo();
    return currencyInfo.format(amount);
  }

  /**
   * Récupère la liste complète des devises disponibles
   */
  getAllCurrencies(): CurrencyInfo[] {
    return Object.values(CURRENCIES);
  }
}

export default new CurrencyService();