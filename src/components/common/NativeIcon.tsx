import React from 'react';
import { View, StyleSheet } from 'react-native';
import { getIconForImage, getIconComponent } from '../../utils/iconUtils';

/**
 * Composant pour remplacer les images par des icônes natifs
 * Résout le problème "Could not find MIME for Buffer <null>" de Jimp
 */
const NativeIcon = ({ 
  source, 
  style = {}, 
  size: propSize,
  color: propColor,
  ...otherProps 
}) => {
  // Obtenir la configuration d'icône basée sur la source d'image
  const { component, name, color, size } = getIconForImage(source);
  
  // Récupérer le composant d'icône approprié
  const IconComponent = getIconComponent(component);
  
  // Utiliser la taille et la couleur passées en props ou les valeurs par défaut
  const finalSize = propSize || size;
  const finalColor = propColor || color;
  
  return (
    <View style={[styles.container, style]}>
      <IconComponent name={name} size={finalSize} color={finalColor} {...otherProps} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NativeIcon;