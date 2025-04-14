import { Platform, PermissionsAndroid } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import logger from './logger';

// Interface pour les options de création de PDF
export interface PDFOptions {
  fileName: string;
  directory?: string;
  html: string;
  base64?: boolean;
}

// Interface pour le résultat de création de PDF
export interface PDFResult {
  filePath: string;
  success: boolean;
  error?: string;
}

/**
 * Génère un document PDF à partir de HTML et le partage
 */
export const generateAndSharePDF = async (options: PDFOptions): Promise<PDFResult> => {
  try {
    // Vérification des permissions sur Android
    if (Platform.OS === 'android') {
      const permissions = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      ]);
      
      const writeGranted = permissions[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;
      const readGranted = permissions[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;
      
      if (!writeGranted || !readGranted) {
        return {
          filePath: '',
          success: false,
          error: 'Storage permissions are required to save the PDF'
        };
      }
    }
    
    // Génération du PDF avec expo-print
    const { uri } = await Print.printToFileAsync({
      html: options.html,
      base64: options.base64
    });

    // Partager le fichier PDF
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
    });

    return {
      filePath: uri,
      success: true
    };
  } catch (error) {
    logger.error('PDF export error:', error);
    return {
      filePath: '',
      success: false,
      error: error.message
    };
  }
};

/**
 * Génère un modèle HTML pour un rapport comptable
 */
export const generateAccountingReportHTML = (
  title: string,
  data: any,
  periodStart: string,
  periodEnd: string,
  companyInfo: {
    name: string;
    logo?: string;
    address?: string;
    contactInfo?: string;
  }
) => {
  // En-tête du document avec logo et informations de l'entreprise
  const header = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
      <div>
        <h1 style="color: #197ca8; margin: 0;">${companyInfo.name}</h1>
        ${companyInfo.address ? `<p>${companyInfo.address}</p>` : ''}
        ${companyInfo.contactInfo ? `<p>${companyInfo.contactInfo}</p>` : ''}
      </div>
      ${companyInfo.logo 
        ? `<div><img src="${companyInfo.logo}" style="height: 60px;"></div>` 
        : ''}
    </div>
  `;

  // Informations du rapport
  const reportInfo = `
    <div style="margin-bottom: 20px; background-color: #f1f5f9; padding: 10px; border-radius: 5px;">
      <h2>${title}</h2>
      <p>Période: ${periodStart} - ${periodEnd}</p>
    </div>
  `;

  // Contenu principal du rapport - adapté au type de données
  let content = '';
  if (Array.isArray(data)) {
    content = `
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #197ca8; color: white;">
            ${Object.keys(data[0] || {}).map(key => `<th style="padding: 8px; text-align: left; border: 1px solid #ddd;">${key}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(item => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              ${Object.values(item).map(value => `<td style="padding: 8px; border: 1px solid #ddd;">${value}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else {
    // Si ce n'est pas un tableau, convertir en tableau de paires clé-valeur
    content = `
      <table style="width: 100%; border-collapse: collapse;">
        ${Object.entries(data).map(([key, value]) => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px; font-weight: bold; width: 40%; border: 1px solid #ddd;">${key}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${value}</td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  // Pied de page
  const footer = `
    <div style="margin-top: 30px; color: #64748b; font-size: 10px; text-align: center;">
      <p>Rapport généré le ${new Date().toLocaleDateString()} par KSmall</p>
      <p>Ce document est généré automatiquement et ne nécessite pas de signature.</p>
    </div>
  `;

  // CSS pour le document
  const styles = `
    body {
      font-family: 'Helvetica', sans-serif;
      color: #1e293b;
      line-height: 1.6;
      padding: 40px;
    }
    h1, h2, h3 {
      color: #197ca8;
    }
    table {
      margin-top: 20px;
      margin-bottom: 20px;
      width: 100%;
    }
    th {
      background-color: #197ca8;
      color: white;
      text-align: left;
      padding: 10px;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    td {
      padding: 8px;
    }
  `;

  // Document HTML complet
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>${styles}</style>
      </head>
      <body>
        ${header}
        ${reportInfo}
        ${content}
        ${footer}
      </body>
    </html>
  `;
};
