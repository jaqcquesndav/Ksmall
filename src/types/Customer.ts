/**
 * Types for customer management
 */

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  type?: CustomerType;
  status: CustomerStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastOrder?: string;
  totalOrders?: number;
  totalSpent?: number;
  avatar?: string;
}

export type CustomerType = 'individual' | 'company' | 'organization' | 'government';

export type CustomerStatus = 'active' | 'inactive' | 'blocked' | 'pending';

export interface CustomerListFilters {
  search?: string;
  status?: CustomerStatus[];
  type?: CustomerType[];
  city?: string[];
  country?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minSpent?: number;
  maxSpent?: number;
  hasOrders?: boolean;
}

export interface CustomerAnalytics {
  purchaseHistory: {
    date: string;
    amount: number;
    items: number;
  }[];
  frequentlyPurchased: {
    productId: string;
    productName: string;
    quantity: number;
    lastPurchased: string;
  }[];
  spendingTrend: {
    period: string;
    amount: number;
    previousPeriodChange: number;
  }[];
  summary: {
    totalSpent: number;
    averageOrderValue: number;
    totalOrders: number;
    firstPurchase: string;
    lastPurchase: string;
    purchaseFrequency: number;
  };
}