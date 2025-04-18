import React, { ReactNode } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import useOrientation from '../../hooks/useOrientation';
import AdaptiveGrid from './AdaptiveGrid';

interface AdaptiveFormProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  portraitColumns?: number;
  landscapeColumns?: number;
}

/**
 * Composant de formulaire adaptatif qui s'ajuste automatiquement selon l'orientation
 * Organise les champs de saisie différemment en mode portrait et paysage
 */
const AdaptiveForm: React.FC<AdaptiveFormProps> = ({
  children,
  header,
  footer,
  portraitColumns = 1,
  landscapeColumns = 2,
}) => {
  const { isLandscape, dimensions } = useOrientation();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isLandscape && styles.landscapeScrollContent
        ]}
      >
        {header && <View style={styles.header}>{header}</View>}
        
        <AdaptiveGrid
          style={styles.formContainer}
          portraitColumns={portraitColumns}
          landscapeColumns={landscapeColumns}
          spacing={isLandscape ? 12 : 16}
        >
          {children}
        </AdaptiveGrid>
        
        {footer && (
          <View style={[
            styles.footer,
            isLandscape && styles.landscapeFooter
          ]}>
            {footer}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  landscapeScrollContent: {
    padding: 12,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  formContainer: {
    flex: 1,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  landscapeFooter: {
    marginTop: 16,
  },
});

export default AdaptiveForm;