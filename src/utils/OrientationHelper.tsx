import React, { ReactNode } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import useOrientation from '../hooks/useOrientation';
import OrientationAwareView from '../components/common/OrientationAwareView';
import AdaptiveGrid from '../components/common/AdaptiveGrid';

/**
 * Utilitaire pour faciliter l'adaptation des écrans aux orientations portrait et paysage
 * Fournit des méthodes et composants pour rendre les écrans sensibles à l'orientation
 */
class OrientationHelper {
  /**
   * Enveloppe un écran avec les composants nécessaires pour le rendre sensible à l'orientation
   * @param ScreenComponent - Le composant d'écran à adapter
   * @returns Un composant amélioré sensible à l'orientation
   */
  static withOrientationSupport(ScreenComponent: React.ComponentType<any>) {
    return (props: any) => {
      const { isLandscape, dimensions } = useOrientation();
      
      return (
        <ScreenComponent
          {...props}
          isLandscape={isLandscape}
          screenDimensions={dimensions}
          orientationHelper={OrientationHelper}
        />
      );
    };
  }

  /**
   * Crée un conteneur adaptatif avec ScrollView et KeyboardAvoidingView pour les formulaires
   */
  static createAdaptiveContainer({
    children,
    style,
    landscapeStyle,
    contentContainerStyle,
    landscapeContentContainerStyle,
    keyboardAvoiding = true
  }: {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    landscapeStyle?: StyleProp<ViewStyle>;
    contentContainerStyle?: StyleProp<ViewStyle>;
    landscapeContentContainerStyle?: StyleProp<ViewStyle>;
    keyboardAvoiding?: boolean;
  }) {
    const { isLandscape } = useOrientation();
    
    const finalContainer = (
      <ScrollView
        style={[styles.container, style, isLandscape && landscapeStyle]}
        contentContainerStyle={[
          styles.contentContainer,
          contentContainerStyle,
          isLandscape && landscapeContentContainerStyle
        ]}
        showsVerticalScrollIndicator={true}
      >
        {children}
      </ScrollView>
    );
    
    if (keyboardAvoiding) {
      return (
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          {finalContainer}
        </KeyboardAvoidingView>
      );
    }
    
    return finalContainer;
  }

  /**
   * Divise un écran en sections pour le mode paysage
   */
  static createLandscapeLayout({
    leftContent,
    rightContent,
    leftWidth = '40%',
    rightWidth = '58%',
    spacing = 16
  }: {
    leftContent: ReactNode;
    rightContent: ReactNode;
    leftWidth?: string;
    rightWidth?: string;
    spacing?: number;
  }) {
    return (
      <View style={styles.landscapeLayout}>
        <View style={[styles.landscapeColumn, { width: leftWidth, marginRight: spacing }]}>
          {leftContent}
        </View>
        <View style={[styles.landscapeColumn, { width: rightWidth }]}>
          {rightContent}
        </View>
      </View>
    );
  }

  /**
   * Crée une grille adaptative avec un nombre de colonnes différent selon l'orientation
   */
  static createAdaptiveGrid({
    children,
    portraitColumns = 1,
    landscapeColumns = 2,
    spacing = 16,
    style
  }: {
    children: ReactNode;
    portraitColumns?: number;
    landscapeColumns?: number;
    spacing?: number;
    style?: StyleProp<ViewStyle>;
  }) {
    return (
      <AdaptiveGrid
        portraitColumns={portraitColumns}
        landscapeColumns={landscapeColumns}
        spacing={spacing}
        style={style}
      >
        {children}
      </AdaptiveGrid>
    );
  }

  /**
   * Construit un style conditionnel basé sur l'orientation
   */
  static getOrientationStyle(
    baseStyle: StyleProp<ViewStyle>,
    portraitStyle: StyleProp<ViewStyle>,
    landscapeStyle: StyleProp<ViewStyle>
  ): StyleProp<ViewStyle> {
    const { isLandscape } = useOrientation();
    return [baseStyle, isLandscape ? landscapeStyle : portraitStyle];
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  landscapeLayout: {
    flexDirection: 'row',
    flex: 1,
  },
  landscapeColumn: {
    flex: 1,
  },
});

export default OrientationHelper;