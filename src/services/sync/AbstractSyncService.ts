import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import * as zlib from 'react-native-zlib';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BaseSyncService, SyncPriority, SyncCheckpoint, AdvancedSyncOptions } from './BaseSyncService';
import { SyncOptions, SyncTable } from './SyncService';
import DatabaseService from '../DatabaseService';
import logger from '../../utils/logger';
import NetInfo from '@react-native-community/netinfo';

/**
 * Classe abstraite fournissant une implémentation de base des fonctionnalités
 * de synchronisation avancées comme la gestion par lots et la compression
 */
export abstract class AbstractSyncService implements BaseSyncService {
    protected db: SQLite.WebSQLDatabase | null = null;
    protected tableName: string;
    protected endpoint: string;
    protected idField: string;
    protected lastSyncField: string;
    protected syncCheckpointKey: string;
    protected syncPriority: SyncPriority = SyncPriority.MEDIUM;
    
    /**
     * Constructeur pour le service de synchronisation abstrait
     * @param tableConfig Configuration de la table à synchroniser
     */
    constructor(protected tableConfig: SyncTable) {
        this.tableName = tableConfig.name;
        this.endpoint = tableConfig.endpoint;
        this.idField = tableConfig.idField;
        this.lastSyncField = tableConfig.lastSyncField;
        this.syncCheckpointKey = `sync_checkpoint_${this.tableName}`;
    }
    
    /**
     * Initialise la base de données
     */
    protected async initDb(): Promise<void> {
        if (!this.db) {
            this.db = await DatabaseService.getDatabase();
        }
    }
    
    /**
     * Méthode abstraite pour synchroniser les données
     * Les classes dérivées doivent implémenter cette méthode
     */
    abstract synchronize(forceFullSync?: boolean, options?: SyncOptions & AdvancedSyncOptions): Promise<boolean>;
    
    /**
     * Méthode abstraite pour récupérer les données du serveur
     * Les classes dérivées doivent implémenter cette méthode
     */
    abstract pullFromServer(forceFullSync?: boolean, lastSyncTime?: Date, options?: AdvancedSyncOptions): Promise<number>;
    
    /**
     * Méthode abstraite pour envoyer les données au serveur
     * Les classes dérivées doivent implémenter cette méthode
     */
    abstract pushToServer(onlyModified?: boolean, options?: AdvancedSyncOptions): Promise<number>;
    
    /**
     * Assure que la structure locale existe
     * Par défaut, crée une table simple avec un ID et un champ timestamp
     */
    async ensureLocalStructure(): Promise<void> {
        await this.initDb();
        if (!this.db) {
            throw new Error('Base de données non initialisée');
        }
        
        await DatabaseService.createTableIfNotExists(
            this.db,
            this.tableName,
            `${this.idField} TEXT PRIMARY KEY, 
            data TEXT, 
            ${this.lastSyncField} TEXT, 
            is_synced INTEGER DEFAULT 0, 
            is_deleted INTEGER DEFAULT 0, 
            local_modified_at TEXT`
        );
        
        logger.debug(`Structure locale pour ${this.tableName} vérifiée`);
    }
    
    /**
     * Résoudre les conflits entre les données locales et distantes
     */
    async resolveConflict(localData: any, serverData: any, strategy: 'LOCAL' | 'REMOTE' | 'MERGE' | 'ASK'): Promise<any> {
        switch (strategy) {
            case 'LOCAL':
                return localData;
            case 'REMOTE':
                return serverData;
            case 'MERGE':
                // Implémentation par défaut de fusion - priorité aux données du serveur
                return {...localData, ...serverData};
            case 'ASK':
                // Par défaut, on ne peut pas demander à l'utilisateur ici, donc on utilise REMOTE
                logger.warn(`Stratégie ASK non supportée dans l'implémentation de base, utilisation de REMOTE`);
                return serverData;
            default:
                return serverData;
        }
    }
    
    /**
     * Obtient la priorité de synchronisation pour ce service
     */
    getPriority(): SyncPriority {
        return this.syncPriority;
    }
    
    /**
     * Définit la priorité de synchronisation pour ce service
     */
    setPriority(priority: SyncPriority): void {
        this.syncPriority = priority;
    }
    
    /**
     * Synchronise un lot de données
     */
    async synchronizeBatch(
        batchIndex: number,
        batchSize: number,
        checkpoint?: SyncCheckpoint
    ): Promise<SyncCheckpoint> {
        await this.initDb();
        if (!this.db) {
            throw new Error('Base de données non initialisée');
        }
        
        // Si nous avons un point de contrôle, l'utiliser
        const currentCheckpoint = checkpoint || {
            processedCount: 0,
            batchIndex: batchIndex,
            completed: false
        };
        
        try {
            // Déterminer l'offset pour la requête
            const offset = batchIndex * batchSize;
            
            // Récupérer le lot de données à synchroniser
            const [result] = await DatabaseService.executeQuery(
                this.db,
                `SELECT * FROM ${this.tableName} 
                 WHERE is_synced = 0 
                 ORDER BY ${this.idField} 
                 LIMIT ? OFFSET ?`,
                [batchSize, offset]
            );
            
            if (result.rows.length === 0) {
                // Plus de données à synchroniser
                return {
                    ...currentCheckpoint,
                    completed: true
                };
            }
            
            // Traiter chaque élément du lot
            let processedCount = 0;
            for (let i = 0; i < result.rows.length; i++) {
                const item = result.rows.item(i);
                
                // Vérifier la connexion réseau avant chaque opération
                const netInfo = await NetInfo.fetch();
                if (!netInfo.isConnected) {
                    // Sauvegarder le point de contrôle actuel et sortir
                    return {
                        ...currentCheckpoint,
                        processedCount: currentCheckpoint.processedCount + processedCount,
                        lastSyncedId: processedCount > 0 ? result.rows.item(processedCount - 1)[this.idField] : currentCheckpoint.lastSyncedId,
                        completed: false
                    };
                }
                
                try {
                    // Envoyer l'élément au serveur (à implémenter par la classe dérivée)
                    await this.syncSingleItem(item);
                    
                    // Marquer comme synchronisé dans la base de données locale
                    await DatabaseService.executeQuery(
                        this.db,
                        `UPDATE ${this.tableName} SET is_synced = 1, ${this.lastSyncField} = ? WHERE ${this.idField} = ?`,
                        [new Date().toISOString(), item[this.idField]]
                    );
                    
                    processedCount++;
                } catch (error) {
                    logger.error(`Erreur lors de la synchronisation de l'élément ${item[this.idField]}:`, error);
                }
            }
            
            // Mettre à jour et renvoyer le point de contrôle
            return {
                ...currentCheckpoint,
                processedCount: currentCheckpoint.processedCount + processedCount,
                lastSyncedId: result.rows.item(result.rows.length - 1)[this.idField],
                batchIndex: batchIndex + 1,
                completed: result.rows.length < batchSize
            };
        } catch (error) {
            logger.error(`Erreur lors de la synchronisation du lot ${batchIndex} pour ${this.tableName}:`, error);
            throw error;
        }
    }
    
    /**
     * Méthode à implémenter par les classes dérivées pour synchroniser un élément
     */
    protected abstract syncSingleItem(item: any): Promise<void>;
    
    /**
     * Sauvegarde le point de contrôle pour reprise ultérieure
     */
    async saveCheckpoint(checkpoint: SyncCheckpoint): Promise<void> {
        try {
            await AsyncStorage.setItem(
                this.syncCheckpointKey, 
                JSON.stringify({
                    ...checkpoint,
                    lastSyncTime: checkpoint.lastSyncTime ? checkpoint.lastSyncTime.toISOString() : undefined
                })
            );
            logger.debug(`Point de contrôle sauvegardé pour ${this.tableName}`);
        } catch (error) {
            logger.error(`Erreur lors de la sauvegarde du point de contrôle pour ${this.tableName}:`, error);
        }
    }
    
    /**
     * Charge le dernier point de contrôle
     */
    async loadCheckpoint(): Promise<SyncCheckpoint | null> {
        try {
            const checkpointStr = await AsyncStorage.getItem(this.syncCheckpointKey);
            if (!checkpointStr) {
                return null;
            }
            
            const checkpoint = JSON.parse(checkpointStr);
            // Convertir la date de chaîne ISO à objet Date
            if (checkpoint.lastSyncTime) {
                checkpoint.lastSyncTime = new Date(checkpoint.lastSyncTime);
            }
            
            return checkpoint;
        } catch (error) {
            logger.error(`Erreur lors du chargement du point de contrôle pour ${this.tableName}:`, error);
            return null;
        }
    }
    
    /**
     * Compresse les données pour l'envoi
     */
    async compressData(data: any): Promise<string> {
        try {
            const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
            // Utiliser zlib pour comprimer les données
            const compressed = await zlib.deflate(jsonString);
            return compressed;
        } catch (error) {
            logger.error('Erreur lors de la compression des données:', error);
            // En cas d'échec de compression, renvoyer les données non compressées
            return JSON.stringify(data);
        }
    }
    
    /**
     * Décompresse les données reçues
     */
    async decompressData(data: string): Promise<any> {
        try {
            // Vérifier si les données sont compressées
            if (typeof data !== 'string' || !data.startsWith('x')) {
                // Données non compressées ou format incorrect
                return typeof data === 'string' ? JSON.parse(data) : data;
            }
            
            // Utiliser zlib pour décompresser les données
            const decompressed = await zlib.inflate(data);
            return JSON.parse(decompressed);
        } catch (error) {
            logger.error('Erreur lors de la décompression des données:', error);
            // En cas d'échec de décompression, essayer de parser les données telles quelles
            return typeof data === 'string' ? JSON.parse(data) : data;
        }
    }
    
    /**
     * Vérifie si un fichier de sauvegarde local existe pour la reprise
     */
    protected async hasBackupFile(): Promise<boolean> {
        const backupPath = `${FileSystem.documentDirectory}sync_backup_${this.tableName}.json`;
        try {
            const info = await FileSystem.getInfoAsync(backupPath);
            return info.exists;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Sauvegarde des données localement pour une reprise ultérieure
     * Utile pour les grandes quantités de données
     */
    protected async saveBackupData(data: any): Promise<void> {
        try {
            const backupPath = `${FileSystem.documentDirectory}sync_backup_${this.tableName}.json`;
            await FileSystem.writeAsStringAsync(backupPath, JSON.stringify(data));
        } catch (error) {
            logger.error(`Erreur lors de la sauvegarde des données de ${this.tableName}:`, error);
        }
    }
    
    /**
     * Charge les données sauvegardées localement
     */
    protected async loadBackupData(): Promise<any> {
        try {
            const backupPath = `${FileSystem.documentDirectory}sync_backup_${this.tableName}.json`;
            const data = await FileSystem.readAsStringAsync(backupPath);
            return JSON.parse(data);
        } catch (error) {
            logger.error(`Erreur lors du chargement des données de sauvegarde de ${this.tableName}:`, error);
            return null;
        }
    }
    
    /**
     * Supprime le fichier de sauvegarde local
     */
    protected async removeBackupFile(): Promise<void> {
        try {
            const backupPath = `${FileSystem.documentDirectory}sync_backup_${this.tableName}.json`;
            await FileSystem.deleteAsync(backupPath);
        } catch (error) {
            logger.error(`Erreur lors de la suppression du fichier de sauvegarde de ${this.tableName}:`, error);
        }
    }
}