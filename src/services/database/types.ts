/**
 * Types et interfaces pour la synchronisation et la persistance locale
 */

// Statut de synchronisation
export enum SyncStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Types d'opérations de synchronisation
export enum SyncOperation {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

// Types d'entités synchronisables
export enum EntityType {
  PRODUCT = 'product',
  CUSTOMER = 'customer',
  TRANSACTION = 'transaction',
  INVENTORY = 'inventory',
  ORDER = 'order',
  INVOICE = 'invoice',
  USER = 'user',
  // Ajouter d'autres types d'entités selon les besoins
}

// Interface pour les métadonnées de synchronisation
export interface SyncMetadata {
  entityType: EntityType;
  lastSyncTime: number;
  syncStatus: SyncStatus;
}

// Interface pour un élément de la file d'attente de synchronisation
export interface SyncQueueItem {
  id?: number;
  entityType: EntityType;
  entityId: string;
  operation: SyncOperation;
  data: string; // Données JSON sérialisées
  createdAt: number;
  retryCount: number;
  status: SyncStatus;
  error?: string;
}

// Interface de base pour les objets synchronisables
export interface Synchronizable {
  id: string;
  createdAt: number;
  updatedAt: number;
  isDeleted: boolean;
  localVersion?: number; // Version locale utilisée pour gérer les conflits
  serverVersion?: number; // Version du serveur utilisée pour gérer les conflits
  syncStatus?: SyncStatus;
  lastSyncTime?: number;
}

// Interface pour les produits
export interface Product extends Synchronizable {
  name: string;
  description?: string;
  price: number;
  currency: string;
  sku: string;
  barcode?: string;
  categoryId?: string;
  imageUrl?: string;
  stock: number;
  isActive: boolean;
  attributes?: Record<string, any>; // Attributs dynamiques
}

// Interface pour les clients
export interface Customer extends Synchronizable {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  loyaltyPoints?: number;
  notes?: string;
  totalPurchases?: number;
  lastVisitDate?: number;
}

// Interface pour les transactions
export interface Transaction extends Synchronizable {
  customerId?: string;
  totalAmount: number;
  currency: string;
  items: TransactionItem[];
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  discount?: number;
  tax?: number;
  notes?: string;
  receiptNumber: string;
  employeeId?: string;
  storeId?: string;
  deviceId: string;
}

// Interface pour les éléments d'une transaction
export interface TransactionItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  totalPrice: number;
}

// Interface pour les niveaux de stock d'inventaire
export interface InventoryItem extends Synchronizable {
  productId: string;
  quantity: number;
  storeId?: string;
  minimumLevel?: number;
  maximumLevel?: number;
  reorderLevel?: number;
  lastStockTakeDate?: number;
}

// Interface pour fournir des informations sur la configuration de la table
export interface TableConfig {
  name: string;
  createTableSQL: string;
  indexes?: string[];
}

// Interface pour les fournisseurs
export interface Supplier extends Synchronizable {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  notes?: string;
  productCategories?: string[];
}