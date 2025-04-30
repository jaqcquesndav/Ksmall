import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SettingsSectionProps } from '../../types/settings';

/**
 * Reusable settings section component with title and content grouping
 * @param title - Section title
 * @param theme - Theme object from ThemeContext
 * @param children - Section content (typically SettingsItems)
 */
const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  theme,
  children,
}) => {
  return (
    <View style={styles.settingsSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      <View style={[styles.settingsGroup, { backgroundColor: theme.colors.card }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  settingsSection: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  settingsGroup: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default SettingsSection;
