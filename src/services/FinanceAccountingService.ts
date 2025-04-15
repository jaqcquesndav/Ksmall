import DatabaseService from './DatabaseService';
import AccountingService from './AccountingService';
import * as CompanyService from './CompanyService';

/**
 * Service pour synchroniser les opérations financières avec les écritures comptables
 */
class FinanceAccountingService {
  /**
   * Enregistre un achat d'investissement et génère les écritures comptables correspondantes
   */
  async recordInvestmentPurchase(investment: {
    type: string;
    amount: number;
    term: number;
    financialInstitution: string;
    isPublic: boolean;
    interestRate: number;
  }) {
    try {
      // 1. Enregistrement de l'investissement dans la base de données
      const investmentId = await DatabaseService.createInvestment({
        ...investment,
        date: new Date().toISOString(),
        status: 'active',
        interestAccrued: 0,
        maturityDate: this.calculateMaturityDate(investment.term),
      });

      // 2. Génération des écritures comptables
      // Débit du compte d'investissement approprié
      const accountType = this.determineInvestmentAccountType(investment.type, investment.isPublic);
      
      // Structure de l'écriture comptable
      const journalEntry = {
        date: new Date().toISOString(),
        reference: `INV-${investmentId}`,
        description: `Achat d'obligations - ${investment.financialInstitution} (${investment.interestRate}%)`,
        entries: [
          {
            accountId: accountType.accountId,
            accountName: accountType.accountName,
            debit: investment.amount,
            credit: 0,
            description: `Acquisition obligations ${investment.term} mois`,
          },
          {
            accountId: '512000', // Banque - À adapter selon le plan comptable
            accountName: 'Banque',
            debit: 0,
            credit: investment.amount,
            description: `Paiement pour acquisition obligations`,
          }
        ],
        status: 'posted',
        total: investment.amount,
        attachments: [],
        companyId: await CompanyService.getCurrentCompanyId(),
      };

      // 3. Enregistrement de l'écriture comptable
      await AccountingService.createJournalEntry(journalEntry);

      // 4. Création d'un échéancier pour les intérêts si nécessaire
      await this.createInterestSchedule(investmentId, investment);

      return investmentId;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'achat d\'investissement:', error);
      throw error;
    }
  }

  /**
   * Enregistre une nouvelle émission d'obligations par l'entreprise
   */
  async recordBondIssuance(issuance: {
    amount: number;
    interestRate: number;
    termMonths: number;
    isPublic: boolean;
    description: string;
    bondType: string;
    minimumInvestment?: number;
  }) {
    try {
      // 1. Enregistrement de l'émission dans la base de données
      const issuanceId = await DatabaseService.createBondIssuance({
        ...issuance,
        issuance_date: new Date().toISOString(),
        status: 'active',
        total_interest_paid: 0,
        next_interest_payment_date: this.calculateNextInterestPaymentDate(),
        maturity_date: this.calculateMaturityDate(issuance.termMonths),
        issuer_id: await CompanyService.getCurrentCompanyId(),
        issuer_name: await CompanyService.getCurrentCompanyName(),
        total_bonds_sold: issuance.amount,  // Au début, considérons que tous les titres sont vendus
        type: issuance.bondType
      });

      // 2. Génération des écritures comptables
      // Pour une émission d'obligations, nous recevons de l'argent (débit banque)
      // et créditons un compte de dette
      const journalEntry = {
        date: new Date().toISOString(),
        reference: `BOND-${issuanceId}`,
        description: `Émission d'obligations - ${issuance.description} (${issuance.interestRate}%)`,
        entries: [
          {
            accountId: '512000', // Banque
            accountName: 'Banque',
            debit: issuance.amount,
            credit: 0,
            description: `Encaissement émission obligataire`,
          },
          {
            accountId: '163000', // Emprunts obligataires
            accountName: 'Emprunts obligataires',
            debit: 0,
            credit: issuance.amount,
            description: `Émission d'obligations sur ${issuance.termMonths} mois`,
          }
        ],
        status: 'posted',
        total: issuance.amount,
        attachments: [],
        companyId: await CompanyService.getCurrentCompanyId(),
      };

      // 3. Enregistrement de l'écriture comptable
      await AccountingService.createJournalEntry(journalEntry);

      // 4. Création d'un échéancier pour les paiements d'intérêts
      await this.createInterestPaymentSchedule(issuanceId, issuance);

      return issuanceId;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'émission obligataire:', error);
      throw error;
    }
  }

  /**
   * Enregistre un paiement d'intérêts sur une émission obligataire
   */
  async recordBondInterestPayment(issuanceId: string, paymentAmount: number) {
    try {
      // 1. Mise à jour de l'émission dans la base de données
      const issuance = await DatabaseService.getBondIssuance(issuanceId);
      await DatabaseService.updateBondIssuance(issuanceId, {
        total_interest_paid: issuance.total_interest_paid + paymentAmount,
        next_interest_payment_date: this.calculateNextInterestPaymentDate(issuance.next_interest_payment_date),
        last_interest_payment_date: new Date().toISOString(),
      });

      // 2. Génération de l'écriture comptable pour le paiement des intérêts
      const journalEntry = {
        date: new Date().toISOString(),
        reference: `INT-BOND-${issuanceId}`,
        description: `Paiement intérêts obligataires - ${issuance.description}`,
        entries: [
          {
            accountId: '661000', // Charges d'intérêts
            accountName: 'Charges d\'intérêts',
            debit: paymentAmount,
            credit: 0,
            description: `Intérêts sur émission obligataire`,
          },
          {
            accountId: '512000', // Banque
            accountName: 'Banque',
            debit: 0,
            credit: paymentAmount,
            description: `Paiement d'intérêts obligataires`,
          }
        ],
        status: 'posted',
        total: paymentAmount,
        attachments: [],
        companyId: await CompanyService.getCurrentCompanyId(),
      };

      // 3. Enregistrement de l'écriture comptable
      await AccountingService.createJournalEntry(journalEntry);

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du paiement d\'intérêts:', error);
      throw error;
    }
  }

  /**
   * Enregistre une perception d'intérêts sur un investissement
   */
  async recordInvestmentInterestIncome(investmentId: string, interestAmount: number) {
    try {
      // 1. Mise à jour de l'investissement dans la base de données
      const investment = await DatabaseService.getInvestment(investmentId);
      await DatabaseService.updateInvestment(investmentId, {
        interestAccrued: investment.interestAccrued + interestAmount,
        lastInterestDate: new Date().toISOString(),
      });

      // 2. Génération de l'écriture comptable pour la réception des intérêts
      const journalEntry = {
        date: new Date().toISOString(),
        reference: `INT-INC-${investmentId}`,
        description: `Intérêts reçus - ${investment.financialInstitution}`,
        entries: [
          {
            accountId: '512000', // Banque
            accountName: 'Banque',
            debit: interestAmount,
            credit: 0,
            description: `Intérêts reçus sur investissement`,
          },
          {
            accountId: '762000', // Produits financiers
            accountName: 'Produits des participations',
            debit: 0,
            credit: interestAmount,
            description: `Intérêts sur investissement obligataire`,
          }
        ],
        status: 'posted',
        total: interestAmount,
        attachments: [],
        companyId: await CompanyService.getCurrentCompanyId(),
      };

      // 3. Enregistrement de l'écriture comptable
      await AccountingService.createJournalEntry(journalEntry);

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des intérêts reçus:', error);
      throw error;
    }
  }

  /**
   * Méthode pour déterminer le type de compte à utiliser pour un investissement
   */
  private determineInvestmentAccountType(investmentType: string, isPublic: boolean) {
    // Logique pour déterminer le compte selon le type d'investissement
    // Utilise le plan comptable français (PCG)
    switch (investmentType) {
      case 'shortTermBonds':
        return isPublic 
          ? { accountId: '507100', accountName: 'Bons du Trésor à court terme' }
          : { accountId: '503000', accountName: 'Obligations à court terme' };
      case 'governmentBonds':
        return { accountId: '507100', accountName: 'Obligations d\'État' };
      case 'privateBonds':
        return { accountId: '503000', accountName: 'Obligations et titres assimilés' };
      case 'treasuryNotes':
        return { accountId: '507100', accountName: 'Bons du Trésor' };
      case 'corporateBonds':
        return { accountId: '503000', accountName: 'Obligations d\'entreprises' };
      default:
        return { accountId: '503000', accountName: 'Obligations et autres titres' };
    }
  }

  /**
   * Calcule la date d'échéance d'un investissement
   */
  private calculateMaturityDate(termMonths: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() + termMonths);
    return date.toISOString();
  }

  /**
   * Calcule la prochaine date de paiement d'intérêts
   * Par défaut, les intérêts sont payés trimestriellement
   */
  private calculateNextInterestPaymentDate(fromDate?: string): string {
    const date = fromDate ? new Date(fromDate) : new Date();
    date.setMonth(date.getMonth() + 3); // Paiement trimestriel
    return date.toISOString();
  }

  /**
   * Crée un échéancier pour le paiement des intérêts d'une émission obligataire
   */
  private async createInterestPaymentSchedule(issuanceId: string, issuance: any) {
    const schedule = [];
    const termMonths = issuance.termMonths;
    const quarterlyRate = issuance.interestRate / 4; // Taux trimestriel
    const quarterlyPayment = (issuance.amount * quarterlyRate) / 100;
    
    // Créer un échéancier trimestriel jusqu'à échéance
    for (let i = 3; i <= termMonths; i += 3) {
      if (i > termMonths) break;
      
      const paymentDate = new Date();
      paymentDate.setMonth(paymentDate.getMonth() + i);
      
      schedule.push({
        issuance_id: issuanceId,
        payment_date: paymentDate.toISOString(),
        payment_amount: quarterlyPayment,
        payment_type: 'interest',
        status: 'scheduled'
      });
    }
    
    // Ajouter le remboursement du principal à l'échéance
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + termMonths);
    
    schedule.push({
      issuance_id: issuanceId,
      payment_date: maturityDate.toISOString(),
      payment_amount: issuance.amount,
      payment_type: 'principal',
      status: 'scheduled'
    });
    
    // Enregistrer l'échéancier
    await DatabaseService.createBondPaymentSchedule(schedule);
  }

  /**
   * Crée un échéancier pour la réception des intérêts d'un investissement
   */
  private async createInterestSchedule(investmentId: string, investment: any) {
    const schedule = [];
    const termMonths = investment.term;
    const quarterlyRate = investment.interestRate / 4; // Taux trimestriel
    const quarterlyIncome = (investment.amount * quarterlyRate) / 100;
    
    // Créer un échéancier trimestriel jusqu'à échéance
    for (let i = 3; i <= termMonths; i += 3) {
      if (i > termMonths) break;
      
      const incomeDate = new Date();
      incomeDate.setMonth(incomeDate.getMonth() + i);
      
      schedule.push({
        investment_id: investmentId,
        income_date: incomeDate.toISOString(),
        income_amount: quarterlyIncome,
        income_type: 'interest',
        status: 'scheduled'
      });
    }
    
    // Ajouter la réception du principal à l'échéance
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + termMonths);
    
    schedule.push({
      investment_id: investmentId,
      income_date: maturityDate.toISOString(),
      income_amount: investment.amount,
      income_type: 'principal',
      status: 'scheduled'
    });
    
    // Enregistrer l'échéancier
    await DatabaseService.createInvestmentIncomeSchedule(schedule);
  }
}

export default new FinanceAccountingService();