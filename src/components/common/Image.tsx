import React, { useState } from 'react';
import { Image as RNImage, ImageProps, ImageErrorEventData, NativeSyntheticEvent } from 'react-native';
import NativeIcon from './NativeIcon';
import logger from '../../utils/logger';

/**
 * Composant Image personnalisé qui utilise des icônes natifs en cas d'échec de chargement
 * Remplace automatiquement les images problématiques par des icônes pour éviter les erreurs Jimp
 */
const Image = (props: ImageProps) => {
  const { source, style, ...otherProps } = props;
  const [hasError, setHasError] = useState(false);
  
  // En mode développement ou en cas d'erreur, utiliser l'icône natif
  if (__DEV__ || hasError) {
    return <NativeIcon source={source} style={style} {...otherProps} />;
  }
  
  // En production, essayer d'utiliser l'image normale avec un fallback vers l'icône
  const handleError = (e: NativeSyntheticEvent<ImageErrorEventData>) => {
    logger.warn(`[Image] Erreur de chargement pour l'image:`, source);
    setHasError(true);
  };
  
  return <RNImage source={source} style={style} onError={handleError} {...otherProps} />;
};

export default Image;