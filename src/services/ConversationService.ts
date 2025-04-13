import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, MESSAGE_TYPES } from '../components/chat/DynamicResponseBuilder';
import { CHAT_MODES } from '../components/chat/ModeSelector';
import logger from '../utils/logger';

export interface Conversation {
  id: string;
  title: string;
  preview: string;
  mode: CHAT_MODES;
  lastUpdated: string;
  messages: Message[];
}

const STORAGE_KEY = 'ksmall_conversations';

class ConversationService {
  // Récupérer toutes les conversations
  async getConversations(): Promise<Conversation[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      logger.error('Erreur lors de la récupération des conversations', error);
      return [];
    }
  }

  // Récupérer une conversation par ID
  async getConversationById(id: string): Promise<Conversation | null> {
    try {
      const conversations = await this.getConversations();
      return conversations.find(conv => conv.id === id) || null;
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la conversation ${id}`, error);
      return null;
    }
  }

  // Créer une nouvelle conversation
  async createConversation(mode: CHAT_MODES, initialMessage?: Message): Promise<Conversation> {
    try {
      const conversations = await this.getConversations();
      const now = new Date().toISOString();
      
      const newConversation: Conversation = {
        id: `conv-${Date.now()}`,
        title: `Conversation du ${new Date().toLocaleDateString()}`,
        preview: initialMessage?.content || 'Nouvelle conversation',
        mode,
        lastUpdated: now,
        messages: initialMessage ? [initialMessage] : []
      };
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([newConversation, ...conversations]));
      return newConversation;
    } catch (error) {
      logger.error('Erreur lors de la création d\'une conversation', error);
      throw error;
    }
  }

  // Ajouter un message à une conversation
  async addMessage(conversationId: string, message: Message): Promise<void> {
    try {
      const conversations = await this.getConversations();
      const index = conversations.findIndex(conv => conv.id === conversationId);
      
      if (index === -1) {
        throw new Error(`Conversation ${conversationId} introuvable`);
      }
      
      const conversation = conversations[index];
      conversation.messages.push(message);
      conversation.preview = message.content;
      conversation.lastUpdated = new Date().toISOString();
      
      // Si c'est un message assistant et que le titre est générique, utiliser le contenu comme titre
      if (!message.isUser && conversation.title.includes('Conversation du') && message.messageType === MESSAGE_TYPES.REGULAR_CHAT) {
        const potentialTitle = message.content.slice(0, 50);
        if (potentialTitle.length > 20) {
          conversation.title = potentialTitle.endsWith('.') 
            ? potentialTitle 
            : `${potentialTitle}...`;
        }
      }
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
      logger.error(`Erreur lors de l'ajout d'un message à la conversation ${conversationId}`, error);
      throw error;
    }
  }

  // Mettre à jour une conversation (par exemple pour changer le statut d'un message)
  async updateConversation(conversation: Conversation): Promise<void> {
    try {
      const conversations = await this.getConversations();
      const index = conversations.findIndex(conv => conv.id === conversation.id);
      
      if (index === -1) {
        throw new Error(`Conversation ${conversation.id} introuvable`);
      }
      
      conversations[index] = {
        ...conversation,
        lastUpdated: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour de la conversation ${conversation.id}`, error);
      throw error;
    }
  }

  // Supprimer une conversation
  async deleteConversation(id: string): Promise<void> {
    try {
      const conversations = await this.getConversations();
      const filteredConversations = conversations.filter(conv => conv.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredConversations));
    } catch (error) {
      logger.error(`Erreur lors de la suppression de la conversation ${id}`, error);
      throw error;
    }
  }

  // Effacer toutes les conversations
  async clearAllConversations(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      logger.error('Erreur lors de la suppression de toutes les conversations', error);
      throw error;
    }
  }
}

export default new ConversationService();
