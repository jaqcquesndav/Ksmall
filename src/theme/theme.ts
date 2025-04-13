import { MD3LightTheme } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { Platform } from 'react-native';

// Définition de notre palette de couleurs basée sur les variables CSS
const colors = {
  // Couleurs principales
  primary: '#197ca8',
  primaryContainer: '#e0f2fe',
  onPrimaryContainer: '#0c4a6e',
  
  // Couleurs secondaires et d'accent
  secondary: '#1e90c3',
  secondaryContainer: '#bae6fd',
  
  // Couleurs de succès
  success: '#015730',
  successContainer: '#dcfce7', 
  onSuccessContainer: '#14532d',
  
  // Couleurs d'avertissement
  warning: '#ee872b',
  warningContainer: '#ffedd5',
  onWarningContainer: '#7c2d12',
  
  // Couleurs d'erreur
  error: '#dc2626',
  errorContainer: '#fef2f2',
  onErrorContainer: '#7f1d1d',
  
  // Échelle de gris
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceVariant: '#f1f5f9',
  outline: '#cbd5e1',
  
  // Couleurs de texte
  onBackground: '#0f172a',
  onSurface: '#1e293b',
  onSurfaceVariant: '#475569',
  onSurfaceDisabled: '#94a3b8',
};

// Configuration des polices avec les propriétés MD3 appropriées
const fontConfig = {
  displayLarge: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  displayMedium: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  displaySmall: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  headlineLarge: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  titleLarge: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as const,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
  bodyLarge: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0.15,
  },
  bodyMedium: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
  },
  labelLarge: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
};

// Espacements
export const spacing = {
  xs: 4, // équivalent 0.5rem
  sm: 8, // équivalent 1rem
  md: 16, // équivalent 1.5rem
  lg: 24, // équivalent 2rem
  xl: 32, // équivalent 3rem
};

// Rayons de bordure
export const borderRadius = {
  sm: 4, // équivalent 0.25rem
  md: 8, // équivalent 0.5rem
  lg: 16, // équivalent 1rem
  xl: 24, // équivalent 1.5rem
  full: 9999, // équivalent 9999px
};

// Créer le thème personnalisé en étendant le thème Paper par défaut
export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...colors,
  },
  fonts: fontConfig,
  roundness: borderRadius.md,
};

// Étendre le thème de navigation pour correspondre à notre palette de couleurs
export const navigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.onSurface,
    border: colors.outline,
  },
};

// Styles communs qui peuvent être réutilisés dans toute l'application
export const commonStyles = {
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderColor: colors.outline,
    borderWidth: 1,
    elevation: 2,
    shadowColor: colors.onSurfaceVariant,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHover: {
    elevation: 4,
    shadowOpacity: 0.1,
  },
  section: {
    marginBottom: spacing.lg,
  },
  heading1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.onBackground,
    lineHeight: 34,
  },
  heading2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.onBackground,
    lineHeight: 30,
  },
  heading3: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.onBackground,
    lineHeight: 26,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.onSurfaceVariant,
  },
  button: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSuccess: {
    backgroundColor: colors.success,
  },
  buttonWarning: {
    backgroundColor: colors.warning,
  },
};

export default {
  paperTheme,
  navigationTheme,
  colors,
  spacing,
  borderRadius,
  commonStyles,
};
