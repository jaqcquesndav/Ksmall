import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';
import MockDataService from './MockDataService';
import * as FileSystem from 'expo-file-system';
import DatabaseService from './DatabaseService';

const COMPANY_INFO_KEY = 'company_info';
const CURRENT_COMPANY_ID_KEY = 'current_company_id';
const LOGO_DIRECTORY = `${FileSystem.documentDirectory}company_logos/`;

export interface CompanyInfo {
  id?: string;               // Identifiant unique pour l'entreprise
  name: string;              // Nom de l'entreprise
  
  // Forme juridique
  legalForm: string;         // 'ETs', 'SARLU', 'SARL', 'SA', 'SAS', 'SNC', 'SCS', 'GIE', 'OTHER'
  
  // Identifiants nationaux
  registrationNumber: string; // RCCM (Registre du Commerce et du Crédit Mobilier)
  taxId: string;              // NIF (Numéro d'Identification Fiscale)
  idNat: string;              // ID National
  cnssNumber: string;         // CNSS (Caisse Nationale de Sécurité Sociale)
  inppNumber: string;         // INPP (Institut National de Préparation Professionnelle)
  patentNumber: string;       // Numéro de Patente (pour les petites entreprises/commerces)
  
  // Coordonnées
  phone: string;
  email: string;
  website?: string;
  
  // Adresse et localisation
  address: {
    street: string;
    city: string;
    postalCode?: string;
    country: string;
  };
  
  // Coordonnées géographiques
  locations?: {
    headquarters?: { latitude: number; longitude: number; description?: string };
    salesPoints?: Array<{ latitude: number; longitude: number; name: string; description?: string }>;
    productionSites?: Array<{ latitude: number; longitude: number; name: string; description?: string }>;
  };
  
  // Autres informations
  logo?: string;             // Image du logo encodée en Base64 ou URI
  logoLastModified?: number; // Timestamp de dernière modification du logo
  creationDate?: string;     // Date de création
  employeeCount?: number;    // Nombre d'employés
  
  // Associés et partenaires
  associates?: Array<{
    name: string;
    contribution: number;
    percentage: number;
    role: string;
  }>;
  
  // Lien vers l'utilisateur
  userId?: string;          // ID de l'utilisateur associé au profil d'entreprise
}

/**
 * Initialise le répertoire des logos si nécessaire
 */
async function ensureLogoDirectoryExists(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(LOGO_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(LOGO_DIRECTORY, { intermediates: true });
      logger.debug('Répertoire des logos créé');
    }
  } catch (error) {
    logger.error('Erreur lors de la création du répertoire des logos:', error);
  }
}

/**
 * Sauvegarde une image de logo sur le système de fichiers
 * @param uri URI de l'image à sauvegarder
 * @returns Chemin du fichier sauvegardé
 */
async function saveLogoToFile(uri: string): Promise<string> {
  try {
    await ensureLogoDirectoryExists();
    
    const fileName = `logo_${Date.now()}.jpg`;
    const destination = `${LOGO_DIRECTORY}${fileName}`;
    
    await FileSystem.copyAsync({
      from: uri,
      to: destination
    });
    
    logger.debug('Logo sauvegardé:', destination);
    return destination;
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde du logo:', error);
    throw error;
  }
}

export async function getCompanyInfo(): Promise<CompanyInfo | null> {
  try {
    // Essayer d'abord d'obtenir les informations depuis la base de données SQLite
    const db = await DatabaseService.getDatabase();
    
    // Vérifier si la table company_profile existe
    const [tableCheck] = await DatabaseService.executeQuery(
      db,
      "SELECT name FROM sqlite_master WHERE type='table' AND name='company_profile'",
      []
    );
    
    if (tableCheck?.rows?.length > 0) {
      // La table existe, récupérer les données
      const [result] = await DatabaseService.executeQuery(
        db,
        "SELECT * FROM company_profile WHERE id = 1",
        []
      );
      
      if (result?.rows?.length > 0) {
        const companyData = result.rows.item(0);
        
        // Essayer de récupérer les données supplémentaires (associés, etc.) si nécessaire
        const companyInfo: CompanyInfo = {
          id: companyData.id.toString(),
          name: companyData.name || '',
          legalForm: companyData.legal_form || '',
          registrationNumber: companyData.registration_number || '',
          taxId: companyData.tax_id || '',
          idNat: companyData.id_nat || '',
          cnssNumber: companyData.cnss_number || '',
          inppNumber: companyData.inpp_number || '',
          patentNumber: companyData.patent_number || '',
          phone: companyData.phone || '',
          email: companyData.email || '',
          website: companyData.website || '',
          logo: companyData.logo || null,
          logoLastModified: companyData.logo_last_modified ? parseInt(companyData.logo_last_modified) : undefined,
          creationDate: companyData.creation_date || '',
          employeeCount: companyData.employee_count ? parseInt(companyData.employee_count) : 0,
          address: {
            street: companyData.address_street || '',
            city: companyData.address_city || '',
            postalCode: companyData.address_postal_code || '',
            country: companyData.address_country || '',
          },
          userId: companyData.user_id || undefined
        };
        
        return companyInfo;
      }
    }
    
    // Si pas de données dans SQLite, essayer AsyncStorage (pour la compatibilité avec les anciennes versions)
    const jsonValue = await AsyncStorage.getItem(COMPANY_INFO_KEY);
    
    if (jsonValue) {
      return JSON.parse(jsonValue);
    }
    
    return null;
  } catch (e) {
    logger.error('Erreur lors de la récupération des informations d\'entreprise:', e);
    return null;
  }
}

export async function saveCompanyInfo(info: CompanyInfo): Promise<void> {
  try {
    const db = await DatabaseService.getDatabase();
    
    // Créer la table si elle n'existe pas
    await DatabaseService.executeQuery(
      db,
      `CREATE TABLE IF NOT EXISTS company_profile (
        id INTEGER PRIMARY KEY,
        name TEXT,
        legal_form TEXT,
        registration_number TEXT,
        tax_id TEXT,
        id_nat TEXT,
        cnss_number TEXT,
        inpp_number TEXT,
        patent_number TEXT,
        phone TEXT,
        email TEXT, 
        website TEXT,
        logo TEXT,
        logo_last_modified TEXT,
        creation_date TEXT,
        employee_count INTEGER,
        address_street TEXT,
        address_city TEXT,
        address_postal_code TEXT,
        address_country TEXT,
        user_id TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      []
    );

    // Si l'URI du logo est une URI locale temporaire (de la galerie), sauvegarder le fichier
    if (info.logo && info.logo.startsWith('file://')) {
      try {
        const savedLogoPath = await saveLogoToFile(info.logo);
        info.logo = savedLogoPath;
        info.logoLastModified = Date.now();
      } catch (logoError) {
        logger.error('Erreur lors de la sauvegarde du logo:', logoError);
        // Continuer sans logo
      }
    }
    
    // Vérifier si un profil existe déjà
    const [checkResult] = await DatabaseService.executeQuery(
      db,
      "SELECT id FROM company_profile WHERE id = 1",
      []
    );
    
    if (checkResult?.rows?.length > 0) {
      // Mettre à jour le profil existant
      await DatabaseService.executeQuery(
        db,
        `UPDATE company_profile SET 
          name = ?,
          legal_form = ?,
          registration_number = ?,
          tax_id = ?,
          id_nat = ?,
          cnss_number = ?,
          inpp_number = ?,
          patent_number = ?,
          phone = ?,
          email = ?,
          website = ?,
          logo = ?,
          logo_last_modified = ?,
          creation_date = ?,
          employee_count = ?,
          address_street = ?,
          address_city = ?,
          address_postal_code = ?,
          address_country = ?,
          user_id = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1`,
        [
          info.name,
          info.legalForm,
          info.registrationNumber,
          info.taxId,
          info.idNat,
          info.cnssNumber,
          info.inppNumber,
          info.patentNumber,
          info.phone,
          info.email,
          info.website,
          info.logo,
          info.logoLastModified?.toString(),
          info.creationDate,
          info.employeeCount?.toString(),
          info.address.street,
          info.address.city,
          info.address.postalCode,
          info.address.country,
          info.userId
        ]
      );
    } else {
      // Insérer un nouveau profil
      await DatabaseService.executeQuery(
        db,
        `INSERT INTO company_profile (
          id,
          name,
          legal_form,
          registration_number,
          tax_id,
          id_nat,
          cnss_number,
          inpp_number,
          patent_number,
          phone,
          email,
          website,
          logo,
          logo_last_modified,
          creation_date,
          employee_count,
          address_street,
          address_city,
          address_postal_code,
          address_country,
          user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          1, // ID fixe pour le profil principal
          info.name,
          info.legalForm,
          info.registrationNumber,
          info.taxId,
          info.idNat,
          info.cnssNumber,
          info.inppNumber,
          info.patentNumber,
          info.phone,
          info.email,
          info.website,
          info.logo,
          info.logoLastModified?.toString(),
          info.creationDate,
          info.employeeCount?.toString(),
          info.address.street,
          info.address.city,
          info.address.postalCode,
          info.address.country,
          info.userId
        ]
      );
    }
    
    // Sauvegarder également dans AsyncStorage pour la compatibilité ascendante
    await AsyncStorage.setItem(COMPANY_INFO_KEY, JSON.stringify(info));
    
    logger.info('Profil d\'entreprise sauvegardé');
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde du profil d\'entreprise:', error);
    throw error;
  }
}

export async function clearCompanyInfo(): Promise<void> {
  try {
    await AsyncStorage.removeItem(COMPANY_INFO_KEY);
    
    // Aussi effacer de la base de données si présent
    const db = await DatabaseService.getDatabase();
    await DatabaseService.executeQuery(db, "DELETE FROM company_profile WHERE id = 1", []);
    
    logger.info('Profil d\'entreprise effacé');
  } catch (e) {
    logger.error('Erreur lors de la suppression des informations d\'entreprise:', e);
    throw e;
  }
}

/**
 * Get the ID of the current company
 */
export async function getCurrentCompanyId(): Promise<string> {
  try {
    const id = await AsyncStorage.getItem(CURRENT_COMPANY_ID_KEY);
    return id || '1'; // Default to '1' if not set
  } catch (e) {
    logger.error('Error getting current company ID:', e);
    return '1'; // Default to '1' on error
  }
}

/**
 * Get the name of the current company
 */
export async function getCurrentCompanyName(): Promise<string> {
  try {
    const info = await getCompanyInfo();
    return info?.name || 'Mon Entreprise';
  } catch (e) {
    logger.error('Error getting current company name:', e);
    return 'Mon Entreprise';
  }
}

/**
 * Get the current company's credit score
 * @returns The credit score value between 0 and 100
 */
export async function getCompanyCreditScore(): Promise<number> {
  // Utiliser le service MockDataService comme source unique de vérité
  return await MockDataService.getCreditScore();
}

/**
 * Update the company's credit score
 * @param score New credit score value (0-100)
 */
export async function updateCompanyCreditScore(score: number): Promise<void> {
  // Utiliser le service MockDataService comme source unique de vérité
  return await MockDataService.updateCreditScore(score);
}

/**
 * Obtenir le logo de l'entreprise
 * @returns URI du logo ou null
 */
export async function getCompanyLogo(): Promise<string | null> {
  try {
    const info = await getCompanyInfo();
    return info?.logo || null;
  } catch (error) {
    logger.error('Erreur lors de la récupération du logo:', error);
    return null;
  }
}
