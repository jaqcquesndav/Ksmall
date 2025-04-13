import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import DatabaseService from './DatabaseService';

// Simple EventEmitter implémentation pour React Native
class SimpleEventEmitter {
  private listeners: Record<string, Function[]> = {};

  on(event: string, callback: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: string, ...args: any[]): void {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  phoneNumber: string | null;
  photoURL: string | null;
  position: string;
  language: string;
}

class UserService {
  private eventEmitter = new SimpleEventEmitter();
  
  // Obtenir l'utilisateur actuel depuis la base de données
  async getCurrentUser(): Promise<User | null> {
    try {
      const db = await DatabaseService.getDBConnection();
      const [result] = await DatabaseService.executeQuery(
        db,
        'SELECT * FROM users WHERE is_current = 1 LIMIT 1',
        []
      );
      
      if (result?.rows?.length > 0) {
        const user = result.rows.item(0);
        return {
          id: user.id.toString(),
          displayName: user.display_name,
          email: user.email,
          phoneNumber: user.phone_number,
          photoURL: user.photo_url,
          position: user.position || '',
          language: user.language || 'fr',
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting current user', error);
      return null;
    }
  }
  
  // Mettre à jour le profil utilisateur
  async updateUserProfile(updates: Partial<User>): Promise<User | null> {
    try {
      const db = await DatabaseService.getDBConnection();
      const currentUser = await this.getCurrentUser();
      
      if (!currentUser) return null;
      
      // Construire la requête SQL
      const fields: string[] = [];
      const values: any[] = [];
      const placeholders: string[] = [];
      
      Object.entries(updates).forEach(([key, value]) => {
        // Convertir le nom de la propriété en format snake_case pour la base de données
        let dbField;
        switch (key) {
          case 'displayName':
            dbField = 'display_name';
            break;
          case 'photoURL':
            dbField = 'photo_url';
            break;
          case 'phoneNumber':
            dbField = 'phone_number';
            break;
          default:
            dbField = key.toLowerCase();
        }
        
        fields.push(dbField);
        values.push(value);
        placeholders.push('?');
      });
      
      // Ajouter l'ID utilisateur à la fin
      values.push(currentUser.id);
      
      const query = `
        UPDATE users 
        SET ${fields.map(f => `${f} = ?`).join(', ')} 
        WHERE id = ?
      `;
      
      await DatabaseService.executeQuery(db, query, values);
      
      // Obtenir l'utilisateur mis à jour
      const updatedUser = await this.getCurrentUser();
      
      // Émettre l'événement de mise à jour
      if (updatedUser) {
        this.eventEmitter.emit('userUpdated', updatedUser);
      }
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user profile', error);
      return null;
    }
  }
  
  // Mettre à jour spécifiquement l'avatar de l'utilisateur
  async updateUserAvatar(avatarUri: string): Promise<User | null> {
    try {
      // Copier l'image dans le répertoire de l'application pour la persistance
      const fileInfo = await FileSystem.getInfoAsync(avatarUri);
      let permanentUri = avatarUri;
      
      if (fileInfo.exists) {
        const fileName = `avatar_${Date.now()}.jpg`;
        const newUri = `${FileSystem.documentDirectory}images/${fileName}`;
        
        // S'assurer que le répertoire existe
        const dirInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}images`);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}images`, { intermediates: true });
        }
        
        // Copier le fichier
        await FileSystem.copyAsync({
          from: avatarUri,
          to: newUri
        });
        
        permanentUri = newUri;
      }
      
      // Mettre à jour la base de données avec le nouveau chemin d'image
      return this.updateUserProfile({ photoURL: permanentUri });
    } catch (error) {
      console.error('Error updating user avatar', error);
      return null;
    }
  }
  
  // Obtenir le nombre de notifications non lues
  async getUnreadNotificationsCount(): Promise<number> {
    try {
      const db = await DatabaseService.getDBConnection();
      const [result] = await DatabaseService.executeQuery(
        db,
        'SELECT COUNT(*) as count FROM notifications WHERE is_read = 0',
        []
      );
      
      if (result?.rows?.length > 0) {
        return result.rows.item(0).count;
      }
      return 0;
    } catch (error) {
      console.error('Error getting notifications count', error);
      return 0;
    }
  }
  
  // S'abonner aux mises à jour de l'utilisateur
  onUserUpdated(callback: (user: User) => void): () => void {
    this.eventEmitter.on('userUpdated', callback);
    return () => this.eventEmitter.off('userUpdated', callback);
  }
}

export default new UserService();
