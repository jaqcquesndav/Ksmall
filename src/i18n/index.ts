import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import des fichiers de traduction
import fr from './locales/fr.json';
import en from './locales/en.json';

// Détection de la langue du système mais avec le français comme langue par défaut
const getDefaultLanguage = () => {
  try {
    // Forcer le français comme langue par défaut, même si le système est en anglais
    return 'fr';
  } catch (error) {
    console.log('Erreur lors de la détection de la langue:', error);
    return 'fr'; // Fallback au français en cas d'erreur
  }
};

// Fonction pour initialiser et configurer i18next
const setupI18n = async () => {
  // Essayer de récupérer la langue stockée
  let selectedLanguage;
  try {
    selectedLanguage = await AsyncStorage.getItem('user-language');
  } catch (error) {
    console.log('Erreur lors de la récupération de la langue:', error);
  }

  // Si pas de langue stockée, utiliser le français par défaut
  const language = selectedLanguage || getDefaultLanguage();

  // Configuration d'i18n
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        fr: {
          translation: fr,
        },
        en: {
          translation: en,
        },
      },
      lng: language,
      fallbackLng: 'fr',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

  return i18n;
};

// Fonction pour changer la langue
export const changeLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem('user-language', language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.log('Erreur lors du changement de langue:', error);
  }
};

// Initialiser i18n
setupI18n();

export default i18n;
