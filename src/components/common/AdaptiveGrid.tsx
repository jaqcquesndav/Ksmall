import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import useOrientation from '../../hooks/useOrientation';

interface AdaptiveGridProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  portraitColumns?: number;
  landscapeColumns?: number;
  spacing?: number;
}

/**
 * Grille adaptative qui change le nombre de colonnes en fonction de l'orientation de l'écran
 * Utile pour les listes, les tableaux de bord et les formulaires complexes
 */
const AdaptiveGrid: React.FC<AdaptiveGridProps> = ({
  children,
  style,
  portraitColumns = 1,
  landscapeColumns = 2,
  spacing = 16,
}) => {
  const { isLandscape, dimensions } = useOrientation();
  
  // Déterminer le nombre de colonnes en fonction de l'orientation
  const columns = isLandscape ? landscapeColumns : portraitColumns;
  
  // Convertir les enfants en tableau pour pouvoir les traiter
  const childrenArray = React.Children.toArray(children);
  
  // Calculer la largeur des éléments en fonction du nombre de colonnes
  const itemWidth = (dimensions.width - (spacing * (columns + 1))) / columns;
  
  // Diviser les enfants en rangées
  const rows = [];
  for (let i = 0; i < childrenArray.length; i += columns) {
    const rowItems = childrenArray.slice(i, i + columns);
    rows.push(rowItems);
  }
  
  return (
    <View style={[styles.container, style, { padding: spacing / 2 }]}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((item, itemIndex) => (
            <View 
              key={`item-${rowIndex}-${itemIndex}`} 
              style={[
                styles.item, 
                { 
                  width: itemWidth,
                  margin: spacing / 2 
                }
              ]}
            >
              {item}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    // La largeur est calculée dynamiquement
  },
});

export default AdaptiveGrid;