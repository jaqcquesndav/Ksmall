import { SyncResult, SyncOptions } from './SyncService';
import { BusinessDomain, SyncPriority, SyncCheckpoint, AdvancedSyncOptions } from './SyncTypes';

/**
 * Interface de base pour tous les services de synchronisation
 * Permet d'assurer une cohérence entre les différents services de synchronisation
 */
export interface BaseSyncService {
  /**
   * Synchroniser les données entre la base locale et le serveur distant
   * @param forceFullSync Force une synchronisation complète au lieu d'une synchronisation incrémentale
   * @param options Options additionnelles de synchronisation
   */
  synchronize(forceFullSync?: boolean, options?: SyncOptions & AdvancedSyncOptions): Promise<boolean>;
  
  /**
   * Obtenir les données depuis le serveur et les stocker localement
   * @param forceFullSync Force une synchronisation complète
   * @param lastSyncTime Timestamp de la dernière synchronisation
   * @param options Options avancées (lots, compression, etc.)
   */
  pullFromServer(forceFullSync?: boolean, lastSyncTime?: Date, options?: AdvancedSyncOptions): Promise<number>;
  
  /**
   * Envoyer les données locales vers le serveur
   * @param onlyModified N'envoyer que les données modifiées depuis la dernière synchronisation
   * @param options Options avancées (lots, compression, etc.)
   */
  pushToServer(onlyModified?: boolean, options?: AdvancedSyncOptions): Promise<number>;
  
  /**
   * Créer la structure de table locale si elle n'existe pas
   */
  ensureLocalStructure(): Promise<void>;
  
  /**
   * Résoudre un conflit entre les données locales et distantes
   * @param localData Données locales
   * @param serverData Données du serveur
   * @param strategy Stratégie de résolution des conflits
   */
  resolveConflict(localData: any, serverData: any, strategy: 'LOCAL' | 'REMOTE' | 'MERGE' | 'ASK'): Promise<any>;
  
  /**
   * Synchroniser un lot de données
   * @param batchIndex Indice du lot à synchroniser
   * @param batchSize Taille du lot
   * @param checkpoint Point de reprise pour continuer une synchronisation interrompue
   */
  synchronizeBatch(batchIndex: number, batchSize: number, checkpoint?: SyncCheckpoint): Promise<SyncCheckpoint>;
  
  /**
   * Compresser les données pour l'envoi
   * @param data Données à compresser
   */
  compressData?(data: any): Promise<any>;
  
  /**
   * Décompresser les données reçues
   * @param data Données compressées
   */
  decompressData?(data: any): Promise<any>;
  
  /**
   * Obtenir la priorité de synchronisation pour ce service
   */
  getPriority(): SyncPriority;
  
  /**
   * Sauvegarder l'état actuel de la synchronisation pour reprise ultérieure
   */
  saveCheckpoint(checkpoint: SyncCheckpoint): Promise<void>;
  
  /**
   * Charger l'état de la dernière synchronisation pour reprise
   */
  loadCheckpoint(): Promise<SyncCheckpoint | null>;

  /**
   * Obtenir le domaine métier auquel appartient ce service
   * Cette méthode permet d'identifier le domaine métier pour l'orchestration
   */
  getBusinessDomain(): BusinessDomain;
  
  /**
   * Obtenir le nom des entités métier gérées par ce service
   * @returns Liste des noms d'entités métier (ex: 'customers', 'products', etc.)
   */
  getBusinessEntities(): string[];
  
  /**
   * Obtenir un nom convivial pour l'utilisateur pour ce service de synchronisation
   * Ce nom sera utilisé dans l'interface utilisateur pour désigner ce service
   */
  getUserFriendlyName(): string;
  
  /**
   * Obtenir une description conviviale pour l'utilisateur pour ce service de synchronisation
   * Cette description sera utilisée dans l'interface utilisateur pour décrire ce service
   */
  getUserFriendlyDescription(): string;
  
  /**
   * Vérifier si une entité spécifique est gérée par ce service
   * @param entityName Nom de l'entité à vérifier
   * @returns true si l'entité est gérée par ce service, false sinon
   */
  handlesEntity(entityName: string): boolean;
}

/**
 * Méthode utilitaire pour trouver le service de synchronisation avec la priorité la plus basse
 * @param services Liste des services de synchronisation
 * @returns Le service avec la priorité la plus basse ou null si la liste est vide
 */
export function findLowestPriorityService(services: BaseSyncService[]): BaseSyncService | null {
  if (!services || services.length === 0) return null;

  return services.reduce((lowest, current) => {
    const lowestPriority = lowest.getPriority();
    const currentPriority = current.getPriority();
    return currentPriority > lowestPriority ? current : lowest;
  }, services[0]);
}

/**
 * Méthode utilitaire pour trouver le service de synchronisation avec la priorité la plus haute
 * @param services Liste des services de synchronisation
 * @returns Le service avec la priorité la plus haute ou null si la liste est vide
 */
export function findHighestPriorityService(services: BaseSyncService[]): BaseSyncService | null {
  if (!services || services.length === 0) return null;

  return services.reduce((highest, current) => {
    const highestPriority = highest.getPriority();
    const currentPriority = current.getPriority();
    return currentPriority < highestPriority ? current : highest;
  }, services[0]);
}

/**
 * Méthode utilitaire pour trouver les services par domaine métier
 * @param services Liste des services de synchronisation
 * @param domain Domaine métier recherché
 * @returns Les services appartenant au domaine spécifié
 */
export function findServicesByDomain(services: BaseSyncService[], domain: BusinessDomain): BaseSyncService[] {
  if (!services || services.length === 0) return [];
  
  return services.filter(service => service.getBusinessDomain() === domain);
}

/**
 * Méthode utilitaire pour trouver le service qui gère une entité spécifique
 * @param services Liste des services de synchronisation
 * @param entityName Nom de l'entité recherchée
 * @returns Le service qui gère l'entité ou null si aucun service ne la gère
 */
export function findServiceForEntity(services: BaseSyncService[], entityName: string): BaseSyncService | null {
  if (!services || services.length === 0) return null;
  
  return services.find(service => service.handlesEntity(entityName)) || null;
}

// Re-export types from SyncTypes for backward compatibility
export type { SyncPriority, SyncCheckpoint, AdvancedSyncOptions };