import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import logger from '../utils/logger';
import { generateUniqueId } from '../utils/helpers';
import { Notification, NotificationListener, NOTIFICATION_TYPES } from '../types/notification';

// Mock notifications
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    title: 'New Transaction Recorded',
    body: 'Payment of $1,500 received from Client XYZ',
    data: { type: 'transaction', id: 'tx123' },
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    type: NOTIFICATION_TYPES.TRANSACTION
  },
  {
    id: 'n2',
    title: 'Inventory Alert',
    body: 'Low stock for product "Laptop HP 15" - only 2 remaining',
    data: { type: 'inventory', id: 'p1' },
    read: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    type: NOTIFICATION_TYPES.ALERT
  },
  {
    id: 'n3',
    title: 'System Update',
    body: 'KSMall has been updated to version 1.1.0',
    read: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    type: NOTIFICATION_TYPES.SYSTEM
  },
  {
    id: 'n4',
    title: 'Invoice Due Soon',
    body: 'Invoice #INV-2023-042 is due in 3 days',
    data: { type: 'invoice', id: 'inv042' },
    read: false,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    type: NOTIFICATION_TYPES.ALERT
  }
];

const STORAGE_KEY = 'ksmall_notifications';

class NotificationService {
  private listeners: NotificationListener[] = [];
  private initialized = false;

  constructor() {
    this.initializeNotifications();
  }

  async initializeNotifications() {
    if (this.initialized) return;

    try {
      logger.debug('Initializing NotificationService');
      
      // Check if we already have stored notifications
      const storedNotifications = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (!storedNotifications) {
        logger.debug('No stored notifications found, initializing with mock data');
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_NOTIFICATIONS));
      }
      
      this.initialized = true;
      logger.debug('NotificationService initialized successfully');
    } catch (error) {
      logger.error('Error initializing NotificationService', error);
    }
  }
  
  async getAllNotifications(): Promise<Notification[]> {
    try {
      await this.initializeNotifications();
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
      logger.error('Error getting notifications', error);
      return [];
    }
  }
  
  async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getAllNotifications();
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      logger.error('Error getting unread count', error);
      return 0;
    }
  }
  
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getAllNotifications();
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotifications));
      this.notifyListeners();
    } catch (error) {
      logger.error('Error marking notification as read', error);
    }
  }
  
  async markAllAsRead(): Promise<void> {
    try {
      const notifications = await this.getAllNotifications();
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotifications));
      this.notifyListeners();
    } catch (error) {
      logger.error('Error marking all notifications as read', error);
    }
  }
  
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getAllNotifications();
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotifications));
      this.notifyListeners();
    } catch (error) {
      logger.error('Error deleting notification', error);
    }
  }
  
  async clearAllNotifications(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      this.notifyListeners();
    } catch (error) {
      logger.error('Error clearing notifications', error);
    }
  }
  
  async addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<void> {
    try {
      const notifications = await this.getAllNotifications();
      
      const newNotification: Notification = {
        ...notification,
        id: generateUniqueId(),
        createdAt: new Date().toISOString(),
        read: false
      };
      
      notifications.unshift(newNotification);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
      this.notifyListeners();
    } catch (error) {
      logger.error('Error adding notification', error);
    }
  }
  
  addNotificationListener(listener: NotificationListener) {
    this.listeners.push(listener);
    return {
      remove: () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      }
    };
  }
  
  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

export default new NotificationService();
