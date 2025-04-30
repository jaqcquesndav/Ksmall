import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import logger from './logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Service pour optimiser les images dans l'application
 */
class ImageOptimizer {
  private static IMAGE_CACHE_PREFIX = 'optimized_image_';
  private static MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours
  private static MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50 MB
  
  /**
   * Optimise une image pour réduire sa taille
   * @param uri URI de l'image à optimiser
   * @param options Options d'optimisation
   * @returns URI de l'image optimisée
   */
  static async optimizeImage(
    uri: string, 
    options: { 
      width?: number; 
      height?: number; 
      quality?: number 
    } = {}
  ): Promise<string> {
    try {
      // Vérifier si l'image est déjà dans le cache
      const cacheKey = `${this.IMAGE_CACHE_PREFIX}${uri}`;
      const cachedImage = await AsyncStorage.getItem(cacheKey);
      
      if (cachedImage) {
        const imageData = JSON.parse(cachedImage);
        const fileExists = await FileSystem.getInfoAsync(imageData.optimizedUri);
        
        if (fileExists.exists) {
          logger.debug(`Image trouvée en cache: ${uri}`);
          return imageData.optimizedUri;
        }
      }
      
      // Définir les options de manipulation
      const manipulationOptions: ImageManipulator.Action[] = [];
      
      // Redimensionner si nécessaire
      if (options.width || options.height) {
        manipulationOptions.push({
          resize: {
            width: options.width || undefined,
            height: options.height || undefined,
          },
        });
      }
      
      // Optimiser l'image
      const result = await ImageManipulator.manipulateAsync(
        uri,
        manipulationOptions,
        {
          compress: options.quality ? options.quality / 100 : 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      
      // Sauvegarder dans le cache
      await AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({
          originalUri: uri,
          optimizedUri: result.uri,
          timestamp: Date.now(),
        })
      );
      
      logger.debug(`Image optimisée: ${uri}`);
      return result.uri;
    } catch (error) {
      logger.error(`Erreur lors de l'optimisation de l'image: ${error}`);
      return uri; // Retourner l'URI original en cas d'erreur
    }
  }
  
  /**
   * Précharger et optimiser les images pour un accès plus rapide
   * @param uris Liste des URIs d'images à précharger
   */
  static async preloadImages(uris: string[]): Promise<void> {
    try {
      const promises = uris.map(uri => this.optimizeImage(uri, { quality: 60 }));
      await Promise.all(promises);
      logger.debug(`${uris.length} images préchargées avec succès`);
    } catch (error) {
      logger.error(`Erreur lors du préchargement des images: ${error}`);
    }
  }
  
  /**
   * Nettoyer le cache d'images
   */
  static async cleanCache(): Promise<void> {
    try {
      // Récupérer toutes les clés du cache
      const allKeys = await AsyncStorage.getAllKeys();
      const imageCacheKeys = allKeys.filter(key => key.startsWith(this.IMAGE_CACHE_PREFIX));
      
      if (imageCacheKeys.length === 0) {
        return;
      }
      
      // Récupérer les données de cache
      const cacheData = await AsyncStorage.multiGet(imageCacheKeys);
      const now = Date.now();
      const keysToDelete = [];
      
      // Vérifier les images expirées
      for (const [key, value] of cacheData) {
        if (!value) continue;
        
        const imageData = JSON.parse(value);
        const age = now - imageData.timestamp;
        
        // Supprimer si trop vieux
        if (age > this.MAX_CACHE_AGE_MS) {
          keysToDelete.push(key);
          
          // Supprimer aussi le fichier
          try {
            await FileSystem.deleteAsync(imageData.optimizedUri, { idempotent: true });
          } catch (err) {
            // Ignorer les erreurs de suppression de fichier
          }
        }
      }
      
      // Supprimer les clés expirées
      if (keysToDelete.length > 0) {
        await AsyncStorage.multiRemove(keysToDelete);
        logger.debug(`${keysToDelete.length} images expirées supprimées du cache`);
      }
    } catch (error) {
      logger.error(`Erreur lors du nettoyage du cache d'images: ${error}`);
    }
  }
}

export default ImageOptimizer;