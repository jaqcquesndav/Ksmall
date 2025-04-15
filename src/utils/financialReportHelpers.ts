import { Account, Transaction } from '../services/AccountingService';

/**
 * Prépare les données pour le bilan comptable
 */
export const prepareBilanData = (accounts: Account[]) => {
  // Classer les comptes selon la structure du bilan SYSCOHADA
  const actifImmobilise = accounts.filter(a => 
    a.number.startsWith('2') && a.isActive
  );
  
  const actifCirculant = accounts.filter(a => 
    (a.number.startsWith('3') || a.number.startsWith('4')) && a.isActive
  );
  
  const tresorerieActif = accounts.filter(a => 
    a.number.startsWith('5') && a.isActive
  );
  
  const capitauxPropres = accounts.filter(a => 
    (a.number.startsWith('1') && a.number < '14000000') && a.isActive
  );
  
  const dettesFLT = accounts.filter(a => 
    (a.number.startsWith('16') || a.number.startsWith('17')) && a.isActive
  );
  
  const dettesCCT = accounts.filter(a => 
    (a.number.startsWith('4') && a.type === 'liability') && a.isActive
  );
  
  const tresoreriePaasif = accounts.filter(a => 
    (a.number.startsWith('5') && a.type === 'liability') && a.isActive
  );
  
  return {
    actifImmobilise,
    actifCirculant,
    tresorerieActif,
    capitauxPropres,
    dettesFLT,
    dettesCCT,
    tresoreriePaasif,
    totalActif: [
      ...actifImmobilise,
      ...actifCirculant,
      ...tresorerieActif
    ].reduce((sum, account) => sum + account.balance, 0),
    totalPassif: [
      ...capitauxPropres,
      ...dettesFLT,
      ...dettesCCT,
      ...tresoreriePaasif
    ].reduce((sum, account) => sum + account.balance, 0)
  };
};

/**
 * Prépare les données pour le compte de résultat
 */
export const prepareCompteResultatData = (accounts: Account[]) => {
  const produitsExploitation = accounts.filter(a => 
    a.number.startsWith('7') && !a.number.startsWith('76') && !a.number.startsWith('77') && a.isActive
  );
  
  const chargesExploitation = accounts.filter(a => 
    a.number.startsWith('6') && !a.number.startsWith('66') && !a.number.startsWith('67') && a.isActive
  );
  
  const produitsFinanciers = accounts.filter(a => 
    a.number.startsWith('76') && a.isActive
  );
  
  const chargesFinancieres = accounts.filter(a => 
    a.number.startsWith('66') && a.isActive
  );
  
  const produitsHAO = accounts.filter(a => 
    a.number.startsWith('77') && a.isActive
  );
  
  const chargesHAO = accounts.filter(a => 
    a.number.startsWith('67') && a.isActive
  );
  
  const impots = accounts.filter(a => 
    a.number.startsWith('69') && a.isActive
  );
  
  const totalProduitsExploitation = produitsExploitation.reduce((sum, a) => sum + a.balance, 0);
  const totalChargesExploitation = chargesExploitation.reduce((sum, a) => sum + a.balance, 0);
  const resultatExploitation = totalProduitsExploitation - totalChargesExploitation;
  
  const totalProduitsFinanciers = produitsFinanciers.reduce((sum, a) => sum + a.balance, 0);
  const totalChargesFinancieres = chargesFinancieres.reduce((sum, a) => sum + a.balance, 0);
  const resultatFinancier = totalProduitsFinanciers - totalChargesFinancieres;
  
  const totalProduitsHAO = produitsHAO.reduce((sum, a) => sum + a.balance, 0);
  const totalChargesHAO = chargesHAO.reduce((sum, a) => sum + a.balance, 0);
  const resultatHAO = totalProduitsHAO - totalChargesHAO;
  
  const totalImpots = impots.reduce((sum, a) => sum + a.balance, 0);
  
  const resultatNet = resultatExploitation + resultatFinancier + resultatHAO - totalImpots;
  
  return {
    produitsExploitation,
    chargesExploitation,
    produitsFinanciers,
    chargesFinancieres,
    produitsHAO,
    chargesHAO,
    impots,
    totalProduitsExploitation,
    totalChargesExploitation,
    resultatExploitation,
    totalProduitsFinanciers,
    totalChargesFinancieres,
    resultatFinancier,
    totalProduitsHAO,
    totalChargesHAO,
    resultatHAO,
    totalImpots,
    resultatNet
  };
};

/**
 * Prépare les données pour la balance des comptes
 */
export const prepareBalanceData = (accounts: Account[], transactions: Transaction[]) => {
  let totalDebit = 0;
  let totalCredit = 0;
  let soldeDebiteur = 0;
  let soldeCrediteur = 0;
  
  // Calculer les totaux des mouvements débit et crédit pour chaque compte
  const accountsWithMovements = accounts.map(account => {
    let accountDebit = 0;
    let accountCredit = 0;
    
    for (const transaction of transactions) {
      for (const entry of transaction.entries) {
        if (entry.accountNumber === account.number) {
          accountDebit += entry.debit;
          accountCredit += entry.credit;
        }
      }
    }
    
    totalDebit += accountDebit;
    totalCredit += accountCredit;
    
    const solde = accountDebit - accountCredit;
    if (solde > 0) {
      soldeDebiteur += solde;
    } else {
      soldeCrediteur += Math.abs(solde);
    }
    
    return {
      ...account,
      debit: accountDebit,
      credit: accountCredit,
      soldeDebiteur: solde > 0 ? solde : 0,
      soldeCrediteur: solde < 0 ? Math.abs(solde) : 0
    };
  });
  
  return {
    accounts: accountsWithMovements,
    totalDebit,
    totalCredit,
    soldeDebiteur,
    soldeCrediteur
  };
};

/**
 * Prépare les données pour le tableau des flux de trésorerie
 */
export const prepareTresorerieData = (accounts: Account[], transactions: Transaction[]) => {
  // Récupérer les comptes de trésorerie (classe 5)
  const tresorerieAccounts = accounts.filter(a => 
    a.number.startsWith('5') && a.isActive
  );
  
  // Activités d'exploitation
  const exploitation = transactions.filter(t => {
    return t.entries.some(e => {
      const accountNumber = e.accountNumber;
      return accountNumber.startsWith('6') || accountNumber.startsWith('7');
    });
  });
  
  // Activités d'investissement
  const investissement = transactions.filter(t => {
    return t.entries.some(e => {
      const accountNumber = e.accountNumber;
      return accountNumber.startsWith('2');
    });
  });
  
  // Activités de financement
  const financement = transactions.filter(t => {
    return t.entries.some(e => {
      const accountNumber = e.accountNumber;
      return accountNumber.startsWith('1') || (accountNumber.startsWith('5') && !accountNumber.startsWith('52') && !accountNumber.startsWith('57'));
    });
  });
  
  // Calculer les flux par catégorie
  const fluxExploitation = calculateNetCashFlowForAccounts(exploitation, tresorerieAccounts);
  const fluxInvestissement = calculateNetCashFlowForAccounts(investissement, tresorerieAccounts);
  const fluxFinancement = calculateNetCashFlowForAccounts(financement, tresorerieAccounts);
  
  const variationTresorerie = fluxExploitation + fluxInvestissement + fluxFinancement;
  
  // Solde initial et final
  const soldeInitial = tresorerieAccounts.reduce((sum, a) => sum + a.balance, 0) - variationTresorerie;
  const soldeFinal = soldeInitial + variationTresorerie;
  
  return {
    fluxExploitation,
    fluxInvestissement,
    fluxFinancement,
    variationTresorerie,
    soldeInitial,
    soldeFinal,
    tresorerieAccounts
  };
};

/**
 * Calcule le flux net de trésorerie pour un ensemble de transactions et de comptes de trésorerie
 */
export const calculateNetCashFlowForAccounts = (transactions: Transaction[], cashAccounts: Account[]): number => {
  let netCashFlow = 0;
  
  for (const transaction of transactions) {
    for (const entry of transaction.entries) {
      if (cashAccounts.some(a => a.number === entry.accountNumber)) {
        netCashFlow += entry.debit - entry.credit;
      }
    }
  }
  
  return netCashFlow;
};