import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'transaction' | 'system' | 'reminder' | 'alert';
  read: boolean;
  timestamp: Date;
}

const NotificationsScreen = () => {
  const { theme } = useContext(ThemeContext);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    // Simulating API call to fetch notifications
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    setTimeout(() => {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Paiement reçu',
          message: 'Vous avez reçu un paiement de 75.000 XAF via Orange Money.',
          type: 'transaction',
          read: false,
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        },
        {
          id: '2',
          title: 'Rappel d\'échéance',
          message: 'La facture #INV-2023-045 est à échéance demain.',
          type: 'reminder',
          read: false,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        },
        {
          id: '3',
          title: 'Mise à jour système',
          message: 'KSmall a été mis à jour vers la version 1.0.2. Découvrez les nouvelles fonctionnalités.',
          type: 'system',
          read: true,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        },
        {
          id: '4',
          title: 'Stock faible',
          message: 'Le produit "Cahier 100 pages" a atteint son seuil minimal de stock.',
          type: 'alert',
          read: true,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        },
        {
          id: '5',
          title: 'Écriture validée',
          message: 'L\'écriture comptable #JE-2023-128 a été validée avec succès.',
          type: 'system',
          read: true,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
        },
      ];

      setNotifications(mockNotifications);
      setIsLoading(false);
    }, 1000);
  };

  const markAsRead = (id: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.filter(notification => notification.id !== id)
    );
  };

  const getFilteredNotifications = () => {
    if (activeTab === 'all') {
      return notifications;
    } else {
      return notifications.filter(notification => notification.type === activeTab);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return { name: 'cash-outline', color: theme.colors.success, backgroundColor: theme.colors.success + '20' };
      case 'reminder':
        return { name: 'alarm-outline', color: theme.colors.warning, backgroundColor: theme.colors.warning + '20' };
      case 'system':
        return { name: 'information-circle-outline', color: theme.colors.primary, backgroundColor: theme.colors.primary + '20' };
      case 'alert':
        return { name: 'alert-circle-outline', color: theme.colors.error, backgroundColor: theme.colors.error + '20' };
      default:
        return { name: 'notifications-outline', color: theme.colors.text, backgroundColor: theme.colors.text + '20' };
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} h`;
    } else {
      return `Il y a ${diffDays} j`;
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item.type);
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          { backgroundColor: theme.colors.card },
          !item.read && { borderLeftWidth: 3, borderLeftColor: theme.colors.primary }
        ]}
        onPress={() => markAsRead(item.id)}
      >
        <View style={[styles.iconContainer, { backgroundColor: icon.backgroundColor }]}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>
        
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
              {item.title}
            </Text>
            <Text style={[styles.notificationTime, { color: theme.colors.text + '80' }]}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
          
          <Text 
            style={[
              styles.notificationMessage, 
              { color: theme.colors.text + '99' },
              !item.read && { color: theme.colors.text }
            ]}
            numberOfLines={2}
          >
            {item.message}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => deleteNotification(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderTabButton = (title: string, tabKey: string) => {
    const isActive = activeTab === tabKey;
    return (
      <TouchableOpacity
        style={[
          styles.tabButton,
          isActive && [styles.activeTabButton, { borderBottomColor: theme.colors.primary }]
        ]}
        onPress={() => setActiveTab(tabKey)}
      >
        <Text 
          style={[
            styles.tabButtonText, 
            { color: isActive ? theme.colors.primary : theme.colors.text + '80' }
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notifications</Text>
        
        <TouchableOpacity 
          style={styles.markAllReadButton} 
          onPress={markAllAsRead}
        >
          <Text style={{ color: theme.colors.primary }}>Tout marquer comme lu</Text>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.tabsContainer, { borderBottomColor: theme.colors.border }]}>
        {renderTabButton('Tout', 'all')}
        {renderTabButton('Transactions', 'transaction')}
        {renderTabButton('Rappels', 'reminder')}
        {renderTabButton('Système', 'system')}
        {renderTabButton('Alertes', 'alert')}
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Chargement des notifications...
          </Text>
        </View>
      ) : getFilteredNotifications().length > 0 ? (
        <FlatList
          data={getFilteredNotifications()}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Image 
            source={require('../../../assets/empty-notifications.png')} 
            style={styles.emptyImage}
            resizeMode="contain"
          />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            Pas de notifications
          </Text>
          <Text style={[styles.emptyMessage, { color: theme.colors.text + '80' }]}>
            Vous n'avez pas de notifications {activeTab !== 'all' ? 'dans cette catégorie' : ''} pour le moment.
          </Text>
        </View>
      )}
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
  markAllReadButton: {
    padding: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 10,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  listContainer: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: 12,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 5,
  },
  separator: {
    height: 1,
    marginLeft: 72,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
