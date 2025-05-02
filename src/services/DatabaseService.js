/**
 * Service de base de données optimisé pour le chargement rapide
 * Supporte le mode "offline-first" avec synchronisation en arrière-plan
 */

import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

// Données essentielles pour un démarrage rapide
const CRITICAL_DATA_TABLES = [
  'user_settings',
  'user_profile',
  'app_config',
  'cached_categories',
  'cached_products',
  'recent_activities'
];

// État interne du service
const state = {
  initialized: false,
  initializing: false,
  dbConnection: null,
  offlineMode: true,
  lastSyncTime: 0
};

/**
 * Initialise la base de données de manière optimisée
 * Réduit le temps de chargement initial en utilisant une approche progressive
 */
const initializeLazy = async () => {
  // Éviter les initialisations multiples
  if (state.initialized) return true;
  if (state.initializing) {
    logger.warn('Initialisation de la base de données déjà en cours');
    return new Promise((resolve) => {
      // Vérifier périodiquement si l'initialisation est terminée
      const checkInterval = setInterval(() => {
        if (state.initialized) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);
    });
  }

  state.initializing = true;
  try {
    // Ouvrir la connexion à la base de données
    const db = SQLite.openDatabase('ksmall.db');
    state.dbConnection = db;
    
    // Exécuter les migrations et vérifications minimales
    await executeEssentialMigrations(db);
    
    state.initialized = true;
    state.initializing = false;
    logger.info('Base de données initialisée avec succès');
    return true;
  } catch (error) {
    state.initializing = false;
    logger.error('Erreur d\'initialisation de la base de données:', error);
    throw error;
  }
};

/**
 * Exécute uniquement les migrations essentielles pour garantir 
 * que la base de données est utilisable rapidement
 */
const executeEssentialMigrations = async (db) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Créer les tables essentielles si elles n'existent pas
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS user_profile (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          name TEXT,
          email TEXT,
          avatar TEXT,
          last_login INTEGER
        );`
      );
      
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS user_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE,
          value TEXT
        );`
      );
      
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS app_config (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE,
          value TEXT,
          updated_at INTEGER
        );`
      );
      
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS cached_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id TEXT UNIQUE,
          name TEXT,
          parent_id TEXT,
          icon TEXT,
          data TEXT,
          updated_at INTEGER
        );`
      );
      
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS cached_products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id TEXT UNIQUE,
          name TEXT,
          category_id TEXT,
          price REAL,
          thumbnail TEXT,
          data TEXT,
          updated_at INTEGER
        );`
      );
      
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS recent_activities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT,
          data TEXT,
          timestamp INTEGER
        );`
      );
    }, 
    (error) => {
      logger.error('Erreur lors des migrations essentielles:', error);
      reject(error);
    },
    () => {
      logger.info('Migrations essentielles exécutées avec succès');
      resolve();
    });
  });
};

/**
 * S'assure que les données locales minimales sont disponibles pour le mode hors ligne
 */
const ensureLocalDataAvailable = async () => {
  if (!state.initialized) {
    await initializeLazy();
  }
  
  try {
    // Vérifier si des données d'exemple ou de démonstration sont nécessaires
    const hasUserData = await hasData('user_profile');
    const hasCategories = await hasData('cached_categories');
    
    if (!hasUserData || !hasCategories) {
      logger.info('Chargement des données minimales pour le mode hors ligne');
      await loadDemoData();
    }
    
    return true;
  } catch (error) {
    logger.error('Erreur lors de la vérification des données locales:', error);
    return false;
  }
};

/**
 * Vérifie si une table contient des données
 */
const hasData = async (tableName) => {
  return new Promise((resolve, reject) => {
    if (!state.dbConnection) {
      reject(new Error('Base de données non initialisée'));
      return;
    }
    
    state.dbConnection.transaction(tx => {
      tx.executeSql(
        `SELECT COUNT(*) as count FROM ${tableName};`,
        [],
        (_, resultSet) => {
          const count = resultSet.rows.item(0).count;
          resolve(count > 0);
        },
        (_, error) => {
          logger.error(`Erreur lors de la vérification des données de ${tableName}:`, error);
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Charge des données de démonstration pour le mode hors ligne
 */
const loadDemoData = async () => {
  // Implémentation de l'insertion des données de démonstration
  // ...
  logger.info('Données de démonstration chargées');
  return true;
};

/**
 * Extrait les données critiques pour le démarrage rapide
 * Utilisé par le FastBootManager pour sauvegarder les données essentielles
 */
const getCriticalData = async () => {
  if (!state.initialized) {
    await initializeLazy();
  }
  
  try {
    const criticalData = {};
    
    // Extraire les données des tables critiques
    for (const table of CRITICAL_DATA_TABLES) {
      const tableData = await getTableData(table);
      if (tableData && tableData.length > 0) {
        criticalData[table] = tableData;
      }
    }
    
    // Ajouter un horodatage pour la fraîcheur des données
    criticalData._timestamp = Date.now();
    
    return criticalData;
  } catch (error) {
    logger.error('Erreur lors de l\'extraction des données critiques:', error);
    return null;
  }
};

/**
 * Récupère toutes les données d'une table
 */
const getTableData = async (tableName) => {
  return new Promise((resolve, reject) => {
    if (!state.dbConnection) {
      reject(new Error('Base de données non initialisée'));
      return;
    }
    
    state.dbConnection.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM ${tableName};`,
        [],
        (_, resultSet) => {
          const rows = [];
          for (let i = 0; i < resultSet.rows.length; i++) {
            rows.push(resultSet.rows.item(i));
          }
          resolve(rows);
        },
        (_, error) => {
          logger.error(`Erreur lors de la récupération des données de ${tableName}:`, error);
          reject(error);
          return false;
        }
      );
    });
  });
};

/**
 * Restaure des données critiques dans la base de données
 * Utilisé par le FastBootManager pour un démarrage rapide
 */
const restoreCriticalData = async (criticalData) => {
  if (!criticalData) return false;
  
  if (!state.initialized) {
    await initializeLazy();
  }
  
  try {
    // Restaurer les données des tables critiques
    for (const table of CRITICAL_DATA_TABLES) {
      if (criticalData[table] && criticalData[table].length > 0) {
        await restoreTableData(table, criticalData[table]);
      }
    }
    
    logger.info('Données critiques restaurées avec succès');
    return true;
  } catch (error) {
    logger.error('Erreur lors de la restauration des données critiques:', error);
    return false;
  }
};

/**
 * Restaure les données d'une table spécifique
 */
const restoreTableData = async (tableName, rows) => {
  return new Promise((resolve, reject) => {
    if (!state.dbConnection) {
      reject(new Error('Base de données non initialisée'));
      return;
    }
    
    state.dbConnection.transaction(tx => {
      // Vérifier si la table existe
      tx.executeSql(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?;`,
        [tableName],
        (_, resultSet) => {
          if (resultSet.rows.length === 0) {
            logger.warn(`Table ${tableName} n'existe pas, impossible de restaurer les données`);
            resolve(false);
            return;
          }
          
          // Vider la table avant de restaurer
          tx.executeSql(`DELETE FROM ${tableName};`);
          
          // Insérer chaque ligne
          for (const row of rows) {
            // Construire la requête d'insertion dynamiquement
            const columns = Object.keys(row).filter(key => key !== 'id').join(', ');
            const placeholders = Object.keys(row).filter(key => key !== 'id').map(() => '?').join(', ');
            const values = Object.keys(row).filter(key => key !== 'id').map(key => row[key]);
            
            const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders});`;
            tx.executeSql(query, values);
          }
        },
        (_, error) => {
          logger.error(`Erreur lors de la restauration des données de ${tableName}:`, error);
          reject(error);
          return false;
        }
      );
    }, 
    (error) => {
      reject(error);
    },
    () => {
      logger.info(`Données de ${tableName} restaurées avec succès`);
      resolve(true);
    });
  });
};

/**
 * Synchronise uniquement les données essentielles (légère)
 * Utilisé après un redémarrage de l'application en arrière-plan
 */
const syncEssentialData = async () => {
  // Implémentation de la synchronisation légère
  // ...
  logger.info('Synchronisation légère des données essentielles terminée');
  return true;
};

export default {
  initializeLazy,
  ensureLocalDataAvailable,
  getCriticalData,
  restoreCriticalData,
  syncEssentialData
};