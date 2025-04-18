import { FinancialData } from '../types/financial';

// Interface for subscription data
interface SubscriptionData {
  plan: string;
  expiryDate: Date;
  usedTokens: number;
  remainingTokens: number;
  totalTokens: number;
  creditScore: number;
}

/**
 * Service for financial-related operations
 */
class FinancialService {
  /**
   * Get financial statements data
   * @returns Financial statements data
   */
  async getFinancialStatements(): Promise<any> {
    // Mock data for demonstration
    return {
      financialStatements: {
        balanceSheet: {
          assets: {
            currentAssets: {
              cash: 25000000,
              bank: 75000000,
              accountsReceivable: 35000000,
              inventory: 45000000,
              total: 180000000,
            },
            fixedAssets: {
              equipment: 120000000,
              buildings: 350000000,
              land: 250000000,
              total: 720000000,
            },
            totalAssets: 900000000,
          },
          liabilities: {
            currentLiabilities: {
              accountsPayable: 25000000,
              shortTermLoans: 50000000,
              total: 75000000,
            },
            longTermLiabilities: {
              longTermDebt: 250000000,
              total: 250000000,
            },
            totalLiabilities: 325000000,
          },
          equity: {
            capital: 500000000,
            retainedEarnings: 75000000,
            total: 575000000,
          },
        },
        incomeStatement: {
          revenue: 150000000,
          costOfGoodsSold: 75000000,
          grossProfit: 75000000,
          expenses: {
            salaries: 25000000,
            rent: 5000000,
            utilities: 2500000,
            other: 7500000,
            total: 40000000,
          },
          operatingProfit: 35000000,
          interestExpense: 5000000,
          taxExpense: 7500000,
          netIncome: 22500000,
        },
      },
    };
  }

  /**
   * Get recent transactions
   * @returns Recent transactions data
   */
  async getRecentTransactions(): Promise<any[]> {
    // Mock data for demonstration
    return [
      {
        id: "1001",
        description: "Achat de matériel de bureau",
        date: "2025-04-15",
        status: "completed",
        lines: [
          { account: "Equipment", debit: 750000, credit: 0 },
          { account: "Bank", debit: 0, credit: 750000 },
        ],
      },
      {
        id: "1002",
        description: "Paiement de salaires",
        date: "2025-04-14",
        status: "completed",
        lines: [
          { account: "Salary Expense", debit: 2500000, credit: 0 },
          { account: "Bank", debit: 0, credit: 2500000 },
        ],
      },
      {
        id: "1003",
        description: "Encaissement de facture client",
        date: "2025-04-13",
        status: "completed",
        lines: [
          { account: "Bank", debit: 1500000, credit: 0 },
          { account: "Accounts Receivable", debit: 0, credit: 1500000 },
        ],
      },
      {
        id: "1004", 
        description: "Paiement de loyer",
        date: "2025-04-10",
        status: "pending",
        lines: [
          { account: "Rent Expense", debit: 1200000, credit: 0 },
          { account: "Bank", debit: 0, credit: 1200000 },
        ],
      },
    ];
  }

  /**
   * Get subscription information
   * @returns Subscription data
   */
  async getSubscriptionInfo(): Promise<SubscriptionData> {
    // Mock data for demonstration
    return {
      plan: "Premium Business",
      expiryDate: new Date(2025, 9, 15), // October 15, 2025
      usedTokens: 1250,
      remainingTokens: 3750,
      totalTokens: 5000,
      creditScore: 85,
    };
  }

  /**
   * Get alternative interest rate for a given date
   * @param date The date for which to get the alternative rate
   * @returns The alternative interest rate as a percentage
   */
  getAlternativeRate(date: string): number {
    // Mock implementation - in a real app this would use the provided date
    return 4.25;
  }
}

export default new FinancialService();