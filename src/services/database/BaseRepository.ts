/**
 * Repository de base pour les opérations CRUD sur les entités
 */

import SQLiteService from './SQLiteService';
import { EntityType, SyncOperation, SyncStatus, Synchronizable, TableConfig } from './types';
import { generateUUID } from '../../utils/uuid';
import logger from '../../utils/logger';

export abstract class BaseRepository<T extends Synchronizable> {
  protected tableName: string;
  protected entityType: EntityType;
  protected tableConfig: TableConfig;

  constructor(entityType: EntityType, tableConfig: TableConfig) {
    this.entityType = entityType;
    this.tableName = tableConfig.name;
    this.tableConfig = tableConfig;
  }

  /**
   * Initialise la table pour cette entité
   */
  public async initialize(): Promise<void> {
    try {
      // Créer la table si elle n'existe pas
      await SQLiteService.executeQuery(this.tableConfig.createTableSQL);

      // Créer les index si spécifiés
      if (this.tableConfig.indexes && this.tableConfig.indexes.length > 0) {
        for (const indexSQL of this.tableConfig.indexes) {
          await SQLiteService.executeQuery(indexSQL);
        }
      }

      logger.info(`Table ${this.tableName} initialisée avec succès`);
    } catch (error) {
      logger.error(`Erreur lors de l'initialisation de la table ${this.tableName}`, error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle entité
   */
  public async create(entity: Partial<T>): Promise<T> {
    try {
      const now = Date.now();
      const newEntity = {
        ...entity,
        id: entity.id || generateUUID(),
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
        localVersion: 1,
        syncStatus: SyncStatus.PENDING
      } as T;

      // Convertir les objets complexes en JSON pour stockage
      const dataForStorage = this.serializeForStorage(newEntity);

      // Insérer dans la base de données locale
      await SQLiteService.insert(this.tableName, dataForStorage);

      // Ajouter à la file d'attente de synchronisation
      await this.addToSyncQueue(newEntity.id, SyncOperation.CREATE, newEntity);

      return newEntity;
    } catch (error) {
      logger.error(`Erreur lors de la création d'une entité ${this.entityType}`, error);
      throw error;
    }
  }

  /**
   * Met à jour une entité existante
   */
  public async update(entity: Partial<T>): Promise<T> {
    try {
      if (!entity.id) {
        throw new Error(`Impossible de mettre à jour l'entité ${this.entityType} sans ID`);
      }

      // Récupérer l'entité existante
      const existing = await this.getById(entity.id);
      if (!existing) {
        throw new Error(`Entité ${this.entityType} avec ID ${entity.id} non trouvée`);
      }

      // Incrémenter la version locale pour la gestion des conflits
      const updatedEntity = {
        ...existing,
        ...entity,
        updatedAt: Date.now(),
        localVersion: (existing.localVersion || 0) + 1,
        syncStatus: SyncStatus.PENDING
      } as T;

      // Convertir les objets complexes en JSON pour stockage
      const dataForStorage = this.serializeForStorage(updatedEntity);

      // Mettre à jour la base de données locale
      await SQLiteService.update(
        this.tableName,
        dataForStorage,
        'id = ?',
        [entity.id]
      );

      // Ajouter à la file d'attente de synchronisation
      await this.addToSyncQueue(entity.id, SyncOperation.UPDATE, updatedEntity);

      return updatedEntity;
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour de l'entité ${this.entityType}`, error);
      throw error;
    }
  }

  /**
   * Supprime logiquement une entité (soft delete)
   */
  public async delete(id: string): Promise<boolean> {
    try {
      const existing = await this.getById(id);
      if (!existing) {
        throw new Error(`Entité ${this.entityType} avec ID ${id} non trouvée`);
      }

      const updatedEntity = {
        ...existing,
        isDeleted: true,
        updatedAt: Date.now(),
        localVersion: (existing.localVersion || 0) + 1,
        syncStatus: SyncStatus.PENDING
      };

      // Convertir les objets complexes en JSON pour stockage
      const dataForStorage = this.serializeForStorage(updatedEntity);

      // Effectuer la suppression logique
      await SQLiteService.update(
        this.tableName,
        dataForStorage,
        'id = ?',
        [id]
      );

      // Ajouter à la file d'attente de synchronisation
      await this.addToSyncQueue(id, SyncOperation.DELETE, updatedEntity);

      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression de l'entité ${this.entityType}`, error);
      throw error;
    }
  }

  /**
   * Supprime physiquement une entité de la base de données (hard delete)
   * Cette méthode est généralement réservée à des cas spécifiques
   */
  public async hardDelete(id: string): Promise<boolean> {
    try {
      await SQLiteService.delete(this.tableName, 'id = ?', [id]);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression physique de l'entité ${this.entityType}`, error);
      throw error;
    }
  }

  /**
   * Récupère une entité par son ID
   */
  public async getById(id: string): Promise<T | null> {
    try {
      const result = await SQLiteService.select(
        this.tableName,
        ['*'],
        'id = ? AND (isDeleted = 0 OR isDeleted IS NULL)',
        [id]
      );

      if (result.length === 0) {
        return null;
      }

      // Désérialiser les objets complexes du stockage
      return this.deserializeFromStorage(result[0]);
    } catch (error) {
      logger.error(`Erreur lors de la récupération de l'entité ${this.entityType} par ID`, error);
      throw error;
    }
  }

  /**
   * Récupère toutes les entités
   */
  public async getAll(includeDeleted: boolean = false): Promise<T[]> {
    try {
      let whereClause = '';
      let params: any[] = [];

      if (!includeDeleted) {
        whereClause = 'isDeleted = 0 OR isDeleted IS NULL';
      }

      const result = await SQLiteService.select(
        this.tableName,
        ['*'],
        whereClause,
        params
      );

      // Désérialiser les résultats
      return result.map(item => this.deserializeFromStorage(item));
    } catch (error) {
      logger.error(`Erreur lors de la récupération de toutes les entités ${this.entityType}`, error);
      throw error;
    }
  }

  /**
   * Récupère les entités en fonction d'une condition donnée
   */
  public async query(
    whereClause: string,
    params: any[] = [],
    orderBy: string = '',
    limit: number = 0
  ): Promise<T[]> {
    try {
      // Par défaut, exclure les éléments supprimés
      const fullWhereClause = whereClause
        ? `(${whereClause}) AND (isDeleted = 0 OR isDeleted IS NULL)`
        : 'isDeleted = 0 OR isDeleted IS NULL';

      const result = await SQLiteService.select(
        this.tableName,
        ['*'],
        fullWhereClause,
        params,
        orderBy,
        limit
      );

      // Désérialiser les résultats
      return result.map(item => this.deserializeFromStorage(item));
    } catch (error) {
      logger.error(`Erreur lors de la requête sur les entités ${this.entityType}`, error);
      throw error;
    }
  }

  /**
   * Ajoute un élément à la file d'attente de synchronisation
   */
  protected async addToSyncQueue(
    entityId: string,
    operation: SyncOperation,
    data: any
  ): Promise<void> {
    try {
      await SQLiteService.insert('sync_queue', {
        entity_type: this.entityType,
        entity_id: entityId,
        operation,
        data: JSON.stringify(data),
        created_at: Date.now(),
        retry_count: 0,
        status: SyncStatus.PENDING
      });
    } catch (error) {
      logger.error(`Erreur lors de l'ajout à la file d'attente de synchronisation`, error);
      throw error;
    }
  }

  /**
   * Convertit une entité pour stockage en base de données
   * Sérialise les objets complexes en JSON
   */
  protected serializeForStorage(entity: T): Record<string, any> {
    const result: Record<string, any> = {};
    
    // Itérer sur toutes les propriétés
    for (const [key, value] of Object.entries(entity)) {
      // Si la valeur est un objet complexe (mais pas null), le sérialiser en JSON
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = JSON.stringify(value);
      } 
      // Si la valeur est un tableau, le sérialiser en JSON
      else if (Array.isArray(value)) {
        result[key] = JSON.stringify(value);
      }
      // Sinon, conserver la valeur telle quelle
      else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Convertit une entité depuis le stockage en base de données
   * Désérialise les objets complexes depuis le JSON
   */
  protected deserializeFromStorage(data: Record<string, any>): T {
    const result: Record<string, any> = {};
    
    // Itérer sur toutes les propriétés
    for (const [key, value] of Object.entries(data)) {
      // Tenter de désérialiser les chaînes JSON
      if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
        try {
          result[key] = JSON.parse(value);
        } catch (e) {
          // Si la désérialisation échoue, conserver la valeur telle quelle
          result[key] = value;
        }
      }
      // Sinon, conserver la valeur telle quelle
      else {
        result[key] = value;
      }
    }

    return result as T;
  }
}