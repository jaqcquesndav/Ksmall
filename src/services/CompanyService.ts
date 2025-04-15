import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

const COMPANY_INFO_KEY = 'company_info';
const CURRENT_COMPANY_ID_KEY = 'current_company_id';

export interface CompanyInfo {
  name: string;
  address: string;
  registrationNumber: string; // RCCM (Registre du Commerce et du Crédit Mobilier)
  taxId: string;             // NIF (Numéro d'Identification Fiscale)
  phone: string;
  email: string;
  logo?: string;             // Base64-encoded logo image
  id?: string;               // Unique identifier for the company
  siren?: string;            // French company registration number
}

export async function getCompanyInfo(): Promise<CompanyInfo | null> {
  try {
    const data = await AsyncStorage.getItem(COMPANY_INFO_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Erreur lors de la récupération des informations de l\'entreprise', error);
    return null;
  }
}

export async function saveCompanyInfo(info: CompanyInfo): Promise<void> {
  try {
    await AsyncStorage.setItem(COMPANY_INFO_KEY, JSON.stringify(info));
  } catch (error) {
    logger.error('Erreur lors de l\'enregistrement des informations de l\'entreprise', error);
    throw error;
  }
}

export async function clearCompanyInfo(): Promise<void> {
  try {
    await AsyncStorage.removeItem(COMPANY_INFO_KEY);
  } catch (error) {
    logger.error('Erreur lors de la suppression des informations de l\'entreprise', error);
    throw error;
  }
}

/**
 * Get the ID of the current company
 */
export async function getCurrentCompanyId(): Promise<string> {
  try {
    // Try to get the current company ID from AsyncStorage
    const companyId = await AsyncStorage.getItem(CURRENT_COMPANY_ID_KEY);
    
    // If it exists, return it
    if (companyId) {
      return companyId;
    }
    
    // Otherwise, try to get it from the company info
    const companyInfo = await getCompanyInfo();
    if (companyInfo && companyInfo.id) {
      return companyInfo.id;
    }
    
    // If no ID exists yet, generate a default one
    const defaultId = 'default-company';
    await AsyncStorage.setItem(CURRENT_COMPANY_ID_KEY, defaultId);
    return defaultId;
  } catch (error) {
    logger.error('Error getting current company ID', error);
    // Return a default ID in case of error
    return 'default-company';
  }
}

/**
 * Get the name of the current company
 */
export async function getCurrentCompanyName(): Promise<string> {
  try {
    const companyInfo = await getCompanyInfo();
    if (companyInfo && companyInfo.name) {
      return companyInfo.name;
    }
    return 'Nom de l\'entreprise';
  } catch (error) {
    logger.error('Error getting company name', error);
    return 'Nom de l\'entreprise';
  }
}

/**
 * Get the current company's credit score
 * @returns The credit score value between 0 and 100
 */
export async function getCompanyCreditScore(): Promise<number> {
  try {
    const storedScore = await AsyncStorage.getItem('company_credit_score');
    if (storedScore !== null) {
      return parseInt(storedScore, 10);
    }
    
    // Default value if not set yet
    const defaultScore = 78;
    await AsyncStorage.setItem('company_credit_score', defaultScore.toString());
    return defaultScore;
  } catch (error) {
    logger.error('Error getting company credit score', error);
    return 78; // Default fallback score
  }
}

/**
 * Update the company's credit score
 * @param score New credit score value (0-100)
 */
export async function updateCompanyCreditScore(score: number): Promise<void> {
  try {
    // Ensure score is within valid range
    const validScore = Math.min(100, Math.max(0, score));
    await AsyncStorage.setItem('company_credit_score', validScore.toString());
  } catch (error) {
    logger.error('Error updating company credit score', error);
    throw error;
  }
}
