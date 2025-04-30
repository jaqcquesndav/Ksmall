/**
 * Interface définissant le contrat que tous les services de synchronisation doivent implémenter
 */

import { SyncPriority, AdvancedSyncOptions, SyncCheckpoint } from './BaseSyncService';

/**
 * Interface defining the core synchronization service functionality
 */
export interface ISyncService {
  /**
   * Synchroniser les données entre la base locale et le serveur distant
   * @param forceFullSync Force une synchronisation complète au lieu d'une synchronisation incrémentale
   * @param options Options additionnelles de synchronisation
   */
  synchronize(forceFullSync?: boolean, options?: AdvancedSyncOptions): Promise<boolean>;
  
  /**
   * Obtenir les données depuis le serveur et les stocker localement
   */
  pullFromServer(forceFullSync?: boolean, lastSyncTime?: Date, options?: AdvancedSyncOptions): Promise<number>;
  
  /**
   * Envoyer les données locales vers le serveur
   */
  pushToServer(onlyModified?: boolean, options?: AdvancedSyncOptions): Promise<number>;
  
  /**
   * Retourne le nom de la ressource synchronisée par ce service
   */
  getResourceName(): string;
  
  /**
   * Retourne la priorité de synchronisation de ce service
   */
  getPriority(): SyncPriority;
  
  /**
   * Obtenir le dernier point de reprise de la synchronisation
   */
  loadCheckpoint(): Promise<SyncCheckpoint | null>;
  
  /**
   * Sauvegarder un point de reprise de la synchronisation
   */
  saveCheckpoint(checkpoint: SyncCheckpoint): Promise<void>;
  
  /**
   * Initialize the synchronization service
   */
  initialize(): Promise<void>;
  
  /**
   * Check if data is synced with the server
   * @param entityType Type of entity to check
   * @param entityId ID of entity to check
   * @returns Boolean indicating if the data is synced
   */
  isDataSynced(entityType: string, entityId: string): Promise<boolean>;
  
  /**
   * Get local data with sync status information
   * @param entityType Type of entity to retrieve
   * @param query Optional query parameters
   * @returns Array of entities with sync status
   */
  getLocalDataWithSyncStatus<T>(entityType: string, query?: any): Promise<Array<T & { isSynced: boolean }>>;
  
  /**
   * Perform a local operation that will be synchronized later
   * @param entityType Type of entity
   * @param operation Type of operation (create, update, delete)
   * @param data Data for the operation
   * @param priority Priority level for synchronization
   * @returns Result of the operation
   */
  performLocalOperation(
    entityType: string, 
    operation: 'create' | 'update' | 'delete', 
    data: any, 
    priority?: number
  ): Promise<{ success: boolean; localId: string; error?: string }>;
  
  /**
   * Manually trigger synchronization
   * @param entityTypes Optional specific entity types to synchronize
   * @returns Result of the synchronization attempt
   */
  synchronize(entityTypes?: string[]): Promise<{ success: boolean; error?: string }>;
  
  /**
   * Check connection status with the server
   * @returns Boolean indicating if connected to server
   */
  isConnectedToServer(): Promise<boolean>;
}