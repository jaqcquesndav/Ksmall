/**
 * Financial data types
 */

export interface FinancialData {
  financialStatements: {
    balanceSheet: {
      assets: {
        currentAssets: {
          cash: number;
          bank: number;
          accountsReceivable: number;
          inventory: number;
          total: number;
        };
        fixedAssets: {
          equipment: number;
          buildings: number;
          land: number;
          total: number;
        };
        totalAssets: number;
      };
      liabilities: {
        currentLiabilities: {
          accountsPayable: number;
          shortTermLoans: number;
          total: number;
        };
        longTermLiabilities: {
          longTermDebt: number;
          total: number;
        };
        totalLiabilities: number;
      };
      equity: {
        capital: number;
        retainedEarnings: number;
        total: number;
      };
    };
    incomeStatement: {
      revenue: number;
      costOfGoodsSold: number;
      grossProfit: number;
      expenses: {
        salaries: number;
        rent: number;
        utilities: number;
        other: number;
        total: number;
      };
      operatingProfit: number;
      interestExpense: number;
      taxExpense: number;
      netIncome: number;
    };
  };
}

export interface SubscriptionData {
  plan: string;
  expiryDate: Date;
  usedTokens: number;
  remainingTokens: number;
  totalTokens: number;
  creditScore: number;
}

export interface Transaction {
  id: string;
  description: string;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  lines: {
    account: string;
    debit: number;
    credit: number;
  }[];
}