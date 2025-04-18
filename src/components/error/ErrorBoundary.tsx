import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';
import logger from '../../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Composant ErrorBoundary qui permet de capturer les erreurs dans ses enfants
 * et d'afficher une interface utilisateur de secours au lieu de planter l'application.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Mettre à jour l'état pour que le prochain rendu affiche l'UI de secours
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Vous pouvez aussi enregistrer l'erreur dans un service de reporting
    this.setState({ errorInfo });
    logger.error('ErrorBoundary caught an error', { error, errorInfo });
  }

  handleRestart = () => {
    // Solution simple sans dépendance à expo-updates
    logger.info('Attempting to restart the app state');
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  handleContinueInDemoMode = () => {
    // Réinitialiser l'état de l'erreur et continuer avec l'application
    if (typeof global !== 'undefined') {
      // @ts-ignore
      global.__DEMO_MODE__ = true;
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      // Afficher l'UI de secours
      return this.props.fallback || (
        <View style={styles.container}>
          <Text style={styles.title}>Une erreur est survenue</Text>
          
          <Text style={styles.description}>
            Notre application a rencontré un problème. Vous pouvez essayer de redémarrer l'application ou continuer en mode démo.
          </Text>
          
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {this.state.error?.toString() || 'Erreur inconnue'}
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button mode="contained" onPress={this.handleRestart} style={styles.button}>
              Redémarrer l'application
            </Button>
            
            <Button mode="outlined" onPress={this.handleContinueInDemoMode} style={styles.button}>
              Continuer en mode démo
            </Button>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#E53935',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  errorContainer: {
    padding: 15,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    marginBottom: 30,
    width: '100%',
  },
  errorText: {
    color: '#C62828',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    marginBottom: 15,
  }
});