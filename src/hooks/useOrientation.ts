import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

/**
 * Hook personnalisé pour détecter l'orientation de l'écran et réagir aux changements
 * @returns {object} Objet contenant l'orientation actuelle et les dimensions de l'écran
 */
export const useOrientation = () => {
  // Fonction pour déterminer l'orientation actuelle de l'écran
  const getOrientation = () => {
    const { width, height } = Dimensions.get('window');
    return width > height ? 'landscape' : 'portrait';
  };

  // Initialisation des états
  const [screenOrientation, setScreenOrientation] = useState(getOrientation());
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    // Fonction de callback pour mettre à jour l'orientation et les dimensions
    const onChange = ({ window }) => {
      setDimensions(window);
      setScreenOrientation(window.width > window.height ? 'landscape' : 'portrait');
    };

    // Abonnement aux événements de changement de dimensions
    const subscription = Dimensions.addEventListener('change', onChange);

    // Nettoyage lors du démontage du composant
    return () => subscription.remove();
  }, []);

  return {
    orientation: screenOrientation,
    dimensions,
    isLandscape: screenOrientation === 'landscape',
    isPortrait: screenOrientation === 'portrait',
  };
};

export default useOrientation;