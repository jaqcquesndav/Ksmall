/**
 * Service orchestrateur de synchronisation
 * Ce service centralise et coordonne toutes les synchronisations entre SQLite local et le backend
 * Intègre la gestion des priorités, le traitement par lots et la reprise en cas d'échec
 */

import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../../utils/logger';
import syncService from './SyncService';
import CustomerSyncService from './CustomerSyncService';
import { default as productSyncService } from './ProductSyncService';
import { default as transactionSyncService } from './TransactionSyncService';
import { default as inventorySyncService } from './InventorySyncService';
import { default as accountingSyncService } from './AccountingSyncService';
import { default as dashboardSyncService } from './DashboardSyncService';
import offlineQueueService from '../OfflineQueueService';
import { BaseSyncService } from './BaseSyncService';
import { BusinessDomain, SyncPriority, SyncCheckpoint, AdvancedSyncOptions } from './SyncTypes';

/**
 * Interface pour les résultats de synchronisation par domaine métier
 */
export interface SyncResults {
  // Domaines métier reflet de l'organisation des écrans
  commercial: {
    customers: boolean;
    products: boolean;
    sales: boolean;
    success: boolean; // Succès global pour le domaine commercial
  };
  financial: {
    accounting: boolean;
    transactions: boolean;
    payments: boolean;
    success: boolean; // Succès global pour le domaine financier
  };
  inventory: {
    stock: boolean;
    movements: boolean;
    success: boolean; // Succès global pour le domaine inventaire
  };
  analytics: {
    metrics: boolean;
    reports: boolean;
    dashboard: boolean;
    success: boolean; // Succès global pour le domaine analytique
  };
  settings: {
    userPrefs: boolean;
    success: boolean; // Succès global pour les paramètres
  };
  
  // Métadonnées techniques (séparées de la logique métier)
  metadata: {
    syncDate: Date;
    errors: string[];
    hasErrors: boolean;
    checkpoints?: { [key: string]: SyncCheckpoint }; // Points de contrôle pour reprise
    totalProcessedItems: number;
  };
}

/**
 * Options de synchronisation reflétant l'organisation métier de l'application
 */
export interface SyncOptions extends AdvancedSyncOptions {
  // Options par domaine métier
  domains?: {
    [BusinessDomain.COMMERCIAL]?: boolean;
    [BusinessDomain.FINANCIAL]?: boolean; 
    [BusinessDomain.INVENTORY]?: boolean;
    [BusinessDomain.ANALYTICS]?: boolean;
    [BusinessDomain.SETTINGS]?: boolean;
    [BusinessDomain.CORE]?: boolean;
  };
  
  // Options plus granulaires pour contrôle précis
  entities?: {
    // Commercial
    customers?: boolean;
    products?: boolean;
    sales?: boolean;
    
    // Financial
    accounting?: boolean;
    transactions?: boolean;
    payments?: boolean;
    
    // Inventory
    stock?: boolean;
    movements?: boolean;
    
    // Analytics
    dashboard?: boolean;
    reports?: boolean;
    
    // Settings
    userPrefs?: boolean;
    
    // Core
    global?: boolean;
  };
  
  // Options techniques (séparées de la logique métier)
  technical?: {
    forceFullSync?: boolean;
    showNotifications?: boolean;
    resumeFromCheckpoint?: boolean;
    batchProcessing?: boolean;
    batchSize?: number;
    compressionEnabled?: boolean;
  };
}

/**
 * État de la synchronisation pour analyse et monitoring
 * Orienté vers des informations vraiment utiles pour l'utilisateur
 */
export interface SyncState {
  isRunning: boolean;
  lastSyncTime: Date | null;
  progress: {
    total: number;
    processed: number;
    percentage: number;
  };
  activeOperation: {
    domain: BusinessDomain;
    entity: string;
    description: string;
  } | null;
  results: {
    completed: string[];
    failed: string[];
  };
  errors: {
    count: number;
    messages: string[];
    critical: boolean;
  };
}

/**
 * Mappage des services techniques vers les domaines métier
 * Permet de maintenir la cohérence entre l'organisation technique et métier
 */
interface ServiceMapping {
  service: BaseSyncService;
  domain: BusinessDomain;
  entity: string;
  description: string;
}

/**
 * Service orchestrateur pour coordonner toutes les synchronisations
 * avec gestion des priorités et traitement par lots
 */
class SyncOrchestrator {
  private static instance: SyncOrchestrator;
  private _isSyncing: boolean = false;
  private _lastSyncTime: Date | null = null;
  private _syncState: SyncState;
  private _syncServices: { [key: string]: ServiceMapping } = {};
  private _globalSyncCheckpointKey = 'global_sync_checkpoint';

  private constructor() {
    this._syncState = {
      isRunning: false,
      lastSyncTime: null,
      progress: {
        total: 0,
        processed: 0,
        percentage: 0
      },
      activeOperation: null,
      results: {
        completed: [],
        failed: []
      },
      errors: {
        count: 0,
        messages: [],
        critical: false
      }
    };
    
    // Initialiser le registre des services de synchronisation
    this._initSyncServices();
  }

  /**
   * Get the singleton instance of SyncOrchestrator
   */
  public static getInstance(): SyncOrchestrator {
    if (!SyncOrchestrator.instance) {
      SyncOrchestrator.instance = new SyncOrchestrator();
    }
    return SyncOrchestrator.instance;
  }

  /**
   * Initialiser le registre des services avec leurs priorités
   * et leur correspondance avec les domaines métier
   */
  private _initSyncServices() {
    // Ajouter les services avec leurs correspondances métier
    this._syncServices = {
      'global': {
        service: syncService,
        domain: BusinessDomain.CORE,
        entity: 'global',
        description: 'Synchronisation globale'
      },
      'customers': {
        service: CustomerSyncService.getInstance(),
        domain: BusinessDomain.COMMERCIAL,
        entity: 'customers',
        description: 'Clients et prospects'
      },
      'products': {
        service: productSyncService,
        domain: BusinessDomain.COMMERCIAL,
        entity: 'products',
        description: 'Catalogue de produits'
      },
      'transactions': {
        service: transactionSyncService,
        domain: BusinessDomain.FINANCIAL,
        entity: 'transactions',
        description: 'Transactions commerciales'
      },
      'inventory': {
        service: inventorySyncService,
        domain: BusinessDomain.INVENTORY, 
        entity: 'stock',
        description: 'Inventaire et stocks'
      },
      'accounting': {
        service: accountingSyncService,
        domain: BusinessDomain.FINANCIAL,
        entity: 'accounting',
        description: 'Données comptables'
      },
      'dashboard': {
        service: dashboardSyncService,
        domain: BusinessDomain.ANALYTICS,
        entity: 'dashboard',
        description: 'Tableau de bord et indicateurs'
      }
    };
    
    // Définir les priorités (si les services implémentent BaseSyncService)
    if ('setPriority' in CustomerSyncService) {
      (CustomerSyncService as any).setPriority(SyncPriority.HIGH);
    }
    
    if ('setPriority' in productSyncService) {
      (productSyncService as any).setPriority(SyncPriority.HIGH);
    }
    
    if ('setPriority' in transactionSyncService) {
      (productSyncService as any).setPriority(SyncPriority.CRITICAL);
    }
    
    if ('setPriority' in inventorySyncService) {
      (inventorySyncService as any).setPriority(SyncPriority.MEDIUM);
    }
    
    // Ajouter les nouveaux services
    if ('setPriority' in accountingSyncService) {
      (accountingSyncService as any).setPriority(SyncPriority.HIGH);
    }
    
    if ('setPriority' in dashboardSyncService) {
      (dashboardSyncService as any).setPriority(SyncPriority.LOW);
    }
  }

  /**
   * Synchroniser toutes les données
   * @param options Options de synchronisation
   */
  public async synchronizeAll(options: SyncOptions = {}): Promise<SyncResults> {
    if (this._isSyncing) {
      logger.warn('Une synchronisation est déjà en cours');
      return this._createEmptySyncResult('Une synchronisation est déjà en cours');
    }

    // Vérifier la connexion internet
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      logger.warn('Pas de connexion internet, la synchronisation ne peut pas être effectuée');
      return this._createEmptySyncResult('Pas de connexion internet');
    }

    // Extraire les options techniques
    const {
      technical = {},
      domains = {},
      entities = {}
    } = options;
    
    const {
      forceFullSync = false,
      showNotifications = true,
      resumeFromCheckpoint = true,
      batchProcessing = true,
      batchSize = 50,
      compressionEnabled = true
    } = technical;

    // Marquer le début de la synchronisation
    this._isSyncing = true;
    let checkpoints: { [key: string]: SyncCheckpoint } = {};
    let totalProcessedItems = 0;
    
    // Réinitialiser l'état de synchronisation
    this._syncState = {
      isRunning: true,
      lastSyncTime: this._lastSyncTime,
      progress: {
        total: 0,
        processed: 0,
        percentage: 0
      },
      activeOperation: null,
      results: {
        completed: [],
        failed: []
      },
      errors: {
        count: 0,
        messages: [],
        critical: false
      }
    };
    
    // Charger les points de contrôle si on reprend une synchronisation
    if (resumeFromCheckpoint) {
      checkpoints = await this._loadCheckpoints();
      
      // Mise à jour de l'état pour inclure les checkpoints
      Object.keys(checkpoints).forEach(key => {
        // Code pour actualiser l'état avec les checkpoints
      });
    }
    
    // Initialiser le résultat
    const results: SyncResults = {
      commercial: {
        customers: false,
        products: false,
        sales: false,
        success: false
      },
      financial: {
        accounting: false,
        transactions: false,
        payments: false,
        success: false
      },
      inventory: {
        stock: false,
        movements: false,
        success: false
      },
      analytics: {
        metrics: false,
        reports: false,
        dashboard: false,
        success: false
      },
      settings: {
        userPrefs: false,
        success: false
      },
      metadata: {
        syncDate: new Date(),
        errors: [],
        hasErrors: false,
        totalProcessedItems: 0
      }
    };

    try {
      logger.info('Démarrage de la synchronisation globale');
      
      // Préparer les services à synchroniser
      const servicesToSync: { name: string, mapping: ServiceMapping }[] = [];
      
      // Déterminer quels services synchroniser en fonction des domaines ou entités spécifiés
      Object.entries(this._syncServices).forEach(([name, mapping]) => {
        const { domain, entity } = mapping;
        
        // Vérifier si le domaine est inclus
        const isDomainIncluded = domains[domain] !== false; // inclure par défaut si non spécifié
        
        // Vérifier si l'entité est spécifiquement incluse ou exclue
        const isEntitySpecified = entity in entities;
        const isEntityIncluded = isEntitySpecified ? entities[entity] !== false : true;
        
        // Inclure le service si le domaine et l'entité sont inclus
        if (isDomainIncluded && isEntityIncluded) {
          servicesToSync.push({ name, mapping });
        }
      });
      
      // Trier les services par priorité
      const sortedServices = this._sortServicesByPriority(servicesToSync);
      
      // Marquer les services comme en cours
      sortedServices.forEach(({ name, mapping }) => {
        this._syncState.activeOperation = {
          domain: mapping.domain,
          entity: mapping.entity,
          description: mapping.description
        };
      });
      
      // Options avancées de synchronisation
      const advancedOptions: AdvancedSyncOptions = {
        batchSize: batchProcessing ? batchSize : undefined,
        compressionEnabled
      };
      
      // Synchroniser les services séquentiellement (par ordre de priorité)
      for (const { name, mapping } of sortedServices) {
        const { domain, entity, service, description } = mapping;
        
        try {
          logger.info(`Synchronisation du service: ${name} (${description})`);
          
          // Mise à jour de l'état pour refléter l'opération en cours
          this._syncState.activeOperation = {
            domain,
            entity,
            description
          };
          
          // Récupérer le point de contrôle pour ce service
          const checkpoint = checkpoints[name];
          
          // Synchroniser le service avec les options avancées
          let success = false;
          
          if ('synchronize' in service) {
            if (batchProcessing && 'synchronizeBatch' in service) {
              // Synchronisation par lots avec reprise possible
              let currentCheckpoint: SyncCheckpoint = checkpoint || {
                batchIndex: 0,
                processedCount: 0,
                completed: false
              };
              
              while (!currentCheckpoint.completed) {
                // Vérifier à nouveau la connexion internet
                const netStatus = await NetInfo.fetch();
                if (!netStatus.isConnected) {
                  // Sauvegarder le point de contrôle et sortir
                  checkpoints[name] = currentCheckpoint;
                  await this._saveCheckpoints(checkpoints);
                  throw new Error(`Connexion internet perdue pendant la synchronisation de ${description}`);
                }
                
                try {
                  // Synchroniser un lot
                  currentCheckpoint = await (service as any).synchronizeBatch(
                    currentCheckpoint.batchIndex,
                    batchSize,
                    currentCheckpoint
                  );
                  
                  // Mettre à jour l'état
                  totalProcessedItems += (currentCheckpoint.processedCount - (checkpoint?.processedCount || 0));
                  this._syncState.progress.processed = totalProcessedItems;
                  
                  // Calculer le pourcentage de progression
                  if (this._syncState.progress.total > 0) {
                    this._syncState.progress.percentage = 
                      (this._syncState.progress.processed / this._syncState.progress.total) * 100;
                  }
                  
                  // Sauvegarder le point de contrôle actuel
                  checkpoints[name] = currentCheckpoint;
                  await this._saveCheckpoints(checkpoints);
                  
                  // Si terminé, marquer comme réussi
                  if (currentCheckpoint.completed) {
                    success = true;
                  }
                } catch (error) {
                  logger.error(`Erreur lors de la synchronisation par lots pour ${description}:`, error);
                  break; // Sortir de la boucle mais continuer avec les autres services
                }
              }
            } else {
              // Synchronisation standard
              success = await service.synchronize(forceFullSync, { 
                ...advancedOptions,
                checkpoint
              });
            }
            
            // Mettre à jour les résultats selon le domaine et l'entité
            this._updateResults(results, domain, entity, success);
            
            if (success) {
              // Marquer comme terminé avec succès
              this._syncState.results.completed.push(description);
            } else {
              // Marquer comme échoué
              this._syncState.results.failed.push(description);
              results.metadata.errors.push(`Échec de la synchronisation: ${description}`);
              results.metadata.hasErrors = true;
            }
          } else {
            results.metadata.errors.push(`Le service ${name} n'implémente pas synchronize()`);
            results.metadata.hasErrors = true;
          }
        } catch (error) {
          this._syncState.results.failed.push(description);
          this._syncState.errors.count++;
          this._syncState.errors.messages.push(`Exception: ${error.message}`);
          
          results.metadata.errors.push(`Exception lors de la synchronisation de ${description}: ${error.message}`);
          results.metadata.hasErrors = true;
          
          // Marquer l'échec dans le domaine métier correspondant
          this._updateResults(results, domain, entity, false);
        }
      }

      // Traiter la file d'attente hors ligne
      if (netInfo.isConnected) {
        await offlineQueueService.processQueue();
      }

      logger.info('Synchronisation globale terminée');
      results.metadata.totalProcessedItems = totalProcessedItems;
      
      // Mettre à jour le succès global par domaine
      this._finalizeResults(results);
      
      return results;
    } catch (error) {
      logger.error('Erreur lors de la synchronisation globale:', error);
      
      results.metadata.errors.push(`Erreur générale de synchronisation: ${error.message}`);
      results.metadata.hasErrors = true;
      
      this._syncState.errors.count++;
      this._syncState.errors.messages.push(`Erreur générale: ${error.message}`);
      this._syncState.errors.critical = true;
      
      return results;
    } finally {
      // Marquer la fin de la synchronisation
      this._isSyncing = false;
      this._lastSyncTime = new Date();
      this._syncState.isRunning = false;
      this._syncState.lastSyncTime = this._lastSyncTime;
      
      // Mettre à jour le métadata du résultat avec la date finale
      results.metadata.syncDate = this._lastSyncTime;
      results.metadata.checkpoints = checkpoints;
    }
  }

  /**
   * Créer un résultat de synchronisation vide avec un message d'erreur
   */
  private _createEmptySyncResult(errorMessage: string): SyncResults {
    return {
      commercial: {
        customers: false,
        products: false,
        sales: false,
        success: false
      },
      financial: {
        accounting: false,
        transactions: false,
        payments: false,
        success: false
      },
      inventory: {
        stock: false,
        movements: false,
        success: false
      },
      analytics: {
        metrics: false,
        reports: false,
        dashboard: false,
        success: false
      },
      settings: {
        userPrefs: false,
        success: false
      },
      metadata: {
        syncDate: new Date(),
        errors: [errorMessage],
        hasErrors: true,
        totalProcessedItems: 0
      }
    };
  }

  /**
   * Mettre à jour les résultats avec le succès ou l'échec d'une entité
   */
  private _updateResults(results: SyncResults, domain: BusinessDomain, entity: string, success: boolean): void {
    // Mapping des entités aux propriétés des domaines dans les résultats
    switch (domain) {
      case BusinessDomain.COMMERCIAL:
        if (entity === 'customers') results.commercial.customers = success;
        else if (entity === 'products') results.commercial.products = success;
        else if (entity === 'sales') results.commercial.sales = success;
        break;
      
      case BusinessDomain.FINANCIAL:
        if (entity === 'accounting') results.financial.accounting = success;
        else if (entity === 'transactions') results.financial.transactions = success;
        else if (entity === 'payments') results.financial.payments = success;
        break;
      
      case BusinessDomain.INVENTORY:
        if (entity === 'stock') results.inventory.stock = success;
        else if (entity === 'movements') results.inventory.movements = success;
        break;
      
      case BusinessDomain.ANALYTICS:
        if (entity === 'dashboard') results.analytics.dashboard = success;
        else if (entity === 'reports') results.analytics.reports = success;
        else if (entity === 'metrics') results.analytics.metrics = success;
        break;
      
      case BusinessDomain.SETTINGS:
        if (entity === 'userPrefs') results.settings.userPrefs = success;
        break;
    }
  }

  /**
   * Finaliser les résultats en déterminant le succès global par domaine
   */
  private _finalizeResults(results: SyncResults): void {
    // Un domaine est en succès si au moins une de ses entités a réussi
    // et qu'aucune erreur critique n'est survenue
    
    results.commercial.success = (
      results.commercial.customers || 
      results.commercial.products || 
      results.commercial.sales
    ) && !results.metadata.hasErrors;
    
    results.financial.success = (
      results.financial.accounting || 
      results.financial.transactions || 
      results.financial.payments
    ) && !results.metadata.hasErrors;
    
    results.inventory.success = (
      results.inventory.stock || 
      results.inventory.movements
    ) && !results.metadata.hasErrors;
    
    results.analytics.success = (
      results.analytics.dashboard || 
      results.analytics.reports || 
      results.analytics.metrics
    ) && !results.metadata.hasErrors;
    
    results.settings.success = results.settings.userPrefs && !results.metadata.hasErrors;
  }

  /**
   * Trier les services par priorité
   */
  private _sortServicesByPriority(services: { name: string, mapping: ServiceMapping }[]): { name: string, mapping: ServiceMapping }[] {
    return services.sort((a, b) => {
      const serviceA = a.mapping.service;
      const serviceB = b.mapping.service;
      
      const priorityA = 'getPriority' in serviceA ? (serviceA as any).getPriority() : SyncPriority.MEDIUM;
      const priorityB = 'getPriority' in serviceB ? (serviceB as any).getPriority() : SyncPriority.MEDIUM;
      
      return priorityA - priorityB; // Ordre croissant (CRITICAL = 1 en premier)
    });
  }

  /**
   * Load checkpoints from AsyncStorage
   */
  private async _loadCheckpoints(): Promise<{ [key: string]: SyncCheckpoint }> {
    try {
      const checkpoints: { [key: string]: SyncCheckpoint } = {};
      
      // Load global checkpoint first
      const globalCheckpointStr = await AsyncStorage.getItem(this._globalSyncCheckpointKey);
      if (globalCheckpointStr) {
        try {
          checkpoints['global'] = JSON.parse(globalCheckpointStr);
        } catch (e) {
          logger.error('Error parsing global checkpoint:', e);
        }
      }
      
      // Load individual service checkpoints
      for (const [name, mapping] of Object.entries(this._syncServices)) {
        const service = mapping.service;
        if ('loadCheckpoint' in service && typeof service.loadCheckpoint === 'function') {
          const checkpoint = await (service as any).loadCheckpoint();
          if (checkpoint) {
            checkpoints[name] = checkpoint;
          }
        }
      }
      
      logger.debug(`Loaded ${Object.keys(checkpoints).length} checkpoints`);
      return checkpoints;
    } catch (error) {
      logger.error('Error loading sync checkpoints:', error);
      return {}; // Return empty object in case of error
    }
  }

  /**
   * Save checkpoints to AsyncStorage
   */
  private async _saveCheckpoints(checkpoints: { [key: string]: SyncCheckpoint }): Promise<void> {
    try {
      // Save global checkpoint if exists
      if (checkpoints['global']) {
        await AsyncStorage.setItem(
          this._globalSyncCheckpointKey,
          JSON.stringify(checkpoints['global'])
        );
      }
      
      // Save individual service checkpoints
      for (const [name, checkpoint] of Object.entries(checkpoints)) {
        if (name === 'global') continue; // Already handled above
        
        const mapping = this._syncServices[name];
        if (mapping && 'saveCheckpoint' in mapping.service && 
            typeof mapping.service.saveCheckpoint === 'function') {
          await (mapping.service as any).saveCheckpoint(checkpoint);
        }
      }
      
      logger.debug(`Saved ${Object.keys(checkpoints).length} checkpoints`);
    } catch (error) {
      logger.error('Error saving sync checkpoints:', error);
      throw error; // Propagate the error
    }
  }

  /**
   * Save a checkpoint for a specific service
   * @param serviceName Name of the service
   * @param checkpoint Checkpoint data to save
   */
  public async saveCheckpoint(serviceName: string, checkpoint: SyncCheckpoint): Promise<void> {
    try {
      // Find the service mapping
      const mapping = this._syncServices[serviceName];
      if (!mapping) {
        logger.warn(`Cannot save checkpoint: service ${serviceName} not found`);
        return;
      }

      // If the service implements the saveCheckpoint method, use it
      if ('saveCheckpoint' in mapping.service && typeof mapping.service.saveCheckpoint === 'function') {
        await (mapping.service as any).saveCheckpoint(checkpoint);
        logger.debug(`Saved checkpoint for ${serviceName}`);
      } else {
        logger.warn(`Service ${serviceName} does not implement saveCheckpoint method`);
      }
    } catch (error) {
      logger.error(`Error saving checkpoint for ${serviceName}:`, error);
      throw error;
    }
  }

  /**
   * Load a checkpoint for a specific service
   * @param serviceName Name of the service
   * @returns The saved checkpoint or null if not found
   */
  public async loadCheckpoint(serviceName: string): Promise<SyncCheckpoint | null> {
    try {
      // Find the service mapping
      const mapping = this._syncServices[serviceName];
      if (!mapping) {
        logger.warn(`Cannot load checkpoint: service ${serviceName} not found`);
        return null;
      }

      // If the service implements the loadCheckpoint method, use it
      if ('loadCheckpoint' in mapping.service && typeof mapping.service.loadCheckpoint === 'function') {
        const checkpoint = await (mapping.service as any).loadCheckpoint();
        logger.debug(`Loaded checkpoint for ${serviceName}:`, checkpoint);
        return checkpoint;
      } else {
        logger.warn(`Service ${serviceName} does not implement loadCheckpoint method`);
        return null;
      }
    } catch (error) {
      logger.error(`Error loading checkpoint for ${serviceName}:`, error);
      return null;
    }
  }

  /**
   * Synchroniser un domaine métier spécifique
   */
  public async synchronizeDomain(domain: BusinessDomain, options: SyncOptions = {}): Promise<SyncResults> {
    // Filtrer les options pour ne synchroniser que le domaine spécifié
    const domainOptions = { ...options };
    
    if (!domainOptions.domains) domainOptions.domains = {};
    Object.values(BusinessDomain).forEach(d => {
      domainOptions.domains[d] = d === domain;
    });
    
    return this.synchronizeAll(domainOptions);
  }

  /**
   * Synchroniser uniquement les clients
   */
  public async synchronizeCustomers(options: SyncOptions = {}): Promise<boolean> {
    if (!this._syncServices.customers) {
      logger.error('Service de synchronisation des clients non disponible');
      return false;
    }
    
    try {
      const service = this._syncServices.customers.service;
      const technical = options.technical || {};
      return await service.synchronize(technical.forceFullSync || false, options);
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des clients:', error);
      return false;
    }
  }

  /**
   * Synchroniser uniquement les produits
   */
  public async synchronizeProducts(options: SyncOptions = {}): Promise<boolean> {
    if (!this._syncServices.products) {
      logger.error('Service de synchronisation des produits non disponible');
      return false;
    }
    
    try {
      const service = this._syncServices.products.service;
      const technical = options.technical || {};
      return await service.synchronize(technical.forceFullSync || false, options);
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des produits:', error);
      return false;
    }
  }

  /**
   * Synchroniser uniquement les transactions
   */
  public async synchronizeTransactions(options: SyncOptions = {}): Promise<boolean> {
    if (!this._syncServices.transactions) {
      logger.error('Service de synchronisation des transactions non disponible');
      return false;
    }
    
    try {
      const service = this._syncServices.transactions.service;
      const technical = options.technical || {};
      return await service.synchronize(technical.forceFullSync || false, options);
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des transactions:', error);
      return false;
    }
  }

  /**
   * Synchroniser uniquement l'inventaire
   */
  public async synchronizeInventory(options: SyncOptions = {}): Promise<boolean> {
    if (!this._syncServices.inventory) {
      logger.error('Service de synchronisation de l\'inventaire non disponible');
      return false;
    }
    
    try {
      const service = this._syncServices.inventory.service;
      const technical = options.technical || {};
      return await service.synchronize(technical.forceFullSync || false, options);
    } catch (error) {
      logger.error('Erreur lors de la synchronisation de l\'inventaire:', error);
      return false;
    }
  }

  /**
   * Synchroniser uniquement la comptabilité
   */
  public async synchronizeAccounting(options: SyncOptions = {}): Promise<boolean> {
    if (!this._syncServices.accounting) {
      logger.error('Service de synchronisation de la comptabilité non disponible');
      return false;
    }
    
    try {
      const service = this._syncServices.accounting.service;
      const technical = options.technical || {};
      return await service.synchronize(technical.forceFullSync || false, options);
    } catch (error) {
      logger.error('Erreur lors de la synchronisation de la comptabilité:', error);
      return false;
    }
  }
  
  /**
   * Synchroniser uniquement le tableau de bord
   */
  public async synchronizeDashboard(options: SyncOptions = {}): Promise<boolean> {
    if (!this._syncServices.dashboard) {
      logger.error('Service de synchronisation du tableau de bord non disponible');
      return false;
    }
    
    try {
      // Avant de synchroniser le dashboard, on peut mettre à jour ses données
      const service = this._syncServices.dashboard.service;
      if ('regenerateDashboardData' in service) {
        await (service as any).regenerateDashboardData();
      }
      
      const technical = options.technical || {};
      return await service.synchronize(technical.forceFullSync || false, options);
    } catch (error) {
      logger.error('Erreur lors de la synchronisation du tableau de bord:', error);
      return false;
    }
  }
}

// Exporter une instance singleton du service
const syncOrchestrator = SyncOrchestrator.getInstance();
export default syncOrchestrator;