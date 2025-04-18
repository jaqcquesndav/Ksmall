import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';
import DatabaseService from './DatabaseService';

// Clés pour stocker les données de devise
const SELECTED_CURRENCY_KEY = 'settings.currency';
const EXCHANGE_RATES_KEY = 'settings.exchangeRates';

// Types de devises supportées
export type Currency = 'XOF' | 'USD' | 'CDF';

// Interface pour les informations de devise
export interface CurrencyInfo {
  code: Currency;
  name: string;
  symbol: string;
  format: (amount: number) => string;
  icon?: string; // Icône Material pour la devise (optionnel)
  position: 'before' | 'after'; // Position du symbole par rapport au montant
  decimals: number; // Nombre de décimales par défaut
  defaultLocale: string; // Locale pour le formatage par défaut
}

// Interface pour les taux de change
export interface ExchangeRate {
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  lastUpdated: number; // Timestamp de la dernière mise à jour
}

// Définition des devises disponibles
export const CURRENCIES: Record<Currency, CurrencyInfo> = {
  XOF: {
    code: 'XOF',
    name: 'Franc CFA BCEAO',
    symbol: 'FCFA',
    icon: 'cash',
    position: 'after',
    decimals: 0,
    defaultLocale: 'fr-FR',
    format: (amount: number): string => {
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount) + ' FCFA';
    }
  },
  USD: {
    code: 'USD',
    name: 'Dollar américain',
    symbol: '$',
    icon: 'currency-usd',
    position: 'before',
    decimals: 2,
    defaultLocale: 'en-US',
    format: (amount: number): string => {
      return '$ ' + new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    }
  },
  CDF: {
    code: 'CDF',
    name: 'Franc Congolais',
    symbol: 'FC',
    icon: 'cash',
    position: 'after',
    decimals: 2,
    defaultLocale: 'fr-CD',
    format: (amount: number): string => {
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount) + ' FC';
    }
  }
};

// Taux de change par défaut (1 unité de devise par rapport au XOF)
const DEFAULT_EXCHANGE_RATES: ExchangeRate[] = [
  {
    fromCurrency: 'XOF',
    toCurrency: 'USD',
    rate: 0.00165, // 1 XOF = 0.00165 USD
    lastUpdated: Date.now()
  },
  {
    fromCurrency: 'USD',
    toCurrency: 'XOF',
    rate: 607.483, // 1 USD = 607.483 XOF
    lastUpdated: Date.now()
  },
  {
    fromCurrency: 'XOF',
    toCurrency: 'CDF',
    rate: 2.7, // 1 XOF = 2.7 CDF (exemple)
    lastUpdated: Date.now()
  },
  {
    fromCurrency: 'CDF',
    toCurrency: 'XOF',
    rate: 0.37, // 1 CDF = 0.37 XOF (exemple)
    lastUpdated: Date.now()
  },
  {
    fromCurrency: 'USD',
    toCurrency: 'CDF',
    rate: 1640, // 1 USD = 1640 CDF (exemple)
    lastUpdated: Date.now()
  },
  {
    fromCurrency: 'CDF',
    toCurrency: 'USD',
    rate: 0.00061, // 1 CDF = 0.00061 USD (exemple)
    lastUpdated: Date.now()
  }
];

// Service de gestion des devises
class CurrencyService {
  // Cache des taux de change
  private exchangeRatesCache: ExchangeRate[] | null = null;

  constructor() {
    // S'assurer que la table exchange_rates existe dans la base de données
    this.initializeExchangeRatesTable();
  }

  /**
   * Initialise la table des taux de change dans la base de données
   */
  private async initializeExchangeRatesTable() {
    try {
      const db = await DatabaseService.getDBConnection();
      
      // Vérifier si la table existe et la créer si nécessaire
      await DatabaseService.executeQuery(
        db,
        `CREATE TABLE IF NOT EXISTS exchange_rates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          from_currency TEXT NOT NULL,
          to_currency TEXT NOT NULL,
          rate REAL NOT NULL,
          last_updated INTEGER NOT NULL,
          UNIQUE(from_currency, to_currency)
        )`,
        []
      );

      // Vérifier s'il y a déjà des taux de change dans la table
      const [result] = await DatabaseService.executeQuery(
        db,
        'SELECT COUNT(*) as count FROM exchange_rates',
        []
      );

      // Si la table est vide, initialiser avec les taux par défaut
      if (result && result.rows.item(0).count === 0) {
        for (const rate of DEFAULT_EXCHANGE_RATES) {
          await DatabaseService.executeQuery(
            db,
            `INSERT INTO exchange_rates (from_currency, to_currency, rate, last_updated) 
             VALUES (?, ?, ?, ?)`,
            [rate.fromCurrency, rate.toCurrency, rate.rate, rate.lastUpdated]
          );
        }
        logger.info('Taux de change initialisés dans la base de données');
      }
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation de la table des taux de change:', error);
    }
  }

  /**
   * Récupère la devise sélectionnée par l'utilisateur
   * @returns La devise sélectionnée ou la devise par défaut (XOF)
   */
  async getSelectedCurrency(): Promise<Currency> {
    try {
      const selectedCurrency = await AsyncStorage.getItem(SELECTED_CURRENCY_KEY);
      if (selectedCurrency && Object.keys(CURRENCIES).includes(selectedCurrency)) {
        return selectedCurrency as Currency;
      }
      return 'XOF'; // Devise par défaut
    } catch (error) {
      logger.error('Erreur lors de la récupération de la devise sélectionnée:', error);
      return 'XOF'; // En cas d'erreur, retourner la devise par défaut
    }
  }
  
  /**
   * Définit la devise sélectionnée par l'utilisateur
   * @param currency La devise à sélectionner
   * @returns Promise<void>
   */
  async setSelectedCurrency(currency: Currency): Promise<void> {
    try {
      await AsyncStorage.setItem(SELECTED_CURRENCY_KEY, currency);
      return Promise.resolve();
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement de la devise sélectionnée:', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Récupère les informations d'une devise
   * @param currency Le code de la devise
   * @returns Les informations de la devise ou null si la devise n'existe pas
   */
  getCurrencyInfo(currency: Currency): CurrencyInfo | null {
    return CURRENCIES[currency] || null;
  }
  
  /**
   * Récupère toutes les devises disponibles
   * @returns Un tableau de toutes les devises disponibles
   */
  getAllCurrencies(): CurrencyInfo[] {
    return Object.values(CURRENCIES);
  }
  
  /**
   * Formate un montant selon la devise spécifiée
   * @param amount Le montant à formater
   * @param currency La devise à utiliser pour le formatage
   * @param options Options supplémentaires de formatage
   * @returns Le montant formaté sous forme de chaîne
   */
  formatAmount(amount: number, currency: Currency, options?: {
    showSymbol?: boolean;
    symbolPosition?: 'before' | 'after';
    numberOfDecimals?: number;
  }): string {
    const currencyInfo = this.getCurrencyInfo(currency);
    
    if (!currencyInfo) {
      return amount.toString();
    }
    
    // Options par défaut
    const {
      showSymbol = true,
      symbolPosition = currencyInfo.position,
      numberOfDecimals = currencyInfo.decimals
    } = options || {};
    
    try {
      // Formater le montant selon les options
      const formatter = new Intl.NumberFormat(currencyInfo.defaultLocale, {
        minimumFractionDigits: numberOfDecimals,
        maximumFractionDigits: numberOfDecimals,
      });
      
      const formattedNumber = formatter.format(amount);
      
      if (!showSymbol) {
        return formattedNumber;
      }
      
      return symbolPosition === 'before' 
        ? `${currencyInfo.symbol} ${formattedNumber}`
        : `${formattedNumber} ${currencyInfo.symbol}`;
    } catch (error) {
      logger.error('Erreur lors du formatage du montant:', error);
      return `${amount}`;
    }
  }

  /**
   * Récupère tous les taux de change
   * @returns Tableau de tous les taux de change
   */
  async getAllExchangeRates(): Promise<ExchangeRate[]> {
    try {
      // Utiliser le cache si disponible
      if (this.exchangeRatesCache) {
        return this.exchangeRatesCache;
      }

      const db = await DatabaseService.getDBConnection();
      const [result] = await DatabaseService.executeQuery(
        db,
        `SELECT from_currency, to_currency, rate, last_updated 
         FROM exchange_rates`,
        []
      );

      const rates: ExchangeRate[] = [];
      if (result && result.rows) {
        for (let i = 0; i < result.rows.length; i++) {
          const item = result.rows.item(i);
          rates.push({
            fromCurrency: item.from_currency as Currency,
            toCurrency: item.to_currency as Currency,
            rate: item.rate,
            lastUpdated: item.last_updated
          });
        }
      }

      // Mettre en cache les résultats
      this.exchangeRatesCache = rates;
      return rates;
    } catch (error) {
      logger.error('Erreur lors de la récupération des taux de change:', error);
      return DEFAULT_EXCHANGE_RATES;
    }
  }

  /**
   * Récupère un taux de change spécifique
   * @param fromCurrency Devise source
   * @param toCurrency Devise cible
   * @returns Le taux de change ou null si non trouvé
   */
  async getExchangeRate(fromCurrency: Currency, toCurrency: Currency): Promise<number | null> {
    try {
      // Si c'est la même devise, le taux est 1
      if (fromCurrency === toCurrency) {
        return 1;
      }

      const rates = await this.getAllExchangeRates();
      const rate = rates.find(r => 
        r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
      );

      return rate ? rate.rate : null;
    } catch (error) {
      logger.error(`Erreur lors de la récupération du taux de change ${fromCurrency}/${toCurrency}:`, error);
      return null;
    }
  }

  /**
   * Met à jour un taux de change
   * @param fromCurrency Devise source
   * @param toCurrency Devise cible
   * @param rate Nouveau taux de change
   * @returns true si la mise à jour a réussi, false sinon
   */
  async updateExchangeRate(fromCurrency: Currency, toCurrency: Currency, rate: number): Promise<boolean> {
    try {
      if (rate <= 0) {
        throw new Error('Le taux de change doit être positif');
      }

      const db = await DatabaseService.getDBConnection();
      const timestamp = Date.now();

      await DatabaseService.executeQuery(
        db,
        `INSERT INTO exchange_rates (from_currency, to_currency, rate, last_updated) 
         VALUES (?, ?, ?, ?)
         ON CONFLICT(from_currency, to_currency) 
         DO UPDATE SET rate = ?, last_updated = ?`,
        [fromCurrency, toCurrency, rate, timestamp, rate, timestamp]
      );

      // Mettre à jour le taux inverse automatiquement
      const inverseRate = 1 / rate;
      await DatabaseService.executeQuery(
        db,
        `INSERT INTO exchange_rates (from_currency, to_currency, rate, last_updated) 
         VALUES (?, ?, ?, ?)
         ON CONFLICT(from_currency, to_currency) 
         DO UPDATE SET rate = ?, last_updated = ?`,
        [toCurrency, fromCurrency, inverseRate, timestamp, inverseRate, timestamp]
      );

      // Invalider le cache
      this.exchangeRatesCache = null;
      
      logger.info(`Taux de change mis à jour: 1 ${fromCurrency} = ${rate} ${toCurrency}`);
      return true;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du taux de change:', error);
      return false;
    }
  }

  /**
   * Convertit un montant d'une devise à une autre en utilisant les taux de change stockés
   * @param amount Le montant à convertir
   * @param fromCurrency La devise source
   * @param toCurrency La devise cible
   * @returns Le montant converti ou null si le taux n'est pas disponible
   */
  async convertAmount(amount: number, fromCurrency: Currency, toCurrency: Currency): Promise<number | null> {
    // Si c'est la même devise, retourner le même montant
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    
    if (rate === null) {
      logger.error(`Taux de change non disponible pour ${fromCurrency} vers ${toCurrency}`);
      return null;
    }

    return amount * rate;
  }
}

export default new CurrencyService();