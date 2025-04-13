import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Button, SafeAreaView, ScrollView } from 'react-native';
import logger from '../../utils/logger';
import { logErrorToFile } from '../../utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Mise à jour de l'état pour afficher le UI de repli
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Journalisation de l'erreur
    logger.error('Error caught by boundary:', error);
    logger.debug('Component stack:', errorInfo.componentStack);
    
    // Enregistrer dans le fichier de log
    logErrorToFile(error, `ErrorBoundary: ${errorInfo.componentStack}`);
    
    this.setState({ errorInfo });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render() {
    if (this.state.hasError) {
      // UI de repli personnalisé
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Oups ! Une erreur est survenue</Text>
            <Text style={styles.message}>{this.state.error?.message || "Erreur inconnue"}</Text>
            
            {__DEV__ && this.state.errorInfo && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>Détails techniques :</Text>
                <Text style={styles.detailsText}>
                  {this.state.errorInfo.componentStack}
                </Text>
              </View>
            )}
            
            <Button
              title="Réessayer"
              onPress={this.resetError}
            />
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#E53935'
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
    color: '#333',
    textAlign: 'center'
  },
  detailsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%'
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333'
  },
  detailsText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace'
  }
});

export default ErrorBoundary;
