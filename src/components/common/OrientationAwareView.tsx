import React, { ReactNode } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import useOrientation from '../../hooks/useOrientation';

interface OrientationAwareViewProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  portraitStyle?: StyleProp<ViewStyle>;
  landscapeStyle?: StyleProp<ViewStyle>;
  onOrientationChange?: (isLandscape: boolean) => void;
}

/**
 * Composant qui s'ajuste automatiquement en fonction de l'orientation de l'écran
 * Permet de définir des styles différents pour les modes portrait et paysage
 */
const OrientationAwareView: React.FC<OrientationAwareViewProps> = ({
  children,
  style,
  portraitStyle,
  landscapeStyle,
  onOrientationChange,
}) => {
  const { isLandscape, orientation } = useOrientation();

  // Appeler le callback si fourni lorsque l'orientation change
  React.useEffect(() => {
    if (onOrientationChange) {
      onOrientationChange(isLandscape);
    }
  }, [orientation, onOrientationChange]);

  // Combiner les styles en fonction de l'orientation
  const orientationStyle = isLandscape ? landscapeStyle : portraitStyle;

  return (
    <View style={[styles.container, style, orientationStyle]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default OrientationAwareView;