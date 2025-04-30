import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SettingsItemProps } from '../../types/settings';

const SettingsItem: React.FC<SettingsItemProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  value,
  showChevron = true,
  disabled = false,
}) => {
  const theme = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface }
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={disabled ? theme.colors.surfaceDisabled : theme.colors.primary}
        />
      </View>
      
      <View style={styles.contentContainer}>
        <Text 
          style={[
            styles.title,
            { color: disabled ? theme.colors.surfaceDisabled : theme.colors.onSurface }
          ]}
        >
          {title}
        </Text>
        
        {subtitle && (
          <Text 
            style={[
              styles.subtitle,
              { color: theme.colors.onSurfaceVariant }
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
      
      {value && (
        <Text
          style={[
            styles.value,
            { color: theme.colors.onSurfaceVariant }
          ]}
        >
          {value}
        </Text>
      )}
      
      {showChevron && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={theme.colors.onSurfaceVariant}
          style={styles.chevron}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  iconContainer: {
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  value: {
    fontSize: 14,
    marginRight: 8,
  },
  chevron: {
    marginLeft: 8,
  },
});

export default SettingsItem;
