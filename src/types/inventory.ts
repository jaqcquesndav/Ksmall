/**
 * Types relatifs à l'inventaire
 */

/**
 * Type représentant un produit
 */
export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  costPrice: number;
  quantity: number;
  category: string;
  imageUrl?: string;
  barcode?: string;
  location?: string;
  supplier?: string;
  minStockLevel?: number;
  isActive: boolean;
  attributes?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Type représentant une catégorie de produits
 */
export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  order: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Type représentant le stock d'un produit
 */
export interface Stock {
  id: string;
  productId: string;
  quantity: number;
  location: string;
  lotNumber?: string;
  expiryDate?: string;
  lastUpdated: string;
}

/**
 * Type représentant un mouvement de stock
 */
export interface StockMovement {
  id: string;
  productId: string;
  date: string;
  quantity: number;
  type: 'in' | 'out' | 'adjustment';
  reason: string;
  reference?: string;
  performedBy: string;
  location?: string;
  createdAt: string;
}

/**
 * Type représentant un fournisseur
 */
export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Type représentant une transaction d'inventaire
 */
export interface InventoryTransaction {
  id: string;
  type: 'purchase' | 'sale' | 'adjustment';
  date: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

/**
 * Type représentant une transaction d'inventaire dans le service
 */
export interface ServiceInventoryTransaction {
  id: string;
  type: 'purchase' | 'sale' | 'adjustment';
  date: string;
  reference?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  status: 'completed' | 'pending' | 'cancelled';
  notes?: string;
  totalAmount: number;
}

/**
 * Type représentant un produit dans le service
 */
export interface ServiceProduct {
  id?: number;
  product_code: string;
  name: string;
  description?: string;
  category_id: number;
  price: number;
  cost_price?: number;
  quantity: number;
  min_quantity?: number;
  unit_id?: number;
  tax_id?: number;
  images?: string;
  created_at?: string;
  updated_at?: string;
  sync_status?: string;
}

/**
 * Type représentant un fournisseur dans le service
 */
export interface ServiceSupplier {
  id?: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  paymentTerms: string;
  notes?: string;
  productCategories: string[];
}

/**
 * Type représentant une commande d'achat
 */
export interface PurchaseOrder {
  id: string;
  reference: string;
  supplierId: string;
  status: 'draft' | 'sent' | 'partial' | 'completed' | 'cancelled';
  date: string;
  expectedDelivery?: string;
  items: PurchaseOrderItem[];
  notes?: string;
  total: number;
  tax?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Type représentant un élément de commande d'achat
 */
export interface PurchaseOrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  receivedQuantity: number;
  total: number;
}

/**
 * Type représentant un emplacement de stockage
 */
export interface StorageLocation {
  id: string;
  name: string;
  description?: string;
  address?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Type représentant un inventaire physique
 */
export interface StockTake {
  id: string;
  reference: string;
  locationId: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  notes?: string;
  createdBy: string;
  completedBy?: string;
  items: StockTakeItem[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Type représentant un élément d'inventaire physique
 */
export interface StockTakeItem {
  id: string;
  productId: string;
  expectedQuantity: number;
  actualQuantity: number;
  discrepancy: number;
  notes?: string;
}

/**
 * Type représentant une alerte de stock
 */
export interface StockAlert {
  id: string;
  productId: string;
  type: 'low_stock' | 'overstock' | 'expiry';
  threshold: number;
  currentValue: number;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}