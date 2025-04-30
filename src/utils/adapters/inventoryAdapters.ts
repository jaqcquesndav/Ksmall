/**
 * Adaptateurs pour convertir entre les types de service et les types de domaine pour l'inventaire
 */
import {
  Product,
  ServiceProduct,
  Supplier,
  ServiceSupplier,
  InventoryTransaction,
  ServiceInventoryTransaction,
  Stock
} from '../../types/inventory';

/**
 * Convertit un produit du format service au format domaine
 */
export const serviceProductToDomainProduct = (item: ServiceProduct): Product => {
  return {
    id: item.id?.toString() || '',
    name: item.name,
    sku: item.product_code,
    description: item.description || '',
    price: item.price,
    costPrice: item.cost_price || 0,
    quantity: item.quantity,
    category: item.category_id?.toString() || '',
    imageUrl: item.images,
    barcode: item.product_code,
    location: '',
    supplier: '',
    minStockLevel: item.min_quantity || 0,
    isActive: true,
    attributes: {},
    createdAt: item.created_at || new Date().toISOString(),
    updatedAt: item.updated_at || new Date().toISOString()
  };
};

/**
 * Convertit un produit du format domaine au format service
 */
export const domainProductToServiceProduct = (product: Product): Omit<ServiceProduct, 'id'> => {
  return {
    product_code: product.sku || product.barcode || '',
    name: product.name,
    description: product.description || '',
    category_id: parseInt(product.category) || 0,
    price: product.price,
    cost_price: product.costPrice,
    quantity: product.quantity || 0,
    min_quantity: product.minStockLevel,
    unit_id: undefined,
    tax_id: undefined,
    images: product.imageUrl
  };
};

/**
 * Convertit un fournisseur du format service au format domaine
 */
export const serviceSupplierToDomainSupplier = (supplier: ServiceSupplier): Supplier => {
  return {
    id: supplier.id || '',
    name: supplier.name,
    contactPerson: supplier.contactPerson,
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address || '',
    city: '',
    country: '',
    notes: supplier.notes,
    paymentTerms: supplier.paymentTerms,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Convertit un fournisseur du format domaine au format service
 */
export const domainSupplierToServiceSupplier = (supplier: Supplier): ServiceSupplier => {
  return {
    id: supplier.id,
    name: supplier.name,
    contactPerson: supplier.contactPerson,
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address,
    paymentTerms: supplier.paymentTerms || '',
    notes: supplier.notes,
    productCategories: []
  };
};

/**
 * Convertit une transaction d'inventaire du format service au format domaine
 */
export const serviceTransactionToDomainTransaction = (
  transaction: ServiceInventoryTransaction
): InventoryTransaction => {
  // Prendre le premier élément du tableau items
  const item = transaction.items[0] || {
    productId: '',
    quantity: 0,
    unitPrice: 0,
    totalPrice: 0
  };
  
  return {
    id: transaction.id,
    type: transaction.type,
    date: transaction.date,
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
    reference: transaction.reference,
    notes: transaction.notes,
    createdBy: 'system',
    createdAt: transaction.date
  };
};

/**
 * Convertit une transaction d'inventaire du format domaine au format service
 */
export const domainTransactionToServiceTransaction = (
  transaction: Omit<InventoryTransaction, 'id'>
): Omit<ServiceInventoryTransaction, 'id'> => {
  return {
    type: transaction.type,
    date: transaction.date,
    reference: transaction.reference || `TX-${Date.now()}`,
    items: [{
      productId: transaction.productId,
      quantity: transaction.quantity,
      unitPrice: transaction.unitPrice,
      totalPrice: transaction.totalPrice
    }],
    status: 'completed',
    notes: transaction.notes,
    totalAmount: transaction.totalPrice
  };
};

/**
 * Crée un niveau de stock fictif pour un produit
 */
export const createMockStockLevel = (productId: string): Stock => {
  return {
    id: `stock-${productId}`,
    productId,
    quantity: 0,
    location: 'default',
    lastUpdated: new Date().toISOString()
  };
};