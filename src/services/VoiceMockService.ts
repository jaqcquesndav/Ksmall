import { CHAT_MODES } from '../components/chat/ModeSelector';

export const getMockTranscriptForMode = (mode: CHAT_MODES): string => {
  switch (mode) {
    case CHAT_MODES.ACCOUNTING:
      return "Enregistre une facture de 500 dollars pour l'achat de fournitures de bureau";
    case CHAT_MODES.INVENTORY:
      return "Ajoute 20 unités de l'article HP Laptop au prix de 800 dollars chacun";
    case CHAT_MODES.ANALYSIS:
      return "Analyse mes ventes du dernier trimestre et compare-les avec l'année précédente";
    default:
      return "Quel est le solde actuel de mon compte bancaire ?";
  }
};

export const getMockResponseForMode = (mode: CHAT_MODES): string => {
  switch (mode) {
    case CHAT_MODES.ACCOUNTING:
      return "J'ai créé une nouvelle facture d'achat de 500 dollars pour des fournitures de bureau. La facture a été enregistrée dans le système comptable. Voulez-vous voir les détails ?";
    case CHAT_MODES.INVENTORY:
      return "J'ai ajouté 20 unités de HP Laptop à votre inventaire au prix unitaire de 800 dollars. Le stock total est maintenant de 45 unités.";
    case CHAT_MODES.ANALYSIS:
      return "Basé sur l'analyse des ventes du dernier trimestre, vos revenus ont augmenté de 15% par rapport à la même période l'année dernière. Votre produit le plus vendu est le HP Laptop qui représente 35% des ventes totales.";
    default:
      return "Le solde actuel de votre compte bancaire est de 12,450 dollars. Votre dernière transaction était un dépôt de 2,000 dollars il y a 3 jours.";
  }
};
