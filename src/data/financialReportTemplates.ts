/**
 * Templates HTML pour les rapports financiers SYSCOHADA
 */

/**
 * Génère le template HTML pour le bilan comptable
 */
export const getBilanTemplate = (
  data: any, 
  companyName: string, 
  startDate: Date, 
  endDate: Date,
  formatCurrency?: (amount: number) => string
): string => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR');
  };
  
  const formatNumber = (num: number) => {
    return formatCurrency ? formatCurrency(num) : num.toLocaleString('fr-FR');
  };
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bilan Comptable SYSCOHADA</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; text-align: center; }
        h2 { color: #555; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; }
        .date-range { font-size: 16px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
        .amount { text-align: right; }
        .container { margin-bottom: 30px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${companyName}</div>
        <div class="date-range">Bilan au ${formatDate(endDate)}</div>
        <div class="date-range">Période du ${formatDate(startDate)} au ${formatDate(endDate)}</div>
      </div>
      
      <div class="container">
        <h2>ACTIF</h2>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Intitulé</th>
              <th class="amount">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th colspan="3">Actif immobilisé</th>
            </tr>
            ${data.actifImmobilise.map(account => `
              <tr>
                <td>${account.number}</td>
                <td>${account.name}</td>
                <td class="amount">${formatNumber(account.balance)}</td>
              </tr>
            `).join('')}
            <tr>
              <th colspan="3">Actif circulant</th>
            </tr>
            ${data.actifCirculant.map(account => `
              <tr>
                <td>${account.number}</td>
                <td>${account.name}</td>
                <td class="amount">${formatNumber(account.balance)}</td>
              </tr>
            `).join('')}
            <tr>
              <th colspan="3">Trésorerie-Actif</th>
            </tr>
            ${data.tresorerieActif.map(account => `
              <tr>
                <td>${account.number}</td>
                <td>${account.name}</td>
                <td class="amount">${formatNumber(account.balance)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">TOTAL ACTIF</td>
              <td class="amount">${formatNumber(data.totalActif)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="container">
        <h2>PASSIF</h2>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Intitulé</th>
              <th class="amount">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th colspan="3">Capitaux propres et ressources assimilées</th>
            </tr>
            ${data.capitauxPropres.map(account => `
              <tr>
                <td>${account.number}</td>
                <td>${account.name}</td>
                <td class="amount">${formatNumber(account.balance)}</td>
              </tr>
            `).join('')}
            <tr>
              <th colspan="3">Dettes financières et ressources assimilées</th>
            </tr>
            ${data.dettesFLT.map(account => `
              <tr>
                <td>${account.number}</td>
                <td>${account.name}</td>
                <td class="amount">${formatNumber(account.balance)}</td>
              </tr>
            `).join('')}
            <tr>
              <th colspan="3">Passif circulant</th>
            </tr>
            ${data.dettesCCT.map(account => `
              <tr>
                <td>${account.number}</td>
                <td>${account.name}</td>
                <td class="amount">${formatNumber(account.balance)}</td>
              </tr>
            `).join('')}
            <tr>
              <th colspan="3">Trésorerie-Passif</th>
            </tr>
            ${data.tresoreriePaasif.map(account => `
              <tr>
                <td>${account.number}</td>
                <td>${account.name}</td>
                <td class="amount">${formatNumber(account.balance)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">TOTAL PASSIF</td>
              <td class="amount">${formatNumber(data.totalPassif)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;
};

/**
 * Génère le template HTML pour le compte de résultat
 */
export const getCompteResultatTemplate = (
  data: any, 
  companyName: string, 
  startDate: Date, 
  endDate: Date,
  formatCurrency?: (amount: number) => string
): string => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR');
  };
  
  const formatNumber = (num: number) => {
    return formatCurrency ? formatCurrency(num) : num.toLocaleString('fr-FR');
  };
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Compte de Résultat SYSCOHADA</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; text-align: center; }
        h2 { color: #555; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; }
        .date-range { font-size: 16px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
        .amount { text-align: right; }
        .container { margin-bottom: 30px; }
        .result-positive { color: green; font-weight: bold; }
        .result-negative { color: red; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${companyName}</div>
        <div class="date-range">Compte de Résultat</div>
        <div class="date-range">Période du ${formatDate(startDate)} au ${formatDate(endDate)}</div>
      </div>
      
      <div class="container">
        <h2>CHARGES</h2>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Intitulé</th>
              <th class="amount">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th colspan="3">Charges d'exploitation</th>
            </tr>
            ${data.chargesExploitation.map(account => `
              <tr>
                <td>${account.number}</td>
                <td>${account.name}</td>
                <td class="amount">${formatNumber(account.balance)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">Total charges d'exploitation</td>
              <td class="amount">${formatNumber(data.totalChargesExploitation)}</td>
            </tr>
            
            <tr>
              <th colspan="3">Charges financières</th>
            </tr>
            ${data.chargesFinancieres.map(account => `
              <tr>
                <td>${account.number}</td>
                <td>${account.name}</td>
                <td class="amount">${formatNumber(account.balance)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">Total charges financières</td>
              <td class="amount">${formatNumber(data.totalChargesFinancieres)}</td>
            </tr>
            
            <tr>
              <th colspan="3">Charges H.A.O.</th>
            </tr>
            ${data.chargesHAO.map(account => `
              <tr>
                <td>${account.number}</td>
                <td>${account.name}</td>
                <td class="amount">${formatNumber(account.balance)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">Total charges H.A.O.</td>
              <td class="amount">${formatNumber(data.totalChargesHAO)}</td>
            </tr>
            
            <tr>
              <th colspan="3">Impôts sur les résultats</th>
            </tr>
            ${data.impots.map(account => `
              <tr>
                <td>${account.number}</td>
                <td>${account.name}</td>
                <td class="amount">${formatNumber(account.balance)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">Total impôts</td>
              <td class="amount">${formatNumber(data.totalImpots)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="container">
        <h2>PRODUITS</h2>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Intitulé</th>
              <th class="amount">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th colspan="3">Produits d'exploitation</th>
            </tr>
            ${data.produitsExploitation.map(account => `
              <tr>
                <td>${account.number}</td>
                <td>${account.name}</td>
                <td class="amount">${formatNumber(account.balance)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">Total produits d'exploitation</td>
              <td class="amount">${formatNumber(data.totalProduitsExploitation)}</td>
            </tr>
            
            <tr>
              <th colspan="3">Produits financiers</th>
            </tr>
            ${data.produitsFinanciers.map(account => `
              <tr>
                <td>${account.number}</td>
                <td>${account.name}</td>
                <td class="amount">${formatNumber(account.balance)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">Total produits financiers</td>
              <td class="amount">${formatNumber(data.totalProduitsFinanciers)}</td>
            </tr>
            
            <tr>
              <th colspan="3">Produits H.A.O.</th>
            </tr>
            ${data.produitsHAO.map(account => `
              <tr>
                <td>${account.number}</td>
                <td>${account.name}</td>
                <td class="amount">${formatNumber(account.balance)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">Total produits H.A.O.</td>
              <td class="amount">${formatNumber(data.totalProduitsHAO)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="container">
        <h2>RÉSULTATS</h2>
        <table>
          <thead>
            <tr>
              <th>Type de résultat</th>
              <th class="amount">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Résultat d'exploitation</td>
              <td class="amount ${data.resultatExploitation >= 0 ? 'result-positive' : 'result-negative'}">${formatNumber(data.resultatExploitation)}</td>
            </tr>
            <tr>
              <td>Résultat financier</td>
              <td class="amount ${data.resultatFinancier >= 0 ? 'result-positive' : 'result-negative'}">${formatNumber(data.resultatFinancier)}</td>
            </tr>
            <tr>
              <td>Résultat H.A.O.</td>
              <td class="amount ${data.resultatHAO >= 0 ? 'result-positive' : 'result-negative'}">${formatNumber(data.resultatHAO)}</td>
            </tr>
            <tr class="total-row">
              <td>RÉSULTAT NET</td>
              <td class="amount ${data.resultatNet >= 0 ? 'result-positive' : 'result-negative'}">${formatNumber(data.resultatNet)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;
};

/**
 * Génère le template HTML pour la balance des comptes
 */
export const getBalanceTemplate = (
  data: any, 
  companyName: string, 
  startDate: Date, 
  endDate: Date,
  formatCurrency?: (amount: number) => string
): string => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR');
  };
  
  const formatNumber = (num: number) => {
    return formatCurrency ? formatCurrency(num) : num.toLocaleString('fr-FR');
  };
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Balance des Comptes SYSCOHADA</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; text-align: center; }
        h2 { color: #555; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; }
        .date-range { font-size: 16px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
        .amount { text-align: right; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${companyName}</div>
        <div class="date-range">Balance des Comptes</div>
        <div class="date-range">Période du ${formatDate(startDate)} au ${formatDate(endDate)}</div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>N° Compte</th>
            <th>Intitulé</th>
            <th class="amount">Débit</th>
            <th class="amount">Crédit</th>
            <th class="amount">Solde débiteur</th>
            <th class="amount">Solde créditeur</th>
          </tr>
        </thead>
        <tbody>
          ${data.accounts.map(account => `
            <tr>
              <td>${account.number}</td>
              <td>${account.name}</td>
              <td class="amount">${formatNumber(account.debit)}</td>
              <td class="amount">${formatNumber(account.credit)}</td>
              <td class="amount">${formatNumber(account.soldeDebiteur)}</td>
              <td class="amount">${formatNumber(account.soldeCrediteur)}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="2">TOTAUX</td>
            <td class="amount">${formatNumber(data.totalDebit)}</td>
            <td class="amount">${formatNumber(data.totalCredit)}</td>
            <td class="amount">${formatNumber(data.soldeDebiteur)}</td>
            <td class="amount">${formatNumber(data.soldeCrediteur)}</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;
};

/**
 * Génère le template HTML pour le tableau des flux de trésorerie
 */
export const getTresorerieTemplate = (
  data: any, 
  companyName: string, 
  startDate: Date, 
  endDate: Date,
  formatCurrency?: (amount: number) => string
): string => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR');
  };
  
  const formatNumber = (num: number) => {
    return formatCurrency ? formatCurrency(num) : num.toLocaleString('fr-FR');
  };
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Tableau des Flux de Trésorerie SYSCOHADA</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; text-align: center; }
        h2 { color: #555; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; }
        .date-range { font-size: 16px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
        .amount { text-align: right; }
        .container { margin-bottom: 30px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${companyName}</div>
        <div class="date-range">Tableau des Flux de Trésorerie</div>
        <div class="date-range">Période du ${formatDate(startDate)} au ${formatDate(endDate)}</div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Libellé</th>
            <th class="amount">Montant</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th colspan="2">Flux de trésorerie provenant des activités opérationnelles</th>
          </tr>
          <tr>
            <td>Flux net de trésorerie généré par l'activité</td>
            <td class="amount">${formatNumber(data.fluxExploitation)}</td>
          </tr>
          
          <tr>
            <th colspan="2">Flux de trésorerie provenant des activités d'investissement</th>
          </tr>
          <tr>
            <td>Flux net de trésorerie lié aux opérations d'investissement</td>
            <td class="amount">${formatNumber(data.fluxInvestissement)}</td>
          </tr>
          
          <tr>
            <th colspan="2">Flux de trésorerie provenant des activités de financement</th>
          </tr>
          <tr>
            <td>Flux net de trésorerie lié aux opérations de financement</td>
            <td class="amount">${formatNumber(data.fluxFinancement)}</td>
          </tr>
          
          <tr class="total-row">
            <td>VARIATION DE LA TRÉSORERIE NETTE</td>
            <td class="amount">${formatNumber(data.variationTresorerie)}</td>
          </tr>
          
          <tr>
            <td>Trésorerie à l'ouverture</td>
            <td class="amount">${formatNumber(data.soldeInitial)}</td>
          </tr>
          <tr>
            <td>Trésorerie à la clôture</td>
            <td class="amount">${formatNumber(data.soldeFinal)}</td>
          </tr>
          
          <tr class="total-row">
            <td>VARIATION DE TRÉSORERIE</td>
            <td class="amount">${formatNumber(data.variationTresorerie)}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="container">
        <h2>Détail des comptes de trésorerie</h2>
        <table>
          <thead>
            <tr>
              <th>N° de compte</th>
              <th>Intitulé</th>
              <th class="amount">Solde</th>
            </tr>
          </thead>
          <tbody>
            ${data.tresorerieAccounts.map(account => `
              <tr>
                <td>${account.number}</td>
                <td>${account.name}</td>
                <td class="amount">${formatNumber(account.balance)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">TOTAL TRÉSORERIE</td>
              <td class="amount">${formatNumber(data.soldeFinal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;
};