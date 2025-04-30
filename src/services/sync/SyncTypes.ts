/**
 * Shared types for sync services
 * This file breaks the circular dependency between sync services
 */

/**
 * Domaines métier pour la synchronisation
 * Reflète directement l'organisation des écrans et fonctionnalités de l'application
 */
export enum BusinessDomain {
  COMMERCIAL = 'commercial',   // Ventes, clients, achats
  FINANCIAL = 'financial',     // Comptabilité, finance
  INVENTORY = 'inventory',     // Gestion des stocks
  ANALYTICS = 'analytics',     // Tableau de bord, rapports
  SETTINGS = 'settings',       // Paramètres, configuration
  CORE = 'core',               // Fonctionnalités de base, synchronisation globale
  CUSTOMERS = 'customers',     // Clients spécifiquement
  CATALOG = 'catalog'          // Catalogue de produits
}

/**
 * Priority levels for sync services
 */
export enum SyncPriority {
  CRITICAL = 1, // Most important, sync first
  HIGH = 2,     // High priority
  MEDIUM = 3,   // Normal priority
  LOW = 4       // Low priority, sync last
}

/**
 * Checkpoint for resuming synchronization
 */
export interface SyncCheckpoint {
  batchIndex?: number;
  processedCount?: number;
  lastSyncTime?: Date;
  completed?: boolean;
  entityId?: string;
  [key: string]: any; // Allow additional fields for specific services
}

/**
 * Advanced options for synchronization
 */
export interface AdvancedSyncOptions {
  batchSize?: number;
  compressionEnabled?: boolean;
  checkpoint?: SyncCheckpoint;
  [key: string]: any; // Allow additional options
}