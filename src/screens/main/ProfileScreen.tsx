import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Avatar, Text, Button, Card, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>{t('loading_profile')}</Text>
      </View>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const renderAvatar = () => {
    if (user.photoURL) {
      return <Avatar.Image size={100} source={{ uri: user.photoURL }} style={styles.avatar} />;
    } else {
      if (user.displayName) {
        return <Avatar.Text size={100} label={user.displayName.charAt(0)} style={styles.avatar} />;
      } else {
        return (
          <Avatar.Icon
            size={100}
            icon="account"
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
          />
        );
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        {renderAvatar()}
        <Text style={styles.name} children={user.displayName || t('no_name')} />
        <Text style={styles.email} children={user.email} />
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle} children={t('personal_information')} />
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel} children={`${t('email')}:`} />
          <Text style={styles.infoValue} children={user.email} />
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel} children={`${t('phone_number')}:`} />
          <Text style={styles.infoValue} children={user.phoneNumber || t('not_set')} />
        </View>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.infoLabel} children={`${t('company')}:`} />
          <Text style={styles.infoValue} children={user.company || t('not_set')} />
          <Text style={styles.infoLabel} children={`${t('role')}:`} />
          <Text style={styles.infoValue} children={user.role || t('not_set')} />
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        style={styles.button}
        onPress={() => console.log('Navigate to Edit Profile')}
        icon="pencil"
        children={t('edit_profile')}
      />

      <Button
        mode="outlined"
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
        icon="logout"
        textColor={theme.colors.error}
        children={t('logout')}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  avatar: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  infoSection: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  button: {
    margin: 16,
    marginBottom: 8,
  },
  logoutButton: {
    marginBottom: 16,
  },
});

export default ProfileScreen;
