import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { 
  List, 
  Text, 
  RadioButton, 
  Switch,
  Surface
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import AppHeader from '../../components/common/AppHeader';
import { useThemeContext, themeColors } from '../../context/ThemeContext';

const ThemeSettingsScreen = () => {
  const { t } = useTranslation();
  const { 
    themeType, 
    setThemeType, 
    systemTheme, 
    setSystemTheme,
    themeColor,
    setThemeColor
  } = useThemeContext();
  
  return (
    <View style={styles.container}>
      <AppHeader 
        title={t('theme_settings')} 
        showBack
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>{t('theme_mode')}</Text>
        
        <List.Item
          title={t('use_system_theme')}
          description={t('system_theme_description')}
          right={() => (
            <Switch 
              value={systemTheme} 
              onValueChange={(value) => setSystemTheme(value)} 
            />
          )}
        />
        
        <RadioButton.Group 
          onValueChange={(value) => setThemeType(value as 'light' | 'dark')} 
          value={themeType}
        >
          <List.Item
            title={t('light_theme')}
            description={t('light_theme_description')}
            left={props => <RadioButton {...props} value="light" disabled={systemTheme} />}
          />
          
          <List.Item
            title={t('dark_theme')}
            description={t('dark_theme_description')}
            left={props => <RadioButton {...props} value="dark" disabled={systemTheme} />}
          />
        </RadioButton.Group>
        
        <Text style={styles.sectionTitle}>{t('color_scheme')}</Text>
        
        <View style={styles.colorGrid}>
          {Object.entries(themeColors).map(([key, color]) => (
            <TouchableOpacity 
              key={key}
              onPress={() => setThemeColor(color)}
            >
              <Surface 
                style={[
                  styles.colorOption,
                  themeColor === color && { borderColor: color, borderWidth: 2 }
                ]}
              >
                <View style={[styles.colorSwatch, { backgroundColor: color }]} />
                <Text style={styles.colorLabel}>{t(key)}</Text>
              </Surface>
            </TouchableOpacity>
          ))}
        </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  colorOption: {
    width: 80,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  colorLabel: {
    fontSize: 14,
  },
});

export default ThemeSettingsScreen;
