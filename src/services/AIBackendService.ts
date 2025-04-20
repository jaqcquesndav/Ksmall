import { Message } from '../components/chat/DynamicResponseBuilder';
import { CHAT_MODES } from '../components/chat/ModeSelector';
import { getMockResponseForMessage } from './MockResponseService';
import logger from '../utils/logger';
import AccountingService from './AccountingService';

/**
 * Service pour interagir avec l'IA backend
 */
class AIBackendService {
  /**
   * Traite un message utilisateur et génère une réponse
   */
  async processUserInput(params: { text: string; attachments?: Array<{ id: string; name: string; type: string; url: string }>; mode: CHAT_MODES }): Promise<any> {
    try {
      logger.debug('Traitement du message utilisateur', params);

      // Extraire les mots-clés pour déterminer le type de graphique
      const keywords = this.extractKeywords(params.text);

      // Pour la démonstration, utilisons notre service de mock avec des messages plus concis
      const mockResponse = await getMockResponseForMessage(params.text, params.mode);

      // Pour le mode ANALYSIS, analyser les mots-clés pour déterminer le type de graphique
      if (params.mode === CHAT_MODES.ANALYSIS && mockResponse.analysisData) {
        mockResponse.analysisData = this.enhanceAnalysisWithKeywords(mockResponse.analysisData, keywords);
      }

      return {
        type: mockResponse.messageType,
        content: mockResponse.content,
        data: mockResponse.journalData || mockResponse.inventoryData || mockResponse.analysisData,
        format: mockResponse.messageType === 'markdown' ? 'markdown' :
          mockResponse.messageType === 'code' ? 'code' : null,
        language: mockResponse.codeLanguage,
        status: mockResponse.status
      };
    } catch (error) {
      logger.error('Erreur lors du traitement du message utilisateur', error);
      throw error;
    }
  }

  /**
   * Extraire les mots-clés pour déterminer le type de graphique
   */
  private extractKeywords(text: string): string[] {
    const keywords = [];

    // Rechercher des types de graphiques spécifiques
    if (/camembert|pie|répartition|distribution|proportion/i.test(text)) {
      keywords.push('pie');
    }
    if (/bar(re)?s|histogramme|comparaison|comparer/i.test(text)) {
      keywords.push('bar');
    }
    if (/ligne|courbe|tendance|évolution|progression|temps/i.test(text)) {
      keywords.push('line');
    }

    // Rechercher des périodes spécifiques
    if (/jour|journalier|quotidien/i.test(text)) {
      keywords.push('daily');
    }
    if (/semaine|hebdomadaire/i.test(text)) {
      keywords.push('weekly');
    }
    if (/mois|mensuel/i.test(text)) {
      keywords.push('monthly');
    }
    if (/trimestre|trimestriel/i.test(text)) {
      keywords.push('quarterly');
    }
    if (/an(née)?|annuel/i.test(text)) {
      keywords.push('yearly');
    }

    // Rechercher des sujets spécifiques
    if (/vente|chiffre d'affaires|revenu|ca/i.test(text)) {
      keywords.push('sales');
    }
    if (/produit|article|stock/i.test(text)) {
      keywords.push('product');
    }
    if (/client|acheteur|consommateur/i.test(text)) {
      keywords.push('customer');
    }

    return keywords;
  }

  /**
   * Améliorer l'analyse avec les mots-clés extraits
   */
  private enhanceAnalysisWithKeywords(analysisData: any, keywords: string[]): any {
    // Si pas de mots-clés spécifiques, retourner les données telles quelles
    if (keywords.length === 0) return analysisData;

    // Personnaliser le titre en fonction des mots-clés
    if (keywords.includes('sales')) {
      if (keywords.includes('monthly')) {
        analysisData.title = "Évolution mensuelle des ventes";
      } else if (keywords.includes('yearly')) {
        analysisData.title = "Comparaison annuelle des ventes";
      }
    } else if (keywords.includes('product')) {
      if (keywords.includes('pie')) {
        analysisData.title = "Répartition des produits en stock";
      }
    }

    // Personnaliser le type de graphique en fonction des mots-clés
    if (analysisData.charts && analysisData.charts.length > 0) {
      if (keywords.includes('line')) {
        analysisData.charts[0].type = 'line';
      } else if (keywords.includes('bar')) {
        analysisData.charts[0].type = 'bar';
      } else if (keywords.includes('pie')) {
        analysisData.charts[0].type = 'pie';
      }
    }

    return analysisData;
  }

  /**
   * Valide une entrée (écriture comptable ou inventaire) et la transfère vers le journal comptable
   * si c'est une écriture comptable
   * @returns Un objet contenant l'ID de l'entrée de journal en cas de succès
   */
  async validateEntry(params: { id: string; type: 'journal_entry' | 'inventory'; data: any }): Promise<{ journalEntryId?: string }> {
    try {
      logger.debug(`Validation de l'entrée ${params.type}`, params);
      
      // Si c'est une écriture comptable, la transférer vers le journal comptable
      if (params.type === 'journal_entry') {
        const journalData = params.data;
        
        // Préparer les données au format attendu par AccountingService
        const journalEntry = {
          date: journalData.date,
          reference: journalData.reference || `JL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          description: journalData.description,
          entries: journalData.entries.map((entry: any) => ({
            accountId: entry.accountNumber,
            accountName: entry.account,
            debit: entry.debit || 0,
            credit: entry.credit || 0,
            description: entry.description || journalData.description
          })),
          status: 'validated', // Utilisation de 'validated' au lieu de 'posted' pour cohérence
          total: journalData.totalDebit || journalData.totalCredit, // Ils doivent être égaux si l'écriture est équilibrée
          attachments: journalData.attachments || [],
          companyId: 'current' // Sera remplacé par le service avec l'ID de l'entreprise actuelle
        };
        
        // Enregistrer l'entrée dans le journal comptable
        const journalEntryId = await AccountingService.createJournalEntry(journalEntry);
        logger.info(`Écriture comptable ${journalEntry.reference} transférée vers le journal comptable avec l'ID: ${journalEntryId}`);
        
        // Retourner l'ID du journal pour référence future
        return { journalEntryId };
      }
      
      // En production, ceci serait un appel API réel pour mettre à jour le statut dans le chat
      // await api.post('/ai/validate', params);

      return {};
    } catch (error) {
      logger.error(`Erreur lors de la validation de l'entrée ${params.type}`, error);
      throw error;
    }
  }
}

export default new AIBackendService();
