/**
 * Types for supplier management
 */

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  city: string;
  country: string;
  postalCode?: string;
  taxId?: string;
  paymentTerms?: string;
  currency?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'pending' | 'blocked';
  category?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  accountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  iban?: string;
  swift?: string;
}

export interface SupplierListFilters {
  search?: string;
  status?: string[];
  category?: string[];
  city?: string[];
  country?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SupplierPerformance {
  orderHistory: {
    date: string;
    orderId: string;
    amount: number;
    items: number;
    status: string;
  }[];
  deliveryPerformance: {
    onTimeDeliveries: number;
    lateDeliveries: number;
    averageDeliveryTime: number;
  };
  qualityMetrics: {
    rejectionRate: number;
    defectRate: number;
    returnRate: number;
  };
  pricingTrends: {
    period: string;
    averagePrice: number;
    priceChange: number;
  }[];
  summary: {
    totalOrders: number;
    totalSpend: number;
    averageOrderValue: number;
    firstOrder: string;
    lastOrder: string;
  };
}