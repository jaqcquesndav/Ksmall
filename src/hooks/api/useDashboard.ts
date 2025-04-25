import { useCallback } from 'react';
import { useApi } from './useApi';
import API from '../../services/API';

/**
 * Type pour la disposition d'un tableau de bord
 */
export interface DashboardLayout {
  id: string;
  name: string;
  isDefault: boolean;
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

/**
 * Type pour un widget du tableau de bord
 */
export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'list' | 'table' | 'alert' | 'summary';
  title: string;
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
}

/**
 * Type pour les métriques
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
 * Type pour les alertes du tableau de bord
 */
export interface DashboardAlert {
  id: string;
  type: 'warning' | 'info' | 'critical' | 'success';
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  link?: string;
  actionText?: string;
}

/**
 * Options pour les requêtes du tableau de bord
 */
interface DashboardQueryOptions {
  startDate?: string;
  endDate?: string;
  granularity?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  includeComparison?: boolean;
  comparisonPeriod?: 'previous_period' | 'previous_year' | 'custom';
  comparisonStartDate?: string;
  comparisonEndDate?: string;
  filters?: Record<string, any>;
}

/**
 * Hook pour gérer les fonctionnalités du tableau de bord
 */
export function useDashboard() {
  /**
   * Hook pour récupérer les dispositions du tableau de bord
   */
  const useLayouts = () => {
    return useApi<DashboardLayout[]>(
      () => API.dashboard.getLayouts(),
      {
        autoFetch: true,
        fetchOnFocus: true,
        cache: {
          key: 'dashboard-layouts',
          ttl: 15 * 60 * 1000, // 15 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer une disposition spécifique
   */
  const useLayout = (id: string | null) => {
    return useApi<DashboardLayout>(
      () => id ? API.dashboard.getLayout(id) : Promise.reject('ID requis'),
      {
        autoFetch: !!id,
        fetchOnFocus: true,
        cache: {
          key: `dashboard-layout-${id}`,
          ttl: 10 * 60 * 1000, // 10 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour créer une disposition
   */
  const useCreateLayout = () => {
    return useApi<DashboardLayout>(
      (name: string, widgets: Partial<DashboardWidget>[] = []) => 
        API.dashboard.createLayout(name, widgets),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour mettre à jour une disposition
   */
  const useUpdateLayout = () => {
    return useApi<DashboardLayout>(
      (id: string, data: Partial<DashboardLayout>) => API.dashboard.updateLayout(id, data),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour supprimer une disposition
   */
  const useDeleteLayout = () => {
    return useApi<boolean>(
      (id: string) => API.dashboard.deleteLayout(id),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour récupérer les données d'un widget
   */
  const useWidgetData = (widgetId: string | null, options: DashboardQueryOptions = {}) => {
    return useApi<any>(
      () => widgetId ? API.dashboard.getWidgetData(widgetId, options) : Promise.reject('ID widget requis'),
      {
        autoFetch: !!widgetId,
        cache: {
          key: `widget-data-${widgetId}-${JSON.stringify(options)}`,
          ttl: 5 * 60 * 1000, // 5 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer les alertes
   */
  const useAlerts = () => {
    return useApi<DashboardAlert[]>(
      () => API.dashboard.getAlerts(),
      {
        autoFetch: true,
        fetchOnFocus: true,
        cache: {
          key: 'dashboard-alerts',
          ttl: 5 * 60 * 1000, // 5 minutes
          loadFromCacheFirst: false // Les alertes doivent être fraîches
        }
      }
    );
  };

  /**
   * Hook pour récupérer les métriques de business
   */
  const useBusinessMetrics = (options: DashboardQueryOptions = {}) => {
    return useApi<DashboardMetric[]>(
      () => API.dashboard.getBusinessMetrics(options),
      {
        autoFetch: true,
        cache: {
          key: `business-metrics-${JSON.stringify(options)}`,
          ttl: 10 * 60 * 1000, // 10 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer les métriques financières
   */
  const useFinancialMetrics = (options: DashboardQueryOptions = {}) => {
    return useApi<DashboardMetric[]>(
      () => API.dashboard.getFinancialMetrics(options),
      {
        autoFetch: true,
        cache: {
          key: `financial-metrics-${JSON.stringify(options)}`,
          ttl: 10 * 60 * 1000, // 10 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer les métriques d'inventaire
   */
  const useInventoryMetrics = (options: DashboardQueryOptions = {}) => {
    return useApi<DashboardMetric[]>(
      () => API.dashboard.getInventoryMetrics(options),
      {
        autoFetch: true,
        cache: {
          key: `inventory-metrics-${JSON.stringify(options)}`,
          ttl: 10 * 60 * 1000, // 10 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer les métriques de vente
   */
  const useSalesMetrics = (options: DashboardQueryOptions = {}) => {
    return useApi<DashboardMetric[]>(
      () => API.dashboard.getSalesMetrics(options),
      {
        autoFetch: true,
        cache: {
          key: `sales-metrics-${JSON.stringify(options)}`,
          ttl: 10 * 60 * 1000, // 10 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer les données d'un graphique
   */
  const useChartData = (
    chartType: string,
    options: DashboardQueryOptions = {}
  ) => {
    return useApi<any>(
      () => API.dashboard.getChartData(chartType, options),
      {
        autoFetch: true,
        cache: {
          key: `chart-data-${chartType}-${JSON.stringify(options)}`,
          ttl: 10 * 60 * 1000, // 10 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Fonction pour marquer une alerte comme lue
   */
  const markAlertAsRead = useCallback(async (alertId: string): Promise<boolean> => {
    try {
      return await API.dashboard.markAlertAsRead(alertId);
    } catch (error) {
      console.error('Erreur lors du marquage de l\'alerte comme lue:', error);
      throw error;
    }
  }, []);

  /**
   * Fonction pour exporter des données du tableau de bord
   */
  const exportDashboard = useCallback(async (
    layoutId: string,
    format: 'pdf' | 'xlsx' | 'csv',
    options: DashboardQueryOptions = {}
  ): Promise<string> => {
    try {
      const result = await API.dashboard.exportDashboard(layoutId, format, options);
      return result.url;
    } catch (error) {
      console.error('Erreur lors de l\'exportation du tableau de bord:', error);
      throw error;
    }
  }, []);

  return {
    useLayouts,
    useLayout,
    useCreateLayout,
    useUpdateLayout,
    useDeleteLayout,
    useWidgetData,
    useAlerts,
    useBusinessMetrics,
    useFinancialMetrics,
    useInventoryMetrics,
    useSalesMetrics,
    useChartData,
    markAlertAsRead,
    exportDashboard
  };
}