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
 * Types de messages dans l'interface utilisateur
 */
export enum MESSAGE_TYPES {
  REGULAR_CHAT = 'regular_chat',
  JOURNAL_ENTRY = 'journal_entry',
  INVENTORY = 'inventory',
  ANALYSIS = 'analysis',
  MARKDOWN = 'markdown',
  LATEX = 'latex',
  CODE = 'code'
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
 * Interface représentant un message dans une conversation (API)
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
 * Interface représentant un message dans l'interface utilisateur
 */
export interface UIMessage {
  id: string;
  content: string;
  messageType: MESSAGE_TYPES;
  isUser: boolean;
  timestamp: string;
  attachments?: MessageAttachment[];
  status?: 'pending' | 'validated' | 'error';
  journalData?: any;
  inventoryData?: any;
  analysisData?: any;
  codeLanguage?: string;
  userReaction?: 'like' | 'dislike' | null;
  isSystemMessage?: boolean;
}

/**
 * Interface pour les pièces jointes dans l'interface utilisateur
 */
export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
}

/**
 * Données pour le widget d'inventaire
 */
export interface InventoryData {
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalValue: number;
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

/**
 * Types pour les services du chat
 */

export interface ServiceConversation {
  id: string;
  title: string;
  mode: string;
  messages: ServiceMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceMessage {
  id: string;
  text: string;
  role: string;
  metadata: Record<string, any>;
  attachments: ServiceAttachment[];
  createdAt: string;
}

export interface ServiceAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
}