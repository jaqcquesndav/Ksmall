/**
 * Utilitaires pour travailler avec les contextes React
 */

/**
 * Tente d'accéder à une valeur de contexte même en dehors d'un composant React
 * Cette fonction est utile pour les utilitaires qui peuvent être appelés à la fois
 * depuis des composants React et depuis du code non-React
 * 
 * @param hook - La fonction hook à appeler si possible
 * @returns La valeur du contexte ou null si non disponible
 */
export function getContextValue<T>(hook: () => T): T | null {
  try {
    // Si nous sommes dans un contexte React, cela fonctionnera
    return hook();
  } catch (error) {
    // Si nous ne sommes pas dans un contexte React (par exemple dans un service),
    // cela échouera et nous retournerons null
    return null;
  }
}