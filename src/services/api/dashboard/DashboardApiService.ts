import ApiService from '../ApiService';
import logger from '../../../utils/logger';

/**
 * Interface pour un widget du tableau de bord
 */
export interface DashboardWidget {
  id: string;
  type: 'chart' | 'stats' | 'list' | 'table' | 'custom';
  title: string;
  subtitle?: string;
  data: any;
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config?: any;
  refreshInterval?: number; // en minutes, 0 pour pas de rafraîchissement auto
}

/**
 * Interface pour une disposition du tableau de bord
 */
export interface DashboardLayout {
  id: string;
  name: string;
  default: boolean;
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface pour une période de rapport
 */
export type ReportPeriod = 'today' | 'yesterday' | 'this_week' | 'last_week' | 
                          'this_month' | 'last_month' | 'this_quarter' | 
                          'last_quarter' | 'this_year' | 'last_year' | 'custom';

/**
 * Interface pour les options de rapport
 */
export interface ReportOptions {
  period?: ReportPeriod;
  startDate?: string;
  endDate?: string;
  comparisonPeriod?: ReportPeriod;
  comparisonStartDate?: string;
  comparisonEndDate?: string;
  filters?: Record<string, any>;
  groupBy?: string;
  limit?: number;
}

/**
 * Interface pour les métriques commerciales
 */
export interface BusinessMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  grossMargin: number;
  accountsReceivable: number;
  accountsPayable: number;
  cashBalance: number;
  salesGrowth: number;
  topProducts?: Array<{ id: string; name: string; revenue: number; quantity: number }>;
  revenueByCategory?: Array<{ category: string; value: number }>;
}

/**
 * Service API pour le tableau de bord
 */
class DashboardApiService {
  private static readonly BASE_PATH = '/dashboard';

  /**
   * Récupère les dispositions du tableau de bord
   */
  async getDashboardLayouts(): Promise<DashboardLayout[]> {
    try {
      return await ApiService.get<DashboardLayout[]>(`${DashboardApiService.BASE_PATH}/layouts`);
    } catch (error) {
      logger.error('Erreur lors de la récupération des dispositions du tableau de bord', error);
      throw error;
    }
  }

  /**
   * Récupère une disposition spécifique du tableau de bord
   */
  async getDashboardLayout(layoutId: string): Promise<DashboardLayout> {
    try {
      return await ApiService.get<DashboardLayout>(`${DashboardApiService.BASE_PATH}/layouts/${layoutId}`);
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la disposition ${layoutId} du tableau de bord`, error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle disposition du tableau de bord
   */
  async createDashboardLayout(layout: Omit<DashboardLayout, 'id' | 'createdAt' | 'updatedAt'>): Promise<DashboardLayout> {
    try {
      return await ApiService.post<DashboardLayout>(`${DashboardApiService.BASE_PATH}/layouts`, layout);
    } catch (error) {
      logger.error('Erreur lors de la création de la disposition du tableau de bord', error);
      throw error;
    }
  }

  /**
   * Met à jour une disposition du tableau de bord
   */
  async updateDashboardLayout(layoutId: string, layout: Partial<DashboardLayout>): Promise<DashboardLayout> {
    try {
      return await ApiService.put<DashboardLayout>(`${DashboardApiService.BASE_PATH}/layouts/${layoutId}`, layout);
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour de la disposition ${layoutId} du tableau de bord`, error);
      throw error;
    }
  }

  /**
   * Supprime une disposition du tableau de bord
   */
  async deleteDashboardLayout(layoutId: string): Promise<boolean> {
    try {
      await ApiService.delete(`${DashboardApiService.BASE_PATH}/layouts/${layoutId}`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression de la disposition ${layoutId} du tableau de bord`, error);
      throw error;
    }
  }

  /**
   * Récupère les données d'un widget spécifique du tableau de bord
   */
  async getWidgetData(widgetId: string, options: ReportOptions = {}): Promise<any> {
    try {
      return await ApiService.post<any>(`${DashboardApiService.BASE_PATH}/widgets/${widgetId}/data`, options);
    } catch (error) {
      logger.error(`Erreur lors de la récupération des données du widget ${widgetId}`, error);
      throw error;
    }
  }

  /**
   * Récupère toutes les métriques commerciales pour le tableau de bord
   */
  async getBusinessMetrics(options: ReportOptions = {}): Promise<BusinessMetrics> {
    try {
      return await ApiService.post<BusinessMetrics>(`${DashboardApiService.BASE_PATH}/metrics/business`, options);
    } catch (error) {
      logger.error('Erreur lors de la récupération des métriques commerciales', error);
      throw error;
    }
  }

  /**
   * Récupère les métriques de vente
   */
  async getSalesMetrics(options: ReportOptions = {}): Promise<any> {
    try {
      return await ApiService.post<any>(`${DashboardApiService.BASE_PATH}/metrics/sales`, options);
    } catch (error) {
      logger.error('Erreur lors de la récupération des métriques de vente', error);
      throw error;
    }
  }

  /**
   * Récupère les métriques financières
   */
  async getFinancialMetrics(options: ReportOptions = {}): Promise<any> {
    try {
      return await ApiService.post<any>(`${DashboardApiService.BASE_PATH}/metrics/financial`, options);
    } catch (error) {
      logger.error('Erreur lors de la récupération des métriques financières', error);
      throw error;
    }
  }

  /**
   * Récupère les métriques d'inventaire
   */
  async getInventoryMetrics(options: ReportOptions = {}): Promise<any> {
    try {
      return await ApiService.post<any>(`${DashboardApiService.BASE_PATH}/metrics/inventory`, options);
    } catch (error) {
      logger.error('Erreur lors de la récupération des métriques d\'inventaire', error);
      throw error;
    }
  }

  /**
   * Récupère les métriques de clients
   */
  async getCustomerMetrics(options: ReportOptions = {}): Promise<any> {
    try {
      return await ApiService.post<any>(`${DashboardApiService.BASE_PATH}/metrics/customers`, options);
    } catch (error) {
      logger.error('Erreur lors de la récupération des métriques de clients', error);
      throw error;
    }
  }

  /**
   * Récupère les données de tendance sur une période
   */
  async getTrendData(metricType: string, options: ReportOptions = {}): Promise<any> {
    try {
      return await ApiService.post<any>(`${DashboardApiService.BASE_PATH}/trends/${metricType}`, options);
    } catch (error) {
      logger.error(`Erreur lors de la récupération des données de tendance ${metricType}`, error);
      throw error;
    }
  }

  /**
   * Génère un rapport personnalisé
   */
  async generateCustomReport(options: {
    title: string;
    description?: string;
    sections: Array<{
      title: string;
      metricType: string;
      options: ReportOptions;
    }>;
    format?: 'pdf' | 'excel' | 'json';
  }): Promise<{ reportId: string; downloadUrl?: string }> {
    try {
      return await ApiService.post<{ reportId: string; downloadUrl?: string }>(
        `${DashboardApiService.BASE_PATH}/reports/custom`,
        options
      );
    } catch (error) {
      logger.error('Erreur lors de la génération du rapport personnalisé', error);
      throw error;
    }
  }

  /**
   * Récupère les types de rapports prédéfinis disponibles
   */
  async getReportTypes(): Promise<Array<{ id: string; name: string; description: string }>> {
    try {
      return await ApiService.get<Array<{ id: string; name: string; description: string }>>(
        `${DashboardApiService.BASE_PATH}/reports/types`
      );
    } catch (error) {
      logger.error('Erreur lors de la récupération des types de rapports', error);
      throw error;
    }
  }

  /**
   * Génère un rapport prédéfini
   */
  async generatePredefinedReport(reportType: string, options: ReportOptions & { format?: 'pdf' | 'excel' | 'json' }): Promise<{
    reportId: string;
    downloadUrl?: string;
  }> {
    try {
      return await ApiService.post<{ reportId: string; downloadUrl?: string }>(
        `${DashboardApiService.BASE_PATH}/reports/${reportType}`,
        options
      );
    } catch (error) {
      logger.error(`Erreur lors de la génération du rapport prédéfini ${reportType}`, error);
      throw error;
    }
  }

  /**
   * Récupère les données pour un graphique spécifique
   */
  async getChartData(chartType: string, options: ReportOptions = {}): Promise<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
    }>;
    title?: string;
    subtitle?: string;
  }> {
    try {
      return await ApiService.post<any>(`${DashboardApiService.BASE_PATH}/charts/${chartType}`, options);
    } catch (error) {
      logger.error(`Erreur lors de la récupération des données pour le graphique ${chartType}`, error);
      throw error;
    }
  }

  /**
   * Exporte les données du tableau de bord
   */
  async exportDashboard(layoutId: string, format: 'pdf' | 'excel' = 'pdf'): Promise<{ url: string }> {
    try {
      return await ApiService.post<{ url: string }>(
        `${DashboardApiService.BASE_PATH}/export`,
        { layoutId, format }
      );
    } catch (error) {
      logger.error('Erreur lors de l\'exportation du tableau de bord', error);
      throw error;
    }
  }

  /**
   * Récupère un résumé des notifications et alertes pour le tableau de bord
   */
  async getAlerts(): Promise<Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    date: string;
    read: boolean;
    actionRequired: boolean;
    link?: string;
  }>> {
    try {
      return await ApiService.get<any[]>(`${DashboardApiService.BASE_PATH}/alerts`);
    } catch (error) {
      logger.error('Erreur lors de la récupération des alertes du tableau de bord', error);
      throw error;
    }
  }
}

export default new DashboardApiService();