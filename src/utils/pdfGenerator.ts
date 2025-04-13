import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { JournalEntry } from '../components/accounting/DynamicJournalEntryWidget';
import { CompanyInfo } from '../services/CompanyService';
import { DateRange } from '../components/accounting/DateFilterBar';
import { formatCurrency } from './formatters';
import QRCode from 'qrcode';

// Génération de l'HTML pour un PDF de journal comptable conformément aux normes SYSCOHADA
export const generateJournalPdf = async (
  entries: JournalEntry[],
  companyInfo: CompanyInfo,
  dateRange: DateRange
): Promise<string> => {
  // Générer un QR code pour l'authentification
  const authenticationCode = generateAuthenticationCode(companyInfo, dateRange);
  const qrCode = await QRCode.toDataURL(authenticationCode);
  
  // Calcul des totaux pour le pied de page
  const totalDebit = entries.reduce((sum, entry) => sum + entry.totalDebit, 0);
  const totalCredit = entries.reduce((sum, entry) => sum + entry.totalCredit, 0);
  
  // Formater les dates
  const formattedStartDate = format(dateRange.startDate, 'dd/MM/yyyy', { locale: fr });
  const formattedEndDate = format(dateRange.endDate, 'dd/MM/yyyy', { locale: fr });
  
  // Générer le HTML
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Journal Comptable - ${companyInfo.name}</title>
      <style>
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .company-name {
          font-size: 22px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .company-details {
          font-size: 14px;
          margin-bottom: 5px;
        }
        .document-title {
          font-size: 18px;
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .periode {
          text-align: center;
          margin-bottom: 20px;
          font-style: italic;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .text-right {
          text-align: right;
        }
        .total-row {
          font-weight: bold;
          background-color: #f9f9f9;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          text-align: center;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        .auth-section {
          margin-top: 30px;
          border-top: 1px dashed #ddd;
          padding-top: 15px;
          display: flex;
          justify-content: space-between;
        }
        .auth-code {
          font-family: monospace;
          font-size: 12px;
          padding: 5px;
          background: #f0f0f0;
        }
        .qr-code {
          width: 100px;
          height: 100px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${companyInfo.name}</div>
        <div class="company-details">${companyInfo.address}</div>
        <div class="company-details">RCCM: ${companyInfo.registrationNumber} | NIF: ${companyInfo.taxId}</div>
        <div class="company-details">Tel: ${companyInfo.phone} | Email: ${companyInfo.email}</div>
      </div>
      
      <div class="document-title">JOURNAL COMPTABLE</div>
      <div class="periode">Période du ${formattedStartDate} au ${formattedEndDate}</div>
      
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Réf.</th>
            <th>N° Compte</th>
            <th>Intitulé du compte</th>
            <th>Libellé</th>
            <th class="text-right">Débit</th>
            <th class="text-right">Crédit</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map(entry => `
            ${entry.entries.map((item, index) => `
              <tr>
                ${index === 0 ? `<td rowspan="${entry.entries.length}">${format(new Date(entry.date), 'dd/MM/yyyy', { locale: fr })}</td>` : ''}
                ${index === 0 ? `<td rowspan="${entry.entries.length}">${entry.reference || ''}</td>` : ''}
                <td>${item.accountNumber}</td>
                <td>${item.account}</td>
                ${index === 0 ? `<td rowspan="${entry.entries.length}">${entry.description}</td>` : ''}
                <td class="text-right">${item.debit > 0 ? formatCurrency(item.debit) : ''}</td>
                <td class="text-right">${item.credit > 0 ? formatCurrency(item.credit) : ''}</td>
              </tr>
            `).join('')}
          `).join('')}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="5" class="text-right">Totaux</td>
            <td class="text-right">${formatCurrency(totalDebit)}</td>
            <td class="text-right">${formatCurrency(totalCredit)}</td>
          </tr>
        </tfoot>
      </table>
      
      <div class="auth-section">
        <div>
          <p>Code d'authentification:</p>
          <div class="auth-code">${authenticationCode}</div>
        </div>
        <div>
          <img src="${qrCode}" class="qr-code" />
        </div>
      </div>
      
      <div class="footer">
        Document généré par KSMobile Accounting le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}
        <br>
        Conforme au Système Comptable OHADA (SYSCOHADA)
      </div>
    </body>
    </html>
  `;
};

// Génère un code d'authentification unique pour le document
const generateAuthenticationCode = (companyInfo: CompanyInfo, dateRange: DateRange): string => {
  const timestamp = new Date().getTime();
  const baseString = `${companyInfo.taxId}-${companyInfo.name}-${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}-${timestamp}`;
  
  // Simplification: en production, utiliser une fonction de hachage cryptographique appropriée
  let hash = 0;
  for (let i = 0; i < baseString.length; i++) {
    const char = baseString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Conversion en 32bit integer
  }
  
  // Formatage pour lisibilité
  return `SYSCOHADA-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
};

// Autres générateurs de PDF pour les autres rapports financiers
export const generateBalanceSheetPdf = async (data: any, companyInfo: CompanyInfo): Promise<string> => {
  // Implémentation du bilan
  return `
    <!DOCTYPE html>
    <html>
      <head><title>Balance Sheet</title></head>
      <body>
        <h1>Balance Sheet placeholder</h1>
      </body>
    </html>
  `;
};

export const generateIncomeStatementPdf = async (data: any, companyInfo: CompanyInfo): Promise<string> => {
  // Implémentation du compte de résultat
  return `
    <!DOCTYPE html>
    <html>
      <head><title>Income Statement</title></head>
      <body>
        <h1>Income Statement placeholder</h1>
      </body>
    </html>
  `;
};

export const generateCashFlowPdf = async (data: any, companyInfo: CompanyInfo): Promise<string> => {
  // Implémentation du tableau de flux de trésorerie
  return `
    <!DOCTYPE html>
    <html>
      <head><title>Cash Flow</title></head>
      <body>
        <h1>Cash Flow placeholder</h1>
      </body>
    </html>
  `;
};

export const generateAuditReportPdf = async (data: any, companyInfo: CompanyInfo): Promise<string> => {
  // Implémentation du rapport d'audit
  return `
    <!DOCTYPE html>
    <html>
      <head><title>Audit Report</title></head>
      <body>
        <h1>Audit Report placeholder</h1>
      </body>
    </html>
  `;
};
