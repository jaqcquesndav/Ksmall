import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { paperTheme, navigationTheme } from './theme/theme';
import { AuthProvider } from './context/AuthContext';
import { DatabaseProvider } from './context/DatabaseContext';
import AppNavigator from './navigation/AppNavigator';
import './i18n';  // Import des traductions
import { useTranslation } from 'react-i18next';

const App: React.FC = () => {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    // S'assurer que la langue est bien configurée au démarrage
    i18n.changeLanguage('fr');
  }, []);

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar 
          backgroundColor={paperTheme.colors.surface}
          barStyle="dark-content" 
        />
        <AuthProvider>
          <DatabaseProvider>
            <AppNavigator />
          </DatabaseProvider>
        </AuthProvider>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App;