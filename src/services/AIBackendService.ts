import { generateUniqueId } from '../utils/helpers';

// Types pour les requêtes et réponses
interface UserInput {
  text: string;
  attachments?: any[];
  mode: string;
}

interface ValidationRequest {
  id: string;
  type: string;
  data: any;
}

// Données de démonstration pour le compte jacquesndav@gmail.com
const demoAccountResponses = {
  // Réponse standard basée sur le mode
  regularChat: {
    content: "Bonjour ! Comment puis-je vous aider aujourd'hui avec votre entreprise ?",
    type: "regular_chat",
  },
  
  accounting: {
    content: "Voici une écriture comptable basée sur votre demande :",
    type: "journal_entry",
    data: {
      date: new Date().toISOString(),
      reference: "JE-2023-042",
      description: "Enregistrement de vente de marchandises",
      lines: [
        { accountCode: "411000", description: "Clients", debit: 1200, credit: 0, taxCode: "" },
        { accountCode: "707000", description: "Vente de marchandises", debit: 0, credit: 1000, taxCode: "TVA" },
        { accountCode: "445711", description: "TVA collectée", debit: 0, credit: 200, taxCode: "" }
      ]
    }
  },
  
  inventory: {
    content: "Voici l'inventaire des produits :",
    type: "inventory",
    data: {
      title: "Inventaire des produits",
      items: [
        { id: "1", sku: "PROD001", name: "Ordinateur portable", quantity: 15, cost: 450, price: 799 },
        { id: "2", sku: "PROD002", name: "Écran 24\"", quantity: 28, cost: 120, price: 249 },
        { id: "3", sku: "PROD003", name: "Clavier sans fil", quantity: 42, cost: 25, price: 49.99 },
        { id: "4", sku: "PROD004", name: "Souris ergonomique", quantity: 36, cost: 15, price: 34.99 }
      ],
      totalValue: 13550,
      summary: "Valeur totale de l'inventaire: 13 550 €"
    }
  },
  
  analysis: {
    content: "Voici l'analyse financière demandée :",
    type: "analysis",
    data: {
      title: "Analyse des ventes du dernier trimestre",
      kpis: [
        { label: "Chiffre d'affaires", value: "42 500 €", change: "+12.5%" },
        { label: "Marge brute", value: "18 200 €", change: "+8.2%" },
        { label: "Clients actifs", value: "127", change: "+15%" }
      ],
      chart: {
        labels: ["Janvier", "Février", "Mars"],
        datasets: [
          {
            data: [12500, 14200, 15800],
            label: "Ventes",
            color: "#6200EE"
          }
        ]
      },
      conclusion: "Les ventes sont en progression constante ce trimestre avec une augmentation notable des clients actifs."
    }
  },
  
  markdown: {
    content: "# Rapport de performance\n\n## Points clés\n\n* **Ventes**: Augmentation de 12.5%\n* **Clients**: 127 clients actifs (+15%)\n* **Rentabilité**: Amélioration de la marge brute\n\n> Les performances sont globalement positives.",
    format: "markdown"
  },
  
  code: {
    content: "function calculerTVA(montantHT, tauxTVA = 20) {\n  const montantTVA = montantHT * tauxTVA / 100;\n  return {\n    montantHT,\n    montantTVA,\n    montantTTC: montantHT + montantTVA\n  };\n}",
    format: "code",
    language: "javascript"
  }
};

class AIBackendService {
  initialize() {
      throw new Error('Method not implemented.');
  }
  // Variable pour stocker l'utilisateur actuel
  private currentUser: any = null;
  
  // Méthode pour définir l'utilisateur
  setCurrentUser(user: any) {
    this.currentUser = user;
  }
  
  // Remplacer la référence à useAuth() par une propriété de classe
  private isDemo() {
    return this.currentUser?.isDemo === true;
  }
  
  async processUserInput(input: UserInput): Promise<any> {
    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Si c'est le compte de démo, retourner des réponses spécifiques selon le mode
    if (this.isDemo()) {
      console.log('Using demo account responses for:', input.mode);
      
      // Sélectionner le type de réponse en fonction du mode
      switch(input.mode) {
        case 'accounting':
          return demoAccountResponses.accounting;
        case 'inventory':
          return demoAccountResponses.inventory;
        case 'analysis':
          return demoAccountResponses.analysis;
        default:
          // Détecter des mots-clés dans le texte pour choisir le type de réponse
          const text = input.text.toLowerCase();
          if (text.includes('code') || text.includes('fonction') || text.includes('script')) {
            return demoAccountResponses.code;
          }
          if (text.includes('rapport') || text.includes('analyse')) {
            return demoAccountResponses.markdown;
          }
          return demoAccountResponses.regularChat;
      }
    }
    
    // Pour les utilisateurs non-démo, simuler une réponse générique
    return {
      content: "Je vous remercie pour votre message. Cette fonctionnalité nécessite une connexion au backend. Veuillez utiliser le compte de démonstration pour tester les fonctionnalités avancées.",
      type: "regular_chat"
    };
  }

  async validateEntry(validation: ValidationRequest): Promise<boolean> {
    // Simuler un délai
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Toujours retourner true pour la démo
    return true;
  }
}

export default new AIBackendService();
