import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

const COMPANY_INFO_KEY = 'company_info';

export interface CompanyInfo {
  name: string;
  address: string;
  registrationNumber: string; // RCCM (Registre du Commerce et du Crédit Mobilier)
  taxId: string;             // NIF (Numéro d'Identification Fiscale)
  phone: string;
  email: string;
  logo?: string;             // Base64-encoded logo image
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
