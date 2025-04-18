import React, { createContext, useState, useEffect, ReactNode } from 'react';
import CurrencyService, { Currency, CurrencyInfo, CURRENCIES } from '../services/CurrencyService';
import { UseCurrencyReturnType } from '../hooks/useCurrency';
import logger from '../utils/logger';

// Création du contexte avec une valeur par défaut
export const CurrencyContext = createContext<UseCurrencyReturnType | null>(null);

interface CurrencyProviderProps {
  children: ReactNode;
}

/**
 * Provider pour gérer le contexte de devise dans l'application
 */
export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  // État pour stocker la devise actuelle
  const [currency, setCurrency] = useState<Currency>('XOF');
  // État pour stocker les informations complètes sur la devise
  const [currencyInfo, setCurrencyInfo] = useState<CurrencyInfo>(CURRENCIES.XOF);
  // État pour suivre le chargement initial
  const [loading, setLoading] = useState<boolean>(true);

  // Charger la devise depuis le stockage local au démarrage
  useEffect(() => {
    const loadCurrency = async () => {
      try {
        // Récupérer la devise sélectionnée
        const savedCurrency = await CurrencyService.getSelectedCurrency();
        setCurrency(savedCurrency);
        
        // Récupérer les informations complètes sur cette devise
        const info = CurrencyService.getCurrencyInfo(savedCurrency);
        if (info) {
          setCurrencyInfo(info);
        }
      } catch (error) {
        logger.error('Erreur lors du chargement de la devise:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCurrency();
  }, []);

  /**
   * Change la devise actuelle et met à jour le stockage local
   * @param newCurrency La nouvelle devise à utiliser
   */
  const handleSetCurrency = async (newCurrency: Currency) => {
    try {
      // Vérifier que la devise existe
      const info = CurrencyService.getCurrencyInfo(newCurrency);
      if (!info) {
        throw new Error(`Devise non supportée: ${newCurrency}`);
      }
      
      // Mettre à jour l'état local
      setCurrency(newCurrency);
      setCurrencyInfo(info);
      
      // Persister le changement
      await CurrencyService.setSelectedCurrency(newCurrency);
    } catch (error) {
      logger.error('Erreur lors du changement de devise:', error);
      throw error;
    }
  };

  /**
   * Formate un montant selon la devise actuelle
   * @param amount Le montant à formater
   * @param options Options de formatage
   * @returns Le montant formaté sous forme de chaîne
   */
  const formatAmount = (amount: number, options?: { 
    showSymbol?: boolean;
    numberOfDecimals?: number;
  }): string => {
    return CurrencyService.formatAmount(amount, currency, options);
  };

  /**
   * Convertit un montant d'une devise à la devise actuelle
   * @param amount Le montant à convertir
   * @param fromCurrency La devise source
   * @returns Le montant converti
   */
  const convertToCurrentCurrency = async (amount: number, fromCurrency: Currency): Promise<number> => {
    const result = await CurrencyService.convertAmount(amount, fromCurrency, currency);
    return result ?? amount; // Return the original amount if conversion failed
  };

  // Valeur du contexte exposée aux composants enfants
  const contextValue: UseCurrencyReturnType = {
    currency,
    currencyInfo,
    setCurrency: handleSetCurrency,
    formatAmount,
    convertToCurrentCurrency,
    // Adding missing properties
    loading,
    selectedCurrency: currency,
    updateCurrency: handleSetCurrency,
    getAllCurrencies: () => Object.values(CURRENCIES)
  };

  // Si le chargement initial n'est pas terminé, on peut afficher un indicateur de chargement
  if (loading) {
    // En réalité, on pourrait retourner un composant de chargement ici
    // Mais pour éviter des problèmes, on retourne le provider avec la devise par défaut
    return (
      <CurrencyContext.Provider value={contextValue}>
        {children}
      </CurrencyContext.Provider>
    );
  }

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};