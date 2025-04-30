/**
 * Utilitaire de compression/décompression des données pour la synchronisation
 * Utilise LZ-String pour une compression légère mais efficace des chaînes JSON
 */

import * as LZString from 'lz-string';

/**
 * Compresse une chaîne ou un objet JSON
 * @param {any} data Données à compresser (objet, tableau ou chaîne)
 * @returns {string} Chaîne compressée
 */
export function compressData(data: any): string {
  try {
    // Si les données sont un objet ou un tableau, les convertir en chaîne JSON
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    // Compresser avec LZ-String
    return LZString.compressToUTF16(jsonString);
  } catch (error) {
    console.error('Erreur lors de la compression des données:', error);
    // En cas d'erreur, renvoyer les données originales
    return typeof data === 'string' ? data : JSON.stringify(data);
  }
}

/**
 * Décompresse une chaîne compressée et la reconvertit en objet si possible
 * @param {string} compressedData Chaîne compressée
 * @param {boolean} parseJson Tenter de parser la chaîne en JSON après décompression
 * @returns {any} Données décompressées (objet si parseJson est true, sinon chaîne)
 */
export function decompressData(compressedData: string, parseJson: boolean = true): any {
  try {
    if (!compressedData) return null;
    
    // Décompresser avec LZ-String
    const decompressed = LZString.decompressFromUTF16(compressedData);
    
    // Si la décompression échoue ou si on ne veut pas parser en JSON
    if (!decompressed || !parseJson) return decompressed;
    
    // Tenter de parser en JSON
    return JSON.parse(decompressed);
  } catch (error) {
    console.error('Erreur lors de la décompression des données:', error);
    // En cas d'erreur, renvoyer la chaîne telle quelle
    return compressedData;
  }
}

/**
 * Calcule le taux de compression obtenu
 * @param {string} original Données originales
 * @param {string} compressed Données compressées
 * @returns {number} Pourcentage de réduction de la taille (0-100)
 */
export function getCompressionRatio(original: string, compressed: string): number {
  const originalSize = original.length;
  const compressedSize = compressed.length;
  
  if (originalSize === 0) return 0;
  
  return Math.round((1 - (compressedSize / originalSize)) * 100);
}

export default {
  compressData,
  decompressData,
  getCompressionRatio
};