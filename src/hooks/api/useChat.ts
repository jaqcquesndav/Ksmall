import { useCallback } from 'react';
import { useApi } from './useApi';
import API from '../../services/API';
import { CHAT_MODES } from '../../components/chat/ModeSelector';

/**
 * Type représentant un message dans le chat
 */
export interface ChatMessage {
  id: string;
  text: string;
  type: 'user' | 'assistant' | 'system';
  timestamp: string;
  data?: any;
  messageType?: 'text' | 'suggestion' | 'analysis' | 'chart' | 'table';
}

/**
 * Type représentant une conversation de chat
 */
export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  mode: keyof typeof CHAT_MODES;
  lastUpdated: string;
  isPinned?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Options pour les requêtes de chat
 */
interface ChatQueryOptions {
  limit?: number;
  offset?: number;
  searchTerm?: string;
  mode?: keyof typeof CHAT_MODES;
  startDate?: string;
  endDate?: string;
}

/**
 * Hook pour gérer les fonctionnalités de chat
 */
export function useChat() {
  /**
   * Hook pour récupérer les conversations
   */
  const useConversations = (options: ChatQueryOptions = {}) => {
    return useApi<ChatConversation[]>(
      () => API.chat.getConversations(options),
      {
        autoFetch: true,
        fetchOnFocus: true,
        cache: {
          key: `conversations-${JSON.stringify(options)}`,
          ttl: 5 * 60 * 1000, // 5 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer une conversation spécifique
   */
  const useConversation = (id: string | null) => {
    return useApi<ChatConversation>(
      () => id ? API.chat.getConversation(id) : Promise.reject('ID requis'),
      {
        autoFetch: !!id,
        fetchOnFocus: true,
        cache: {
          key: `conversation-${id}`,
          ttl: 2 * 60 * 1000, // 2 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour créer une nouvelle conversation
   */
  const useCreateConversation = () => {
    return useApi<ChatConversation>(
      (title: string, mode: keyof typeof CHAT_MODES) => API.chat.createConversation(title, mode),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour envoyer un message
   */
  const useSendMessage = () => {
    return useApi<ChatMessage>(
      (conversationId: string, text: string, data?: any) => 
        API.chat.sendMessage(conversationId, text, data),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour envoyer un message avec un mode spécifique
   */
  const useSendModeMessage = () => {
    return useApi<ChatMessage>(
      (text: string, mode: keyof typeof CHAT_MODES, data?: any) => 
        API.chat.sendModeMessage(text, mode, data),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour valider une suggestion
   */
  const useValidateSuggestion = () => {
    return useApi<{ success: boolean; journalEntryId?: string }>(
      (messageId: string, type: string, data?: any) => 
        API.chat.validateSuggestion(messageId, type, data),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour épingler/désépingler une conversation
   */
  const useTogglePin = () => {
    return useApi<ChatConversation>(
      (conversationId: string, isPinned: boolean) => 
        API.chat.togglePinConversation(conversationId, isPinned),
      { autoFetch: false }
    );
  };
  
  /**
   * Hook pour renommer une conversation
   */
  const useRenameConversation = () => {
    return useApi<ChatConversation>(
      (conversationId: string, title: string) => 
        API.chat.renameConversation(conversationId, title),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour supprimer une conversation
   */
  const useDeleteConversation = () => {
    return useApi<boolean>(
      (conversationId: string) => API.chat.deleteConversation(conversationId),
      { autoFetch: false }
    );
  };

  /**
   * Fonction pour générer un résumé de conversation
   */
  const generateSummary = useCallback(async (conversationId: string): Promise<string> => {
    try {
      const result = await API.chat.generateSummary(conversationId);
      return result.summary;
    } catch (error) {
      console.error('Erreur lors de la génération du résumé:', error);
      throw error;
    }
  }, []);

  /**
   * Fonction pour exporter une conversation
   */
  const exportConversation = useCallback(async (
    conversationId: string, 
    format: 'pdf' | 'txt' | 'json'
  ): Promise<string> => {
    try {
      const result = await API.chat.exportConversation(conversationId, format);
      return result.url;
    } catch (error) {
      console.error('Erreur lors de l\'exportation de la conversation:', error);
      throw error;
    }
  }, []);

  return {
    useConversations,
    useConversation,
    useCreateConversation,
    useSendMessage,
    useSendModeMessage,
    useValidateSuggestion,
    useTogglePin,
    useRenameConversation,
    useDeleteConversation,
    generateSummary,
    exportConversation
  };
}