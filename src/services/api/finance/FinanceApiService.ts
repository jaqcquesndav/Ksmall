import ApiService from '../ApiService';
import logger from '../../../utils/logger';
import { 
  FinancingApplication, 
  FinancingDocument, 
  FinancingEligibility, 
  FinancingOffer, 
  FinancingProvider, 
  FinancingQueryOptions, 
  ActiveFinancing, 
  RepaymentSchedule,
  FINANCING_TYPES
} from '../../../types/finance';

/**
 * Service API pour la gestion des demandes de financement
 */
class FinanceApiService {
  private static readonly BASE_PATH = '/finance';

  /**
   * Récupère toutes les demandes de financement
   */
  async getFinancingApplications(options?: FinancingQueryOptions): Promise<FinancingApplication[]> {
    try {
      return await ApiService.get<FinancingApplication[]>(
        `${FinanceApiService.BASE_PATH}/applications`,
        options
      );
    } catch (error) {
      logger.error('Erreur lors de la récupération des demandes de financement', error);
      throw error;
    }
  }

  /**
   * Récupère une demande de financement spécifique
   */
  async getFinancingApplication(applicationId: string): Promise<FinancingApplication> {
    try {
      return await ApiService.get<FinancingApplication>(
        `${FinanceApiService.BASE_PATH}/applications/${applicationId}`
      );
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la demande de financement ${applicationId}`, error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle demande de financement
   */
  async createFinancingApplication(application: Partial<FinancingApplication>): Promise<FinancingApplication> {
    try {
      return await ApiService.post<FinancingApplication>(
        `${FinanceApiService.BASE_PATH}/applications`,
        application
      );
    } catch (error) {
      logger.error('Erreur lors de la création d\'une demande de financement', error);
      throw error;
    }
  }

  /**
   * Met à jour une demande de financement existante
   */
  async updateFinancingApplication(
    applicationId: string,
    updates: Partial<FinancingApplication>
  ): Promise<FinancingApplication> {
    try {
      return await ApiService.put<FinancingApplication>(
        `${FinanceApiService.BASE_PATH}/applications/${applicationId}`,
        updates
      );
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour de la demande de financement ${applicationId}`, error);
      throw error;
    }
  }

  /**
   * Soumet une demande de financement pour évaluation
   */
  async submitFinancingApplication(applicationId: string): Promise<FinancingApplication> {
    try {
      return await ApiService.post<FinancingApplication>(
        `${FinanceApiService.BASE_PATH}/applications/${applicationId}/submit`,
        {}
      );
    } catch (error) {
      logger.error(`Erreur lors de la soumission de la demande de financement ${applicationId}`, error);
      throw error;
    }
  }

  /**
   * Annule une demande de financement
   */
  async cancelFinancingApplication(applicationId: string): Promise<FinancingApplication> {
    try {
      return await ApiService.post<FinancingApplication>(
        `${FinanceApiService.BASE_PATH}/applications/${applicationId}/cancel`,
        {}
      );
    } catch (error) {
      logger.error(`Erreur lors de l'annulation de la demande de financement ${applicationId}`, error);
      throw error;
    }
  }

  /**
   * Téléverse un document pour une demande de financement
   */
  async uploadFinancingDocument(
    applicationId: string,
    documentType: string,
    formData: FormData
  ): Promise<FinancingDocument> {
    try {
      // Ajouter le type de document directement dans le FormData au lieu de le passer comme paramètre
      formData.append('type', documentType);
      
      return await ApiService.uploadFile<FinancingDocument>(
        `${FinanceApiService.BASE_PATH}/applications/${applicationId}/documents`,
        formData,
        true // offlineSupport est un booléen
      );
    } catch (error) {
      logger.error(`Erreur lors du téléchargement d'un document pour la demande ${applicationId}`, error);
      throw error;
    }
  }

  /**
   * Supprime un document d'une demande de financement
   */
  async deleteFinancingDocument(applicationId: string, documentId: string): Promise<boolean> {
    try {
      await ApiService.delete(
        `${FinanceApiService.BASE_PATH}/applications/${applicationId}/documents/${documentId}`
      );
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression du document ${documentId}`, error);
      throw error;
    }
  }

  /**
   * Récupère les fournisseurs de financement disponibles
   */
  async getFinancingProviders(type?: FINANCING_TYPES): Promise<FinancingProvider[]> {
    try {
      return await ApiService.get<FinancingProvider[]>(
        `${FinanceApiService.BASE_PATH}/providers`,
        { type }
      );
    } catch (error) {
      logger.error('Erreur lors de la récupération des fournisseurs de financement', error);
      throw error;
    }
  }

  /**
   * Évalue l'éligibilité au financement
   */
  async checkFinancingEligibility(
    amount: number,
    currency: string,
    type: FINANCING_TYPES,
    term?: number
  ): Promise<FinancingEligibility> {
    try {
      return await ApiService.post<FinancingEligibility>(
        `${FinanceApiService.BASE_PATH}/eligibility`,
        { amount, currency, type, term }
      );
    } catch (error) {
      logger.error('Erreur lors de l\'évaluation de l\'éligibilité au financement', error);
      throw error;
    }
  }

  /**
   * Accepte une offre de financement
   */
  async acceptFinancingOffer(applicationId: string, offerId: string): Promise<FinancingApplication> {
    try {
      return await ApiService.post<FinancingApplication>(
        `${FinanceApiService.BASE_PATH}/applications/${applicationId}/offers/${offerId}/accept`,
        {}
      );
    } catch (error) {
      logger.error(`Erreur lors de l'acceptation de l'offre de financement ${offerId}`, error);
      throw error;
    }
  }

  /**
   * Rejette une offre de financement
   */
  async rejectFinancingOffer(
    applicationId: string,
    offerId: string,
    reason?: string
  ): Promise<FinancingApplication> {
    try {
      return await ApiService.post<FinancingApplication>(
        `${FinanceApiService.BASE_PATH}/applications/${applicationId}/offers/${offerId}/reject`,
        { reason }
      );
    } catch (error) {
      logger.error(`Erreur lors du rejet de l'offre de financement ${offerId}`, error);
      throw error;
    }
  }

  /**
   * Récupère les financements actifs
   */
  async getActiveFinancing(): Promise<ActiveFinancing[]> {
    try {
      return await ApiService.get<ActiveFinancing[]>(
        `${FinanceApiService.BASE_PATH}/active`
      );
    } catch (error) {
      logger.error('Erreur lors de la récupération des financements actifs', error);
      throw error;
    }
  }

  /**
   * Récupère le calendrier de remboursement pour un financement
   */
  async getRepaymentSchedule(financingId: string): Promise<RepaymentSchedule> {
    try {
      return await ApiService.get<RepaymentSchedule>(
        `${FinanceApiService.BASE_PATH}/active/${financingId}/schedule`
      );
    } catch (error) {
      logger.error(`Erreur lors de la récupération du calendrier de remboursement pour ${financingId}`, error);
      throw error;
    }
  }

  /**
   * Effectue un remboursement
   */
  async makeRepayment(
    financingId: string, 
    amount: number,
    method: 'bank_transfer' | 'card' | 'mobile_money',
    reference?: string
  ): Promise<{success: boolean; transactionId: string}> {
    try {
      return await ApiService.post<{success: boolean; transactionId: string}>(
        `${FinanceApiService.BASE_PATH}/active/${financingId}/repayment`,
        { amount, method, reference }
      );
    } catch (error) {
      logger.error(`Erreur lors du remboursement pour ${financingId}`, error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques de financement
   */
  async getFinancingStats(): Promise<{
    totalRequested: number;
    totalApproved: number;
    totalActive: number;
    totalRepaid: number;
    approvalRate: number;
    avgInterestRate: number;
  }> {
    try {
      return await ApiService.get<{
        totalRequested: number;
        totalApproved: number;
        totalActive: number;
        totalRepaid: number;
        approvalRate: number;
        avgInterestRate: number;
      }>(
        `${FinanceApiService.BASE_PATH}/stats`
      );
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques de financement', error);
      throw error;
    }
  }
}

export default new FinanceApiService();