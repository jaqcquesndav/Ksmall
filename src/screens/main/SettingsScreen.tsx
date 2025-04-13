import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

const SettingsScreen = () => {
  const { theme, toggleTheme, setThemeMode } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);
  
  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const [notifications, setNotifications] = React.useState(true);
  const [biometricAuth, setBiometricAuth] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(theme.dark);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          onPress: () => logout(),
          style: 'destructive',
        },
      ]
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleThemeToggle = (value: boolean) => {
    setDarkMode(value);
    setThemeMode(value ? 'dark' : 'light');
  };

  const handleBiometricToggle = (value: boolean) => {
    setBiometricAuth(value);
    // Here you would normally implement actual biometric authentication setup
  };

  const SettingsItem = ({ icon, title, onPress, showArrow = true, rightComponent }) => (
    <TouchableOpacity
      style={[styles.settingsItem, { borderBottomColor: theme.colors.border }]}
      onPress={onPress}
    >
      <View style={styles.settingsItemLeft}>
        <Ionicons name={icon} size={22} color={theme.colors.primary} style={styles.itemIcon} />
        <Text style={[styles.itemText, { color: theme.colors.text }]}>{title}</Text>
      </View>
      {rightComponent ? (
        rightComponent
      ) : (
        showArrow && <Ionicons name="chevron-forward" size={18} color={theme.colors.text + '80'} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Paramètres</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={[styles.profileSection, { backgroundColor: theme.colors.card }]}>
          <TouchableOpacity onPress={pickImage} style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.colors.primary + '40' }]}>
                <Ionicons name="person" size={40} color={theme.colors.primary} />
              </View>
            )}
            <View style={styles.editIconContainer}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.profileName, { color: theme.colors.text }]}>{user?.name || 'Utilisateur'}</Text>
          <Text style={[styles.businessName, { color: theme.colors.text + '99' }]}>{user?.businessName || 'Entreprise'}</Text>
          
          <TouchableOpacity 
            style={[styles.editProfileButton, { backgroundColor: theme.colors.primary + '20' }]}
            onPress={() => console.log('Edit profile')}
          >
            <Text style={{ color: theme.colors.primary }}>Éditer profil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Compte</Text>
          
          <View style={[styles.settingsGroup, { backgroundColor: theme.colors.card }]}>
            <SettingsItem 
              icon="person-outline" 
              title="Mon profil" 
              onPress={() => console.log('My profile')}
            />
            <SettingsItem 
              icon="business-outline" 
              title="Mon entreprise" 
              onPress={() => console.log('My business')}
            />
            <SettingsItem 
              icon="people-outline" 
              title="Utilisateurs" 
              onPress={() => console.log('Users')}
            />
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Configuration financière</Text>
          
          <View style={[styles.settingsGroup, { backgroundColor: theme.colors.card }]}>
            <SettingsItem 
              icon="card-outline" 
              title="Modes de paiement" 
              onPress={() => console.log('Payment methods')}
            />
            <SettingsItem 
              icon="phone-portrait-outline" 
              title="Mobile Money" 
              onPress={() => console.log('Mobile Money')}
            />
            <SettingsItem 
              icon="business-outline" 
              title="Banques" 
              onPress={() => console.log('Banks')}
            />
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Apparence et préférences</Text>
          
          <View style={[styles.settingsGroup, { backgroundColor: theme.colors.card }]}>
            <SettingsItem 
              icon="moon-outline" 
              title="Mode sombre" 
              showArrow={false}
              rightComponent={
                <Switch
                  value={darkMode}
                  onValueChange={handleThemeToggle}
                  trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
                  thumbColor={darkMode ? theme.colors.primary : '#f4f3f4'}
                />
              }
              onPress={() => handleThemeToggle(!darkMode)}
            />
            <SettingsItem 
              icon="notifications-outline" 
              title="Notifications" 
              showArrow={false}
              rightComponent={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
                  thumbColor={notifications ? theme.colors.primary : '#f4f3f4'}
                />
              }
              onPress={() => setNotifications(!notifications)}
            />
            <SettingsItem 
              icon="language-outline" 
              title="Langue" 
              onPress={() => console.log('Language')}
            />
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Sécurité</Text>
          
          <View style={[styles.settingsGroup, { backgroundColor: theme.colors.card }]}>
            <SettingsItem 
              icon="lock-closed-outline" 
              title="Mot de passe" 
              onPress={() => console.log('Password')}
            />
            <SettingsItem 
              icon="finger-print-outline" 
              title="Authentification biométrique" 
              showArrow={false}
              rightComponent={
                <Switch
                  value={biometricAuth}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
                  thumbColor={biometricAuth ? theme.colors.primary : '#f4f3f4'}
                />
              }
              onPress={() => handleBiometricToggle(!biometricAuth)}
            />
            <SettingsItem 
              icon="shield-checkmark-outline" 
              title="Authentification à deux facteurs" 
              onPress={() => console.log('2FA')}
            />
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Aide et contact</Text>
          
          <View style={[styles.settingsGroup, { backgroundColor: theme.colors.card }]}>
            <SettingsItem 
              icon="help-circle-outline" 
              title="Aide et support" 
              onPress={() => console.log('Help')}
            />
            <SettingsItem 
              icon="information-circle-outline" 
              title="À propos" 
              onPress={() => console.log('About')}
            />
            <SettingsItem 
              icon="document-text-outline" 
              title="Conditions d'utilisation" 
              onPress={() => console.log('Terms')}
            />
            <SettingsItem 
              icon="shield-outline" 
              title="Politique de confidentialité" 
              onPress={() => console.log('Privacy')}
            />
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Configuration SYSCOHADA</Text>
          
          <View style={[styles.settingsGroup, { backgroundColor: theme.colors.card }]}>
            <SettingsItem 
              icon="list-outline" 
              title="Plan comptable" 
              onPress={() => console.log('Chart of Accounts')}
            />
            <SettingsItem 
              icon="calendar-outline" 
              title="Exercice fiscal" 
              onPress={() => console.log('Fiscal Year')}
            />
            <SettingsItem 
              icon="options-outline" 
              title="Options comptables" 
              onPress={() => console.log('Accounting Options')}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.logoutButton, { borderColor: theme.colors.error }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color={theme.colors.error} />
          <Text style={{ color: theme.colors.error, fontSize: 16, marginLeft: 8 }}>Déconnexion</Text>
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={{ color: theme.colors.text + '80', textAlign: 'center' }}>
            KSmall v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    margin: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 14,
    marginBottom: 16,
  },
  editProfileButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
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
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  versionContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
});

export default SettingsScreen;
