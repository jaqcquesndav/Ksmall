/**
 * Types relatifs au chat
 */

/**
 * Types de mode de conversation disponibles
 */
export enum CHAT_MODES {
  ASSISTANT = 'assistant',
  ACCOUNTING = 'accounting',
  INVENTORY = 'inventory',
  FINANCIAL = 'financial',
  ANALYTICS = 'analytics'
}

/**
 * Interface représentant une conversation
 */
export interface Conversation {
  id: string;
  title: string;
  mode: CHAT_MODES;
  lastMessage?: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface représentant un message dans une conversation
 */
export interface Message {
  id: string;
  conversationId: string;
  text: string;
  role: 'user' | 'assistant' | 'system';
  status: 'sending' | 'sent' | 'error' | 'read';
  feedback?: 'thumbs_up' | 'thumbs_down';
  audioUrl?: string;
  audioDuration?: number;
  attachments?: Attachment[];
  suggestions?: Suggestion[];
  createdAt: string;
  metadata?: Record<string, any>;
}

/**
 * Interface représentant une pièce jointe à un message
 */
export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size?: number;
  thumbnailUrl?: string;
}

/**
 * Interface représentant une suggestion générée par le chat
 */
export interface Suggestion {
  id: string;
  type: 'journal_entry' | 'inventory' | 'action';
  title: string;
  description?: string;
  data: Record<string, any>;
}

/**
 * Interface pour les options de requête des conversations
 */
export interface GetConversationsOptions {
  limit?: number;
  offset?: number;
  mode?: CHAT_MODES;
  query?: string;
}

/**
 * Interface pour l'envoi d'un nouveau message
 */
export interface SendMessageRequest {
  text: string;
  mode: CHAT_MODES;
  conversationId?: string;
  attachments?: {
    id: string;
    name: string;
    type: string;
    url: string;
    data?: string; // Base64 pour les petits fichiers
  }[];
  audioData?: {
    url?: string;
    data?: string; // Base64 pour les petits enregistrements
    duration: number;
  };
  contextData?: Record<string, any>;
}

/**
 * Interface pour le résultat de la transcription audio
 */
export interface TranscriptionResult {
  text: string;
}

/**
 * Interface pour le résultat de la synthèse vocale
 */
export interface SynthesisResult {
  audioUrl: string;
}

/**
 * Interface pour le feedback sur un message
 */
export interface MessageFeedback {
  feedback: 'thumbs_up' | 'thumbs_down';
  comment?: string;
}

/**
 * Interface pour la validation d'une suggestion
 */
export interface ValidateSuggestionRequest {
  type: 'journal_entry' | 'inventory';
  data: Record<string, any>;
}

/**
 * Interface pour le résultat de validation d'une suggestion
 */
export interface ValidateSuggestionResult {
  success: boolean;
  journalEntryId?: string;
  inventoryId?: string;
  message?: string;
}