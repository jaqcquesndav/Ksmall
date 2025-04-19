import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, List, RadioButton, Button, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import AppHeader from '../../components/common/AppHeader';
import { changeLanguage } from '../../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageSettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  useEffect(() => {
    const getCurrentLanguage = async () => {
      try {
        const storedLang = await AsyncStorage.getItem('user-language');
        if (storedLang) {
          setSelectedLanguage(storedLang);
        }
      } catch (error) {
        console.log('Erreur lors de la récupération de la langue:', error);
      }
    };

    getCurrentLanguage();
  }, []);

  const handleLanguageChange = async (language: string) => {
    setSelectedLanguage(language);
    const success = await changeLanguage(language);
    
    if (success) {
      Alert.alert(
        t('language_changed'),
        t('language_change_note'),
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        t('language_change_failed'),
        t('error_message'),
        [{ text: 'OK' }]
      );
    }
  };

  const languages = [
    { code: 'fr', name: 'Français', icon: 'flag-france' },
    { code: 'en', name: 'English', icon: 'flag-uk' },
    { code: 'sw', name: 'Kiswahili', icon: 'flag-tanzania' },
    { code: 'ln', name: 'Lingala', icon: 'flag-congo' }
  ];

  return (
    <View style={styles.container}>
      <AppHeader
        title={t('language_settings')}
        showBack
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.description}>
              {t('language_settings_description')}
            </Text>
            
            <RadioButton.Group
              onValueChange={handleLanguageChange}
              value={selectedLanguage}
            >
              {languages.map(lang => (
                <List.Item
                  key={lang.code}
                  title={lang.name}
                  left={props => (
                    <RadioButton {...props} value={lang.code} />
                  )}
                  onPress={() => handleLanguageChange(lang.code)}
                  style={styles.languageItem}
                />
              ))}
            </RadioButton.Group>
            
            <Text style={styles.note}>
              {t('language_change_note')}
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 16,
    fontSize: 14,
    color: '#666',
  },
  languageItem: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  note: {
    marginTop: 16,
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666',
  },
});

export default LanguageSettingsScreen;