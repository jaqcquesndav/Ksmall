// Utilitaire pour utiliser des icônes natifs au lieu d'images
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import logger from './logger';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';

/**
 * Associe des icônes natifs aux ressources d'image manquantes
 * Évite l'erreur "Could not find MIME for Buffer <null>" de Jimp
 */
export const setupNativeIcons = () => {
  // Définir un mapping des noms d'images vers des icônes natifs
  global.__ICON_MAPPING__ = {
    'logo': {
      type: 'MaterialCommunityIcons',
      name: 'shopping',
      color: '#0066cc',
      size: 64
    },
    'onboarding1': {
      type: 'FontAwesome5',
      name: 'store',
      color: '#0066cc',
      size: 64
    },
    'onboarding2': {
      type: 'MaterialCommunityIcons',
      name: 'account-cash',
      color: '#0066cc',
      size: 64
    },
    'onboarding3': {
      type: 'Ionicons',
      name: 'stats-chart',
      color: '#0066cc',
      size: 64
    },
    'splash': {
      type: 'MaterialCommunityIcons',
      name: 'store-check',
      color: '#0066cc',
      size: 128
    },
    'icon': {
      type: 'FontAwesome5',
      name: 'shopping-bag',
      color: '#0066cc',
      size: 64
    }
  };
  
  logger.info('Configuration des icônes natifs terminée.');
  return true;
};

/**
 * Obtient un icône natif pour une ressource d'image spécifique
 * @param imageName Nom de l'image sans l'extension (ex: 'logo', 'onboarding1')
 * @returns Les propriétés de l'icône natif correspondant
 */
export const getNativeIconForImage = (imageName) => {
  if (!global.__ICON_MAPPING__) {
    setupNativeIcons();
  }
  
  // Extraire le nom de base sans extension ni chemin
  const baseName = imageName
    .replace(/\.(png|jpg|svg)$/, '')
    .split('/')
    .pop();
  
  return global.__ICON_MAPPING__[baseName] || {
    type: 'MaterialCommunityIcons',
    name: 'image-off',
    color: '#F44336',
    size: 48
  };
};

/**
 * Renvoie le composant d'icône approprié basé sur le type
 * @param type Type d'icône ('MaterialCommunityIcons', 'FontAwesome5', etc.)
 * @returns Le composant d'icône correspondant
 */
export const getIconComponent = (type) => {
  switch (type) {
    case 'MaterialCommunityIcons':
      return MaterialCommunityIcons;
    case 'FontAwesome5':
      return FontAwesome5;
    case 'Ionicons':
      return Ionicons;
    default:
      return MaterialCommunityIcons;
  }
};

/**
 * Fonction utilitaire pour l'ancienne vérification et préchargement d'images
 * Cette fonction est maintenue pour la compatibilité, mais utilise désormais l'approche d'icônes natifs
 */
export const validateAndPreloadImages = async () => {
  try {
    logger.info('Passage aux icônes natifs au lieu des images...');
    setupNativeIcons();
    return true;
  } catch (error) {
    logger.warn('Erreur lors de la configuration des icônes natifs:', error);
    return false;
  }
};