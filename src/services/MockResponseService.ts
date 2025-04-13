import { MESSAGE_TYPES, Message } from '../components/chat/DynamicResponseBuilder';
import { CHAT_MODES } from '../components/chat/ModeSelector';
import { generateUniqueId } from '../utils/helpers';

/**
 * Service pour générer des réponses simulées concises pour la démonstration
 */
export const generateMockResponse = (userMessage: string, mode: CHAT_MODES): Message => {
  const timestamp = new Date().toISOString();
  
  switch (mode) {
    case CHAT_MODES.ACCOUNTING:
      return {
        id: generateUniqueId(),
        content: "Écriture comptable générée",
        messageType: MESSAGE_TYPES.JOURNAL_ENTRY,
        isUser: false,
        timestamp,
        status: 'pending',
        journalData: {
          date: new Date().toISOString(),
          description: "Achat fournitures",
          entries: [
            { account: "Fournitures", accountNumber: "6064", debit: 500, credit: 0 },
            { account: "TVA", accountNumber: "44566", debit: 100, credit: 0 },
            { account: "Fournisseurs", accountNumber: "401", debit: 0, credit: 600 }
          ],
          totalDebit: 600,
          totalCredit: 600,
          attachments: []
        }
      };
      
    case CHAT_MODES.INVENTORY:
      return {
        id: generateUniqueId(),
        content: "Inventaire mis à jour",
        messageType: MESSAGE_TYPES.INVENTORY,
        isUser: false,
        timestamp,
        status: 'pending',
        inventoryData: {
          items: [
            { id: "1", name: "Laptop HP", quantity: 20, price: 800 },
            { id: "2", name: "Souris", quantity: 50, price: 25 },
            { id: "3", name: "Écran", quantity: 15, price: 200 }
          ],
          totalValue: 20500
        }
      };
      
    case CHAT_MODES.ANALYSIS:
      // Déterminer le type d'analyse à partir du message de l'utilisateur
      const isComparisonRequest = userMessage.toLowerCase().includes('compar') || 
                                userMessage.toLowerCase().includes('versus') ||
                                userMessage.toLowerCase().includes('évolution');
      const isPieRequest = userMessage.toLowerCase().includes('répartition') || 
                         userMessage.toLowerCase().includes('proportion') || 
                         userMessage.toLowerCase().includes('distribution');
      const isLineRequest = userMessage.toLowerCase().includes('tendance') || 
                          userMessage.toLowerCase().includes('évolution') ||
                          userMessage.toLowerCase().includes('progression');

      // Préparer le contenu Markdown
      const markdownContent = `# Analyse des données\n\n${isPieRequest ? 
        '## Répartition des ventes par catégorie\n\nLes produits électroniques représentent la majorité de vos ventes à 45%.' : 
        '## Évolution des ventes\n\nVos ventes ont augmenté de 15% par rapport à la même période l\'année dernière.'}`;
      
      // Créer des données pour le graphique adapté à la demande
      return {
        id: generateUniqueId(),
        content: markdownContent,
        messageType: MESSAGE_TYPES.ANALYSIS,
        isUser: false,
        timestamp,
        analysisData: {
          title: isPieRequest ? "Répartition des ventes par catégorie" : "Évolution des ventes trimestrielles",
          summary: isPieRequest ? 
            "Les produits électroniques dominent les ventes à 45%" : 
            "Hausse globale de 15% par rapport à l'année précédente",
          charts: [
            // Premier graphique - toujours présent
            {
              type: isPieRequest ? "pie" : isLineRequest ? "line" : "bar",
              title: isPieRequest ? 
                "Répartition des ventes par catégorie" : 
                "Évolution des ventes trimestrielles",
              data: isPieRequest ? 
                {
                  // Données pour graphique en camembert
                  labels: ["Électronique", "Meubles", "Vêtements", "Autres"],
                  datasets: [{
                    data: [45, 25, 20, 10],
                    colors: ['#3366CC', '#DC3912', '#FF9900', '#109618']
                  }]
                } : 
                {
                  // Données pour graphique à barres ou lignes
                  labels: ["Q1", "Q2", "Q3", "Q4"],
                  datasets: [
                    { label: "2022", data: [12000, 14500, 13200, 15000], color: '#3366CC' },
                    { label: "2023", data: [14000, 16500, 15300, 17200], color: '#DC3912' }
                  ]
                }
            },
            // Deuxième graphique - conditionnel
            isComparisonRequest ? {
              type: "bar",
              title: "Performance par région",
              data: {
                labels: ["Paris", "Lyon", "Marseille", "Bordeaux"],
                datasets: [
                  { label: "2022", data: [5200, 3100, 2800, 1900], color: '#3366CC' },
                  { label: "2023", data: [5800, 3500, 3200, 2300], color: '#DC3912' }
                ]
              }
            } : null,
          ].filter(Boolean), // Filtrer les valeurs null
          insights: [
            isPieRequest ? "L'électronique représente 45% de vos ventes totales" : 
                        "Croissance continue observée sur tous les trimestres",
            "Votre marge bénéficiaire moyenne est de 24%",
            isComparisonRequest ? "Paris reste votre région la plus performante (+11%)" : 
                               "Les promotions ont augmenté les ventes de 8%"
          ],
          // Code à exécuter pour les graphiques complexes
          chartCode: isPieRequest ? null : `
function renderChart(canvas, data) {
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(50, 100, 255, 0.5)');
  gradient.addColorStop(1, 'rgba(50, 100, 255, 0.1)');
  
  data.datasets[0].backgroundColor = gradient;
  data.datasets[0].borderColor = 'rgba(50, 100, 255, 1)';
  data.datasets[0].fill = true;
  
  return data;
}
          `
        }
      };
      
    case CHAT_MODES.REGULAR:
    default:
      // Format aléatoire pour le mode régulier
      const formats = [MESSAGE_TYPES.REGULAR_CHAT, MESSAGE_TYPES.MARKDOWN, MESSAGE_TYPES.CODE];
      const randomFormat = formats[Math.floor(Math.random() * formats.length)];
      
      if (randomFormat === MESSAGE_TYPES.MARKDOWN) {
        return {
          id: generateUniqueId(),
          content: "# Résumé\n\n* Solde: **12 450€**\n* Dernière transaction: **15/06/2023**\n* Prochaine échéance: **30/06/2023**",
          messageType: MESSAGE_TYPES.MARKDOWN,
          isUser: false,
          timestamp
        };
      } else if (randomFormat === MESSAGE_TYPES.CODE) {
        return {
          id: generateUniqueId(),
          content: "function calculerTVA(montantHT, tauxTVA = 0.2) {\n  return {\n    ht: montantHT,\n    tva: montantHT * tauxTVA,\n    ttc: montantHT * (1 + tauxTVA)\n  };\n}",
          messageType: MESSAGE_TYPES.CODE,
          codeLanguage: "javascript",
          isUser: false,
          timestamp
        };
      } else {
        return {
          id: generateUniqueId(),
          content: "Bonjour, je suis Adha. Comment puis-je vous aider aujourd'hui?",
          messageType: MESSAGE_TYPES.REGULAR_CHAT,
          isUser: false,
          timestamp
        };
      }
  }
};

export const getMockResponseForMessage = (userMessage: string, mode: CHAT_MODES): Promise<Message> => {
  return new Promise((resolve) => {
    // Simuler un délai réseau
    setTimeout(() => {
      resolve(generateMockResponse(userMessage, mode));
    }, 1000);
  });
};
