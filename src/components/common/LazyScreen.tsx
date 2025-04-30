import React, { Suspense, lazy, ComponentType } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface LazyScreenProps {
  factory: () => Promise<{ default: ComponentType<any> }>;
  props?: Record<string, any>;
  loadingMessage?: string;
}

/**
 * Composant pour charger les écrans de manière différée
 * Cela permet d'améliorer les performances en chargeant les composants à la demande
 */
const LazyScreen: React.FC<LazyScreenProps> = ({ 
  factory, 
  props = {}, 
  loadingMessage = 'Chargement...' 
}) => {
  const Component = lazy(factory);
  const theme = useTheme();

  return (
    <Suspense 
      fallback={
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{loadingMessage}</Text>
        </View>
      }
    >
      <Component {...props} />
    </Suspense>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
});

export default LazyScreen;