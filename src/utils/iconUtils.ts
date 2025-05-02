import { MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import logger from './logger';

/**
 * Configuration des icônes natifs pour remplacer les images
 * Mappings entre les noms d'images et les icônes de remplacement
 */
export const ICON_MAPPINGS = {
  // Images principales
  'icon': { 
    component: 'FontAwesome5', 
    name: 'shopping-bag', 
    color: '#0066cc',
    size: 64 
  },
  'splash': { 
    component: 'MaterialCommunityIcons', 
    name: 'store-check', 
    color: '#0066cc',
    size: 128 
  },
  'adaptive-icon': { 
    component: 'FontAwesome5', 
    name: 'shopping-bag', 
    color: '#0066cc',
    size: 64 
  },
  'favicon': { 
    component: 'FontAwesome5', 
    name: 'store-alt', 
    color: '#0066cc',
    size: 32 
  },
  
  // Logo et images d'onboarding
  'logo': { 
    component: 'MaterialCommunityIcons', 
    name: 'shopping', 
    color: '#0066cc',
    size: 64 
  },
  'onboarding1': { 
    component: 'FontAwesome5', 
    name: 'store', 
    color: '#0066cc',
    size: 64 
  },
  'onboarding2': { 
    component: 'MaterialCommunityIcons', 
    name: 'account-cash', 
    color: '#0066cc',
    size: 64 
  },
  'onboarding3': { 
    component: 'MaterialIcons', 
    name: 'analytics', 
    color: '#0066cc',
    size: 64 
  },
  
  // Fallback par défaut pour les images non mappées
  'default': { 
    component: 'MaterialCommunityIcons', 
    name: 'image-off', 
    color: '#F44336',
    size: 48 
  }
};

/**
 * Récupère la configuration d'icône pour un nom d'image
 * @param imageName Nom ou chemin de l'image à mapper vers un icône natif
 * @returns Configuration de l'icône natif à utiliser
 */
export const getIconForImage = (imageName) => {
  // Essayer d'extraire le nom de base sans extension ni chemin
  let baseName = '';
  
  if (typeof imageName === 'string') {
    baseName = imageName
      .replace(/^.*[\\/]/, '') // Supprime le chemin
      .replace(/\.(png|jpg|svg|gif)$/, ''); // Supprime l'extension
  } else if (imageName && imageName.uri) {
    baseName = imageName.uri
      .replace(/^.*[\\/]/, '')
      .replace(/\.(png|jpg|svg|gif)$/, '');
  }
  
  // Rechercher dans les mappings
  const iconConfig = ICON_MAPPINGS[baseName] || ICON_MAPPINGS.default;
  
  logger.debug(`[IconUtils] Image "${baseName}" mappée vers icône: ${iconConfig.component}/${iconConfig.name}`);
  return iconConfig;
};

/**
 * Obtient le composant d'icône à partir de son nom
 * @param componentName Nom du composant d'icône (ex: 'MaterialCommunityIcons')
 * @returns Le composant d'icône correspondant
 */
export const getIconComponent = (componentName) => {
  switch (componentName) {
    case 'MaterialCommunityIcons':
      return MaterialCommunityIcons;
    case 'MaterialIcons':
      return MaterialIcons;
    case 'FontAwesome5':
      return FontAwesome5;
    default:
      return MaterialCommunityIcons;
  }
};