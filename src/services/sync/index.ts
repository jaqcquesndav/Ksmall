/**
 * Module central pour les services de synchronisation
 * Ce fichier exporte tous les services liés à la synchronisation des données
 */

import syncService from './SyncService';
import customerSyncService from './CustomerSyncService';
import productSyncService from './ProductSyncService';
import transactionSyncService from './TransactionSyncService';
import inventorySyncService from './InventorySyncService';

// Exporter le service principal
export { syncService };

// Exporter les services spécifiques
export { 
  customerSyncService,
  productSyncService, 
  transactionSyncService,
  inventorySyncService 
};

// Exporter par défaut le service principal pour la rétrocompatibilité
export default syncService;