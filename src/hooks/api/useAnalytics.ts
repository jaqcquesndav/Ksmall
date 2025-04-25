import { useCallback } from 'react';
import { useApi } from './useApi';
import API from '../../services/API';

/**
 * Type représentant un rapport analytique
 */
export interface AnalyticsReport {
  id: string;
  title: string;
  type: 'financial' | 'inventory' | 'sales' | 'user_activity' | 'custom';
  startDate: string;
  endDate: string;
  createdAt: string;
  parameters?: Record<string, any>;
  data: any;
  summary?: {
    insights: string[];
    recommendations: string[];
    metrics: Record<string, number>;
  };
}

/**
 * Type pour une série de données temporelles
 */
export interface TimeSeriesData {
  name: string;
  data: Array<{
    x: string; // Date
    y: number;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Type pour une prévision
 */
export interface ForecastData extends TimeSeriesData {
  predictions: Array<{
    x: string; // Date
    y: number;
    confidenceLow?: number;
    confidenceHigh?: number;
  }>;
  accuracy?: number;
  method: string;
}

/**
 * Options pour les requêtes d'analytique
 */
interface AnalyticsQueryOptions {
  startDate?: string;
  endDate?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  filters?: Record<string, any>;
  includeComparison?: boolean;
  comparisonPeriod?: 'previous_period' | 'previous_year' | 'custom';
  comparisonStartDate?: string;
  comparisonEndDate?: string;
  limit?: number;
  metrics?: string[];
  dimensions?: string[];
}

/**
 * Type pour les options d'exportation
 */
interface ExportOptions {
  format: 'pdf' | 'xlsx' | 'csv' | 'json';
  includeSummary?: boolean;
  includeCharts?: boolean;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Hook pour gérer les fonctionnalités d'analyse
 */
export function useAnalytics() {
  /**
   * Hook pour récupérer les rapports sauvegardés
   */
  const useSavedReports = () => {
    return useApi<AnalyticsReport[]>(
      () => API.analytics.getSavedReports(),
      {
        autoFetch: true,
        cache: {
          key: 'saved-reports',
          ttl: 15 * 60 * 1000, // 15 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer un rapport spécifique
   */
  const useReport = (reportId: string | null) => {
    return useApi<AnalyticsReport>(
      () => reportId ? API.analytics.getReport(reportId) : Promise.reject('ID rapport requis'),
      {
        autoFetch: !!reportId,
        cache: {
          key: `report-${reportId}`,
          ttl: 15 * 60 * 1000, // 15 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour créer un rapport
   */
  const useCreateReport = () => {
    return useApi<AnalyticsReport>(
      (
        type: string,
        title: string,
        options: AnalyticsQueryOptions
      ) => API.analytics.createReport(type, title, options),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour supprimer un rapport
   */
  const useDeleteReport = () => {
    return useApi<boolean>(
      (reportId: string) => API.analytics.deleteReport(reportId),
      { autoFetch: false }
    );
  };

  /**
   * Hook pour récupérer les données de vente
   */
  const useSalesData = (options: AnalyticsQueryOptions = {}) => {
    return useApi<TimeSeriesData[]>(
      () => API.analytics.getSalesData(options),
      {
        autoFetch: true,
        cache: {
          key: `sales-data-${JSON.stringify(options)}`,
          ttl: 10 * 60 * 1000, // 10 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer les données financières
   */
  const useFinancialData = (options: AnalyticsQueryOptions = {}) => {
    return useApi<any>(
      () => API.analytics.getFinancialData(options),
      {
        autoFetch: true,
        cache: {
          key: `financial-data-${JSON.stringify(options)}`,
          ttl: 10 * 60 * 1000, // 10 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer les données d'inventaire
   */
  const useInventoryData = (options: AnalyticsQueryOptions = {}) => {
    return useApi<any>(
      () => API.analytics.getInventoryData(options),
      {
        autoFetch: true,
        cache: {
          key: `inventory-data-${JSON.stringify(options)}`,
          ttl: 10 * 60 * 1000, // 10 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour récupérer les données d'activité utilisateur
   */
  const useUserActivityData = (options: AnalyticsQueryOptions = {}) => {
    return useApi<any>(
      () => API.analytics.getUserActivityData(options),
      {
        autoFetch: true,
        cache: {
          key: `user-activity-data-${JSON.stringify(options)}`,
          ttl: 10 * 60 * 1000, // 10 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour générer des prévisions
   */
  const useForecast = (
    dataType: 'sales' | 'inventory' | 'financial',
    targetSeries: string,
    options: {
      historyStart?: string;
      historyEnd?: string;
      forecastPeriods?: number;
      forecastGranularity?: 'day' | 'week' | 'month';
      method?: 'arima' | 'regression' | 'prophet' | 'neural';
      confidenceInterval?: number;
      filters?: Record<string, any>;
    } = {}
  ) => {
    return useApi<ForecastData>(
      () => API.analytics.getForecast(dataType, targetSeries, options),
      {
        autoFetch: true,
        cache: {
          key: `forecast-${dataType}-${targetSeries}-${JSON.stringify(options)}`,
          ttl: 30 * 60 * 1000, // 30 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour analyser les tendances
   */
  const useTrendAnalysis = (
    dataType: string,
    metrics: string[],
    options: AnalyticsQueryOptions = {}
  ) => {
    return useApi<any>(
      () => API.analytics.analyzeTrends(dataType, metrics, options),
      {
        autoFetch: true,
        cache: {
          key: `trend-analysis-${dataType}-${metrics.join('-')}-${JSON.stringify(options)}`,
          ttl: 15 * 60 * 1000, // 15 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour obtenir une analyse de cohorte
   */
  const useCohortAnalysis = (
    cohortType: 'customers' | 'products' | 'suppliers' | 'transactions',
    options: {
      cohortDateRange?: string;
      cohortAttribute?: string;
      metric?: string;
      granularity?: 'day' | 'week' | 'month';
      periods?: number;
      filters?: Record<string, any>;
    } = {}
  ) => {
    return useApi<any>(
      () => API.analytics.getCohortAnalysis(cohortType, options),
      {
        autoFetch: true,
        cache: {
          key: `cohort-analysis-${cohortType}-${JSON.stringify(options)}`,
          ttl: 20 * 60 * 1000, // 20 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Hook pour obtenir une analyse comparative
   */
  const useComparativeAnalysis = (
    dataType: string,
    periods: { name: string; startDate: string; endDate: string }[],
    metrics: string[],
    options: Record<string, any> = {}
  ) => {
    return useApi<any>(
      () => API.analytics.getComparativeAnalysis(dataType, periods, metrics, options),
      {
        autoFetch: true,
        cache: {
          key: `comparative-analysis-${dataType}-${JSON.stringify(periods)}-${metrics.join('-')}`,
          ttl: 15 * 60 * 1000, // 15 minutes
          loadFromCacheFirst: true
        }
      }
    );
  };

  /**
   * Fonction pour exporter un rapport
   */
  const exportReport = useCallback(
    async (reportId: string, options: ExportOptions): Promise<string> => {
      try {
        const result = await API.analytics.exportReport(reportId, options);
        return result.url;
      } catch (error) {
        console.error('Erreur lors de l\'exportation du rapport:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Fonction pour partager un rapport
   */
  const shareReport = useCallback(
    async (reportId: string, recipients: string[], message?: string): Promise<boolean> => {
      try {
        return await API.analytics.shareReport(reportId, recipients, message);
      } catch (error) {
        console.error('Erreur lors du partage du rapport:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Fonction pour générer un résumé automatique des données
   */
  const generateInsights = useCallback(
    async (
      dataType: string,
      data: any,
      options: { depth?: 'basic' | 'detailed'; language?: string } = {}
    ): Promise<{ insights: string[]; recommendations: string[] }> => {
      try {
        return await API.analytics.generateInsights(dataType, data, options);
      } catch (error) {
        console.error('Erreur lors de la génération des insights:', error);
        throw error;
      }
    },
    []
  );

  return {
    useSavedReports,
    useReport,
    useCreateReport,
    useDeleteReport,
    useSalesData,
    useFinancialData,
    useInventoryData,
    useUserActivityData,
    useForecast,
    useTrendAnalysis,
    useCohortAnalysis,
    useComparativeAnalysis,
    exportReport,
    shareReport,
    generateInsights
  };
}