import CurrencyService from '../services/CurrencyService';
import { getContextValue } from './contextHelpers';
import { useCurrency } from '../hooks/useCurrency';  // Updated import path

/**
 * Formatte un montant en devise
 * @param amount - Montant à formater
 * @param options - Options de formatage (optionnel)
 */
export async function formatCurrencyAsync(amount: number, options?: {
  showSymbol?: boolean;
  symbolPosition?: 'before' | 'after';
  numberOfDecimals?: number;
}): Promise<string> {
  // Get the selected currency first, then format the amount
  const selectedCurrency = await CurrencyService.getSelectedCurrency();
  return CurrencyService.formatAmount(amount, selectedCurrency, options);
}

/**
 * Formatte un montant en devise (version synchrone)
 * Cette fonction essaie d'utiliser le contexte React s'il est disponible,
 * sinon elle utilise une méthode de secours
 * 
 * @param amount - Montant à formater
 * @param currency - Devise (option pour compatibilité avec l'ancien code)
 * @param locale - Locale à utiliser (par défaut: 'fr-FR')
 */
export function formatCurrency(amount: number, currency?: string, locale: string = 'fr-FR'): string {
  try {
    // Essayer d'abord d'utiliser le contexte (dans un composant React)
    const ctx = getContextValue(() => useCurrency());
    if (ctx && ctx.formatAmount) {
      return ctx.formatAmount(amount);
    }
  } catch (error) {
    // Si on n'est pas dans un contexte React, on continue avec la méthode de secours
  }
  
  // Version synchrone de secours (compatible avec l'ancien code)
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency || 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format a date string
 * 
 * @param dateString The date string to format
 * @param format The format to use (default: short)
 * @returns Formatted date string
 */
export const formatDate = (dateString: string, format: 'short' | 'medium' | 'long' = 'medium'): string => {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return dateString; // Return original string if invalid date
  }

  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric',
    month: format === 'short' ? 'numeric' : 'short',
    day: 'numeric'
  };
  
  if (format === 'long') {
    options.weekday = 'long';
    options.month = 'long';
  }

  return new Intl.DateTimeFormat(undefined, options).format(date);
};

/**
 * Format a time string (typically for chat messages)
 * 
 * @param dateString The date string to format
 * @returns Formatted time string (HH:MM)
 */
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return ''; // Return empty string if invalid date
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Format a number as percentage
 * 
 * @param value The value to format as percentage
 * @param digitsAfterDecimal The number of digits after decimal (default: 2)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, digitsAfterDecimal: number = 2): string => {
  return `${(value * 100).toFixed(digitsAfterDecimal)}%`;
};

/**
 * Formatte un nombre avec des séparateurs de milliers
 * @param num - Nombre à formater
 * @param locale - Locale à utiliser (par défaut: 'fr-FR')
 */
export function formatNumber(num: number, locale: string = 'fr-FR'): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format a date in a relative format (e.g., "2 hours ago", "yesterday", etc.)
 */
export function formatDateRelative(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  // Less than an hour
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  // Less than a day
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  // Less than a week
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    if (diffInDays === 1) {
      return 'yesterday';
    }
    return `${diffInDays} days ago`;
  }
  
  // Format as date
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
