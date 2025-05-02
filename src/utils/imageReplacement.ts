/**
 * Utilitaire pour remplacer globalement le composant Image de React Native
 * par notre version personnalisée qui utilise des icônes natifs
 */

import { Image as RNImage } from 'react-native';
import logger from './logger';

// Importation de notre composant Image personnalisé
import CustomImage from '../components/common/Image';

/**
 * Remplace le composant Image standard de React Native par notre version
 * Cette fonction est appelée au démarrage de l'application pour éviter les erreurs Jimp
 */
export const replaceNativeImageComponent = () => {
  try {
    // Sauvegarder la référence au composant Image original
    if (!global.__ORIGINAL_RN_IMAGE__) {
      global.__ORIGINAL_RN_IMAGE__ = RNImage;
    }
    
    // Remplacer le composant Image par notre version personnalisée
    // @ts-ignore - Cette approche est un peu non conventionnelle mais nécessaire
    RNImage = CustomImage;
    
    logger.info('Image native remplacée par la version avec icônes natifs');
    return true;
  } catch (error) {
    logger.error('Erreur lors du remplacement du composant Image:', error);
    return false;
  }
};

/**
 * Restaure le composant Image original de React Native
 * Utile pour revenir au comportement par défaut en production
 */
export const restoreNativeImageComponent = () => {
  try {
    if (global.__ORIGINAL_RN_IMAGE__) {
      // @ts-ignore
      RNImage = global.__ORIGINAL_RN_IMAGE__;
      logger.info('Image native restaurée à sa version originale');
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Erreur lors de la restauration du composant Image:', error);
    return false;
  }
};