import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Appbar, Card, Text, IconButton, Divider, FAB, Menu, useTheme, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import NotificationService, { Notification } from '../../services/NotificationService';
import { formatDistanceToNow } from 'date-fns';
import AppHeader from '../../components/common/AppHeader';

const NotificationsScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await NotificationService.getAllNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Load notifications when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };
  
  const handleMarkAsRead = async (id: string) => {
    await NotificationService.markAsRead(id);
    fetchNotifications();
  };
  
  const handleMarkAllAsRead = async () => {
    await NotificationService.markAllAsRead();
    fetchNotifications();
  };
  
  const handleDeleteNotification = async (id: string) => {
    await NotificationService.deleteNotification(id);
    fetchNotifications();
  };
  
  const handleClearAll = async () => {
    await NotificationService.clearAllNotifications();
    fetchNotifications();
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transaction': return 'cash';
      case 'system': return 'cog';
      case 'alert': return 'alert-circle';
      case 'message': return 'message';
      default: return 'bell';
    }
  };
  
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'transaction': return '#4CAF50'; // Green
      case 'system': return '#2196F3'; // Blue
      case 'alert': return '#FF9800'; // Orange
      case 'message': return '#9C27B0'; // Purple
      default: return theme.colors.primary;
    }
  };
  
  const renderNotification = ({ item }: { item: Notification }) => {
    const formattedTime = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
    
    return (
      <Card 
        style={[
          styles.notificationCard,
          !item.read && styles.unreadCard
        ]}
        onPress={() => handleMarkAsRead(item.id)}
      >
        <Card.Content style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) }]}>
            <IconButton 
              icon={getNotificationIcon(item.type)} 
              iconColor="#fff" 
              size={20} 
            />
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
            <Text style={styles.timestamp}>{formattedTime}</Text>
          </View>
          <IconButton 
            icon="dots-vertical" 
            onPress={() => {
              setSelectedNotification(item.id);
              setMenuVisible(true);
            }}
          />
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        title={t('notifications')} 
        showNotifications={false}
        rightAction={
          <Menu
            visible={menuVisible && !selectedNotification}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Appbar.Action 
                icon="dots-vertical" 
                onPress={() => {
                  setSelectedNotification(null);
                  setMenuVisible(true);
                }}
              />
            }
          >
            <Menu.Item 
              leadingIcon="check-all" 
              onPress={() => {
                handleMarkAllAsRead();
                setMenuVisible(false);
              }} 
              title={t('mark_all_as_read')}
            />
            <Menu.Item 
              leadingIcon="delete-sweep" 
              onPress={() => {
                handleClearAll();
                setMenuVisible(false);
              }} 
              title={t('clear_all')}
            />
          </Menu>
        }
      />
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]} 
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconButton icon="bell-off" size={64} iconColor={theme.colors.primary} />
              <Text style={styles.emptyText}>{t('no_notifications')}</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
      
      <Menu
        visible={menuVisible && !!selectedNotification}
        onDismiss={() => {
          setMenuVisible(false);
          setSelectedNotification(null);
        }}
        anchor={{ x: 0, y: 0 }}
      >
        <Menu.Item 
          leadingIcon="check" 
          onPress={() => {
            if (selectedNotification) {
              handleMarkAsRead(selectedNotification);
            }
            setMenuVisible(false);
            setSelectedNotification(null);
          }} 
          title={t('mark_as_read')}
        />
        <Menu.Item 
          leadingIcon="delete" 
          onPress={() => {
            if (selectedNotification) {
              handleDeleteNotification(selectedNotification);
            }
            setMenuVisible(false);
            setSelectedNotification(null);
          }} 
          title={t('delete')}
        />
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  notificationCard: {
    marginBottom: 0,
    elevation: 1,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#6200EE',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    borderRadius: 20,
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
