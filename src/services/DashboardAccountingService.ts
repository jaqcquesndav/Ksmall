import DatabaseService from './DatabaseService';
import logger from '../utils/logger';
import * as CompanyService from './CompanyService';
import AccountingService from './AccountingService';
import CurrencyService from './CurrencyService';
import { getRecentTransactionsForDashboard } from '../data/transactionsMockData';

/**
 * Service pour synchroniser les données comptables avec le dashboard
 */
class DashboardAccountingService {
  // Variable pour suivre si nous utilisons un compte de démonstration
  private isDemoAccount: boolean = false;
  
  /**
   * Définit si le service doit utiliser les données de démonstration
   * @param isDemoAccount True si nous utilisons un compte de démonstration
   */
  setDemoMode(isDemoAccount: boolean) {
    this.isDemoAccount = isDemoAccount;
    logger.debug(`DashboardAccountingService: Mode démo ${isDemoAccount ? 'activé' : 'désactivé'}`);
  }

  /**
   * Récupère les soldes des comptes pour le dashboard
   * @returns Objet contenant les soldes des différentes catégories de comptes
   */
  async getDashboardBalances() {
    try {
      const db = await DatabaseService.getDBConnection();
      
      // Récupérer les soldes par type de compte
      const [result] = await DatabaseService.executeQuery(
        db,
        `SELECT 
          SUM(CASE WHEN type = 'asset' AND code LIKE '52%' THEN balance ELSE 0 END) as cash,
          SUM(CASE WHEN type = 'asset' AND code LIKE '41%' THEN balance ELSE 0 END) as receivables,
          SUM(CASE WHEN type = 'liability' AND code LIKE '40%' THEN balance ELSE 0 END) as payables
         FROM accounting_accounts
         WHERE is_active = 1`,
        []
      );
      
      if (result && result.rows && result.rows.length > 0) {
        const item = result.rows.item(0);
        return {
          cash: item.cash || 0,
          receivables: item.receivables || 0,
          payables: item.payables || 0
        };
      }
      
      return {
        cash: 0,
        receivables: 0,
        payables: 0
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des soldes pour le dashboard:', error);
      return {
        cash: 0,
        receivables: 0,
        payables: 0
      };
    }
  }

  /**
   * Formate un montant selon la devise actuellement sélectionnée par l'utilisateur
   * @param amount Le montant à formater
   * @returns Le montant formaté avec le symbole de la devise
   */
  async formatCurrency(amount: number): Promise<string> {
    const currency = await CurrencyService.getSelectedCurrency();
    return await CurrencyService.formatAmount(amount, currency);
  }

  /**
   * Récupère les transactions récentes pour le dashboard
   * @param limit Nombre maximum de transactions à récupérer
   * @returns Liste des transactions récentes
   */
  async getRecentTransactions(limit = 5) {
    // Si nous sommes en mode démo, utiliser les données mockées
    if (this.isDemoAccount) {
      logger.info('Utilisation des données de démonstration pour les transactions récentes');
      return getRecentTransactionsForDashboard(limit);
    }
    
    try {
      const db = await DatabaseService.getDBConnection();
      
      // Vérifier si la colonne "total" existe dans la table accounting_transactions
      const [columnInfo, columnError] = await DatabaseService.executeQuery(
        db,
        `PRAGMA table_info(accounting_transactions);`,
        []
      );
      
      if (columnInfo) {
        let totalColumnExists = false;
        for (let i = 0; i < columnInfo.rows.length; i++) {
          if (columnInfo.rows.item(i).name === 'total') {
            totalColumnExists = true;
            break;
          }
        }
        
        if (!totalColumnExists) {
          logger.info('Ajout de la colonne "total" à la table accounting_transactions depuis getRecentTransactions');
          await DatabaseService.executeQuery(
            db,
            `ALTER TABLE accounting_transactions ADD COLUMN total REAL DEFAULT 0;`,
            []
          );
        }
      }
      
      const [result] = await DatabaseService.executeQuery(
        db,
        `SELECT t.id, t.date, t.reference, t.description, t.total, t.status,
          (SELECT MIN(e.account_code) FROM accounting_entries e WHERE e.transaction_id = t.id) as primary_account
         FROM accounting_transactions t
         ORDER BY t.date DESC
         LIMIT ?`,
        [limit]
      );
      
      if (result && result.rows && result.rows.length > 0) {
        const transactions = [];
        for (let i = 0; i < result.rows.length; i++) {
          const item = result.rows.item(i);
          transactions.push({
            id: item.id,
            date: new Date(item.date),
            reference: item.reference,
            description: item.description,
            amount: item.total || 0,
            status: item.status,
            account: item.primary_account
          });
        }
        return transactions;
      }
      
      return [];
    } catch (error) {
      logger.error('Erreur lors de la récupération des transactions récentes:', error);
      return [];
    }
  }

  /**
   * Récupère les métriques financières pour le dashboard
   * @returns Diverses métriques financières calculées
   */
  async getFinancialMetrics() {
    try {
      const db = await DatabaseService.getDBConnection();
      
      // Récupérer les totaux des revenus et dépenses
      const [result] = await DatabaseService.executeQuery(
        db,
        `SELECT 
          SUM(CASE WHEN type = 'revenue' THEN balance ELSE 0 END) as total_revenue,
          SUM(CASE WHEN type = 'expense' THEN balance ELSE 0 END) as total_expenses
         FROM accounting_accounts
         WHERE is_active = 1`,
        []
      );
      
      if (result && result.rows && result.rows.length > 0) {
        const item = result.rows.item(0);
        const totalRevenue = item.total_revenue || 0;
        const totalExpenses = item.total_expenses || 0;
        
        return {
          totalRevenue,
          totalExpenses,
          netIncome: totalRevenue - totalExpenses,
          profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0
        };
      }
      
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0,
        profitMargin: 0
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des métriques financières:', error);
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0,
        profitMargin: 0
      };
    }
  }

  /**
   * Calcule la cote de crédit basée sur des métriques financières
   * Cette fonction devrait idéalement utiliser un modèle plus sophistiqué
   * @returns Score de crédit entre 0 et 100
   */
  async calculateCreditScore() {
    try {
      const metrics = await this.getFinancialMetrics();
      const balances = await this.getDashboardBalances();
      
      // Facteurs à considérer pour la cote de crédit
      let score = 70; // Score de base
      
      // Ajuster en fonction de la marge bénéficiaire
      if (metrics.profitMargin > 15) score += 10;
      else if (metrics.profitMargin > 5) score += 5;
      else if (metrics.profitMargin < 0) score -= 10;
      
      // Ajuster en fonction du ratio de liquidité (cash / payables)
      const liquidityRatio = balances.payables > 0 ? balances.cash / balances.payables : 1;
      if (liquidityRatio > 2) score += 10;
      else if (liquidityRatio > 1) score += 5;
      else if (liquidityRatio < 0.5) score -= 10;
      
      // Ajuster en fonction du ratio de solvabilité (receivables / payables)
      const solvencyRatio = balances.payables > 0 ? balances.receivables / balances.payables : 1;
      if (solvencyRatio > 2) score += 5;
      else if (solvencyRatio < 0.5) score -= 5;
      
      // S'assurer que le score reste dans la plage 0-100
      score = Math.min(100, Math.max(0, score));
      
      // Mettre à jour le score de crédit stocké
      await CompanyService.updateCompanyCreditScore(score);
      
      return Math.round(score);
    } catch (error) {
      logger.error('Erreur lors du calcul de la cote de crédit:', error);
      return 75; // Score de crédit par défaut en cas d'erreur
    }
  }
  
  /**
   * Récupère ou calcule le score ESG (Environmental, Social, Governance)
   * @returns Note ESG sous forme de lettre (A+, A, B+, etc.)
   */
  async getESGRating() {
    try {
      const db = await DatabaseService.getDBConnection();
      
      // Chercher d'abord dans les métriques utilisateur
      const [result] = await DatabaseService.executeQuery(
        db,
        'SELECT value FROM user_metrics WHERE metric_name = ?',
        ['esg_rating']
      );
      
      if (result && result.rows && result.rows.length > 0) {
        return result.rows.item(0).value;
      }
      
      // Si pas de notation ESG, retourner une valeur par défaut
      return 'B+';
    } catch (error) {
      logger.error('Erreur lors de la récupération de la note ESG:', error);
      return 'B+';
    }
  }
  
  /**
   * Met à jour la cote de crédit en fonction des dernières données comptables
   */
  async updateCreditScore() {
    return this.calculateCreditScore();
  }
  
  /**
   * Récupère les informations sur la devise actuellement utilisée
   */
  async getCurrentCurrencyInfo() {
    const currency = await CurrencyService.getSelectedCurrency();
    return CurrencyService.getCurrencyInfo(currency);
  }
}

export default new DashboardAccountingService();