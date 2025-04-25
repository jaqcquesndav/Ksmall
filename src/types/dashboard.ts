/**
 * Types relatifs au dashboard
 */

import { Transaction } from './accounting';
import { Product, StockAlert } from './inventory';
import { Company } from './user';

/**
 * Interface pour les statistiques générales du dashboard
 */
export interface DashboardStats {
  revenue: {
    current: number;
    previous: number;
    percentChange: number;
    trend: number[];
  };
  expenses: {
    current: number;
    previous: number;
    percentChange: number;
    trend: number[];
  };
  profit: {
    current: number;
    previous: number;
    percentChange: number;
    trend: number[];
  };
  inventory: {
    totalValue: number;
    totalItems: number;
    lowStockItems: number;
  };
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  currency: string;
}

/**
 * Interface pour les widgets du dashboard
 */
export interface DashboardWidget {
  id: string;
  type: 'chart' | 'stats' | 'list' | 'alert' | 'custom';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: number;
  config: Record<string, any>;
  data?: any;
  isVisible: boolean;
}

/**
 * Interface pour une configuration de dashboard
 */
export interface DashboardConfig {
  id: string;
  name: string;
  userId: string;
  isDefault: boolean;
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface pour les données de performance d'entreprise
 */
export interface BusinessPerformance {
  timeframe: 'current_month' | 'last_month' | 'current_quarter' | 'last_quarter' | 'current_year' | 'last_year';
  kpis: {
    salesGrowth: number;
    profitMargin: number;
    inventoryTurnover: number;
    cashFlow: number;
    customersCount: number;
    averageOrderValue: number;
  };
  comparisonPeriod: string;
}

/**
 * Interface pour les alertes du dashboard
 */
export interface DashboardAlert {
  id: string;
  type: 'accounting' | 'inventory' | 'system' | 'financial';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  actionLink?: string;
  actionText?: string;
  dismissed: boolean;
  createdAt: string;
}

/**
 * Interface pour les données de trésorerie
 */
export interface CashFlowData {
  currentBalance: number;
  inflow: number;
  outflow: number;
  netCashFlow: number;
  forecastedBalance: number;
  period: 'weekly' | 'monthly' | 'quarterly';
  historicalData: {
    date: string;
    balance: number;
  }[];
  projectedData: {
    date: string;
    balance: number;
    isProjected: boolean;
  }[];
}

/**
 * Interface pour un calendrier d'événements
 */
export interface EventCalendar {
  events: CalendarEvent[];
  startDate: string;
  endDate: string;
}

/**
 * Interface pour un événement de calendrier
 */
export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  allDay: boolean;
  type: 'payment' | 'tax' | 'meeting' | 'deadline' | 'other';
  description?: string;
  completed: boolean;
  color?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface pour un résumé d'activité récente
 */
export interface RecentActivitySummary {
  transactions: Transaction[];
  stockMovements: StockAlert[];
  systemEvents: {
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }[];
}

/**
 * Interface pour les options de requête du dashboard
 */
export interface DashboardQueryOptions {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  compareWithPrevious?: boolean;
  currency?: string;
  widgets?: string[];
}