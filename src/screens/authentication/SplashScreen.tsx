import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '../../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import logoImage from '../../../assets/logo.png';

const SplashScreen = () => {
  const navigation = useNavigation();
  const { theme } = useThemeContext();

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.secondary]}
      style={styles.container}
    >
      <StatusBar style="light" />
      <Image 
        source={logoImage} 
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>KSmall</Text>
      <Text style={styles.subtitle}>
        La solution intelligente pour les petites entreprises en Afrique
      </Text>
      
      <View style={styles.features}>
        <Text style={styles.featureText}>• Assistant IA pour votre business</Text>
        <Text style={styles.featureText}>• Gestion financière simplifiée</Text>
        <Text style={styles.featureText}>• Compatible avec les normes SYSCOHADA</Text>
        <Text style={styles.featureText}>• Intégration Mobile Money</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#FFFFFF' }]} 
          onPress={() => navigation.navigate('Login' as never)}
        >
          <Text style={[styles.buttonText, { color: theme.colors.primary }]}>Connexion</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: 'transparent', borderColor: '#FFFFFF', borderWidth: 1 }]}
          onPress={() => navigation.navigate('Signup' as never)}
        >
          <Text style={styles.buttonText}>Inscription</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  features: {
    alignSelf: 'stretch',
    marginBottom: 40,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default SplashScreen;
