import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, useTheme, Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MainTabsParamList } from './types';
import { useTranslation } from 'react-i18next';

interface TabRoute {
  name: keyof MainTabsParamList;
  title: string;
  iconName: string;
  component: React.ComponentType<any>;
  listeners?: any;
}

interface SidebarProps {
  tabRoutes: TabRoute[];
  currentTab: keyof MainTabsParamList;
  onChangeTab: (tabName: keyof MainTabsParamList) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ tabRoutes, currentTab, onChangeTab }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Avatar.Text 
          size={64} 
          label="KS" 
          style={styles.avatar}
          labelStyle={{ fontSize: 24 }}
        />
        <Text style={styles.appName}>KSmall</Text>
      </View>
      
      <ScrollView style={styles.navContainer}>
        {tabRoutes.map(route => (
          <TouchableOpacity
            key={route.name}
            style={[
              styles.navItem,
              currentTab === route.name && 
                { backgroundColor: theme.colors.primaryContainer }
            ]}
            onPress={() => onChangeTab(route.name)}
          >
            <Icon 
              name={route.iconName} 
              size={24} 
              color={currentTab === route.name ? theme.colors.primary : theme.colors.outline} 
            />
            <Text 
              style={[
                styles.navLabel, 
                { color: currentTab === route.name ? theme.colors.primary : theme.colors.onSurface }
              ]}
            >
              {route.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton}>
          <Icon name="help-circle-outline" size={20} color={theme.colors.outline} />
          <Text style={[styles.footerText, { color: theme.colors.outline }]}>{t('help')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.footerButton}>
          <Icon name="information-outline" size={20} color={theme.colors.outline} />
          <Text style={[styles.footerText, { color: theme.colors.outline }]}>{t('about')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 280,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    marginBottom: 16,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  navContainer: {
    flex: 1,
    paddingTop: 16,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 24,
    marginBottom: 4,
  },
  navLabel: {
    marginLeft: 24,
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerText: {
    marginLeft: 12,
    fontSize: 14,
  }
});

export default Sidebar;