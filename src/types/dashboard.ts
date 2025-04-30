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
 * Options pour les requêtes du tableau de bord
 */
export interface DashboardQueryOptions {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  compareWithPrevious?: boolean;
  currency?: string;
  widgets?: string[];
  filters?: Record<string, any>;
}

/**
 * Interface pour les métriques du dashboard
 */
export interface DashboardMetric {
  key: string;
  label: string;
  value: number;
  unit?: string;
  previousValue?: number;
  trend?: number;
  formatter?: string;
  status?: 'positive' | 'negative' | 'neutral';
}

/**
 * Interface pour les widgets du dashboard
 */
export interface DashboardWidget {
  id: string;
  type: 'chart' | 'stats' | 'list' | 'table' | 'alert' | 'summary' | 'custom';
  title: string;
  subtitle?: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config: {
    dataSource: string;
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'radar' | 'scatter';
    timeRange?: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
    filters?: Record<string, any>;
    [key: string]: any;
  };
  data?: any;
  isVisible?: boolean;
  refreshInterval?: number; // en minutes, 0 pour pas de rafraîchissement auto
}

/**
 * Interface pour une configuration de dashboard ou layout
 */
export interface DashboardLayout {
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
  type: 'warning' | 'info' | 'critical' | 'success' | 'accounting' | 'inventory' | 'system' | 'financial';
  severity?: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  date?: string;
  isRead?: boolean;
  dismissed?: boolean;
  createdAt?: string;
  link?: string;
  actionLink?: string;
  actionText?: string;
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
 * Interface pour les données de chart
 */
export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string | string;
    strokeWidth?: number;
    colors?: string[];
  }[];
}

/**
 * Interface pour les props de Chart
 */
export interface ChartProps {
  data?: ChartData;
  width?: number;
  height?: number;
  type?: 'line' | 'bar' | 'pie' | 'scatter';
  title?: string;
  chartConfig?: any;
  style?: any;
}

/**
 * Interface pour les données d'analyse
 */
export interface AnalysisChartData {
  type: 'bar' | 'pie' | 'line';
  title: string;
  data: any;
}

export interface AnalysisData {
  title: string;
  summary: string;
  content?: string;
  charts?: AnalysisChartData[];
  insights: string[];
  chartCode?: string;
}

/**
 * Interface pour les données de transactions récentes
 */
export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  status: string;
  account?: string;
  reference?: string;
  journal?: string;
}

/**
 * Interface pour les données d'activités récentes
 */
export interface Activity {
  id: string;
  type: 'journal_entry' | 'transaction' | 'inventory' | 'user_action';
  title: string;
  description?: string;
  amount?: number;
  timestamp: string;
  status?: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

/**
 * Interface pour les données d'abonnement
 */
export interface SubscriptionData {
  plan: string;
  expiryDate: Date;
  isActive: boolean;
  features?: string[];
  tokens: {
    total: number;
    used: number;
    remaining: number;
    bonusDate: Date;
    bonusAmount: number;
  };
  creditScore?: number;
  usedTokens?: number;
  remainingTokens?: number;
}

/**
 * Interface pour les props des widgets de dashboard
 */
export interface RecentTransactionsWidgetProps {
  transactions: Transaction[];
  isLandscape?: boolean;
}

export interface RecentActivitiesWidgetProps {
  activities: Activity[];
}

export interface SubscriptionStatusWidgetProps {
  subscriptionData?: SubscriptionData;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isLandscape?: boolean;
  style?: any;
}

export interface AccountBalanceWidgetProps {
  accountName: string;
  accountType: string;
  balance: number;
  currency?: string;
  provider?: string;
  onPress?: () => void;
  theme?: any;
}

export interface AnalysisWidgetProps {
  data: AnalysisData;
}

export interface QuickActionCardProps {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
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