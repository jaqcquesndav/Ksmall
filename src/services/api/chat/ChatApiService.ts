import ApiService from '../ApiService';
import { Message } from '../../../components/chat/DynamicResponseBuilder';
import { CHAT_MODES } from '../../../components/chat/ModeSelector';
import logger from '../../../utils/logger';

/**
 * Interface pour la requête d'envoi de message
 */
export interface SendMessageRequest {
  text: string;
  mode: CHAT_MODES;
  conversationId?: string;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    data?: string; // Base64 pour les petits fichiers
  }>;
  audioData?: {
    url?: string;
    data?: string; // Base64 pour les petits enregistrements
    duration: number;
  };
  contextData?: any; // Données contextuelles spécifiques au mode
}

/**
 * Interface pour une conversation
 */
export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: string;
  mode: CHAT_MODES;
  messages: Message[];
}

/**
 * Options pour la récupération des conversations
 */
export interface GetConversationsOptions {
  limit?: number;
  offset?: number;
  mode?: CHAT_MODES;
  query?: string;
}

/**
 * Service API pour le chat
 */
class ChatApiService {
  private static readonly BASE_PATH = '/chat';

  /**
   * Envoie un message au backend et obtient une réponse
   */
  async sendMessage(request: SendMessageRequest): Promise<Message> {
    try {
      // Si des pièces jointes sont présentes avec des données en base64, les convertir en fichiers
      if (request.attachments?.some(a => a.data)) {
        const formData = new FormData();
        formData.append('text', request.text);
        formData.append('mode', request.mode);
        
        if (request.conversationId) {
          formData.append('conversationId', request.conversationId);
        }
        
        // Ajouter des données contextuelles si présentes
        if (request.contextData) {
          formData.append('contextData', JSON.stringify(request.contextData));
        }
        
        // Gérer les pièces jointes
        request.attachments.forEach((attachment, index) => {
          if (attachment.data) {
            // Convertir les données base64 en blob
            const byteString = atob(attachment.data.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            
            const blob = new Blob([ab], { type: attachment.type });
            formData.append(`attachment_${index}`, blob, attachment.name);
          } else if (attachment.url) {
            // Juste ajouter l'URL si pas de données base64
            formData.append(`attachment_url_${index}`, attachment.url);
            formData.append(`attachment_name_${index}`, attachment.name);
            formData.append(`attachment_type_${index}`, attachment.type);
          }
        });
        
        // Gérer les données audio si présentes
        if (request.audioData) {
          if (request.audioData.data) {
            // Convertir les données audio base64 en blob
            const byteString = atob(request.audioData.data.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            
            const blob = new Blob([ab], { type: 'audio/wav' });
            formData.append('audio', blob, 'voice_message.wav');
            formData.append('audioDuration', request.audioData.duration.toString());
          } else if (request.audioData.url) {
            formData.append('audioUrl', request.audioData.url);
            formData.append('audioDuration', request.audioData.duration.toString());
          }
        }
        
        // Envoyer avec le FormData
        return await ApiService.uploadFile<Message>(`${ChatApiService.BASE_PATH}/messages`, formData);
      }
      
      // Si pas de données en base64, utiliser un appel POST standard
      return await ApiService.post<Message>(`${ChatApiService.BASE_PATH}/messages`, request);
    } catch (error) {
      logger.error('Erreur lors de l\'envoi du message', error);
      throw error;
    }
  }

  /**
   * Récupère les conversations
   */
  async getConversations(options: GetConversationsOptions = {}): Promise<Conversation[]> {
    try {
      return await ApiService.get<Conversation[]>(
        `${ChatApiService.BASE_PATH}/conversations`,
        options
      );
    } catch (error) {
      logger.error('Erreur lors de la récupération des conversations', error);
      throw error;
    }
  }

  /**
   * Récupère les messages d'une conversation
   */
  async getConversationMessages(conversationId: string, limit: number = 50, before?: string): Promise<Message[]> {
    try {
      const params: Record<string, any> = {
        limit
      };
      
      if (before) {
        params.before = before;
      }
      
      return await ApiService.get<Message[]>(
        `${ChatApiService.BASE_PATH}/conversations/${conversationId}/messages`,
        params
      );
    } catch (error) {
      logger.error(`Erreur lors de la récupération des messages de la conversation ${conversationId}`, error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle conversation
   */
  async createConversation(title: string, mode: CHAT_MODES): Promise<Conversation> {
    try {
      return await ApiService.post<Conversation>(
        `${ChatApiService.BASE_PATH}/conversations`,
        { title, mode }
      );
    } catch (error) {
      logger.error('Erreur lors de la création de la conversation', error);
      throw error;
    }
  }

  /**
   * Met à jour une conversation
   */
  async updateConversation(conversationId: string, title: string): Promise<Conversation> {
    try {
      return await ApiService.put<Conversation>(
        `${ChatApiService.BASE_PATH}/conversations/${conversationId}`,
        { title }
      );
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour de la conversation ${conversationId}`, error);
      throw error;
    }
  }

  /**
   * Supprime une conversation
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      await ApiService.delete(
        `${ChatApiService.BASE_PATH}/conversations/${conversationId}`
      );
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression de la conversation ${conversationId}`, error);
      throw error;
    }
  }

  /**
   * Supprime un message
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      await ApiService.delete(
        `${ChatApiService.BASE_PATH}/messages/${messageId}`
      );
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression du message ${messageId}`, error);
      throw error;
    }
  }

  /**
   * Envoie un feedback sur un message
   */
  async sendFeedback(messageId: string, feedback: 'thumbs_up' | 'thumbs_down', comment?: string): Promise<boolean> {
    try {
      await ApiService.post(
        `${ChatApiService.BASE_PATH}/messages/${messageId}/feedback`,
        { feedback, comment }
      );
      return true;
    } catch (error) {
      logger.error(`Erreur lors de l'envoi du feedback pour le message ${messageId}`, error);
      throw error;
    }
  }

  /**
   * Valide et traite une suggestion de transaction ou d'inventaire
   */
  async validateSuggestion(messageId: string, type: 'journal_entry' | 'inventory', data: any): Promise<{ success: boolean; journalEntryId?: string }> {
    try {
      return await ApiService.post<{ success: boolean; journalEntryId?: string }>(
        `${ChatApiService.BASE_PATH}/messages/${messageId}/validate`,
        { type, data }
      );
    } catch (error) {
      logger.error(`Erreur lors de la validation de la suggestion ${type} pour le message ${messageId}`, error);
      throw error;
    }
  }

  /**
   * Convertit un message audio en texte
   */
  async transcribeAudio(audioData: FormData): Promise<{ text: string }> {
    try {
      return await ApiService.uploadFile<{ text: string }>(
        `${ChatApiService.BASE_PATH}/transcribe`,
        audioData
      );
    } catch (error) {
      logger.error('Erreur lors de la transcription audio', error);
      throw error;
    }
  }

  /**
   * Génère un message audio à partir de texte
   */
  async synthesizeSpeech(text: string, voice: string = 'fr-FR-Standard-A'): Promise<{ audioUrl: string }> {
    try {
      return await ApiService.post<{ audioUrl: string }>(
        `${ChatApiService.BASE_PATH}/synthesize`,
        { text, voice }
      );
    } catch (error) {
      logger.error('Erreur lors de la génération de la parole', error);
      throw error;
    }
  }
}

export default new ChatApiService();