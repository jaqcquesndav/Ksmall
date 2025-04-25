import { useState, useCallback, useEffect } from 'react';
import API from '../../services/API';
import logger from '../../utils/logger';
import { ApiError } from '../../services/api/config/apiConfig';
import { useNetInfo } from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Options pour le hook useApi
 */
export interface UseApiOptions<T> {
  /** Déclenchement automatique de l'appel API au montage du composant */
  autoFetch?: boolean;
  /** Recharger les données quand l'écran est focus */
  fetchOnFocus?: boolean;
  /** Données initiales */
  initialData?: T;
  /** Fonction de transformation des données */
  transform?: (data: any) => T;
  /** Fonction de callback en cas de succès */
  onSuccess?: (data: T) => void;
  /** Fonction de callback en cas d'erreur */
  onError?: (error: ApiError) => void;
  /** Configuration pour le cache */
  cache?: {
    /** Clé de cache unique */
    key: string;
    /** Durée de validité du cache en millisecondes */
    ttl: number;
    /** Toujours charger depuis le cache d'abord puis mettre à jour */
    loadFromCacheFirst?: boolean;
  };
}

/**
 * Résultat du hook useApi
 */
export interface UseApiResult<T> {
  /** Données retournées par l'API */
  data: T | null;
  /** Erreur éventuelle */
  error: ApiError | null;
  /** État de chargement */
  isLoading: boolean;
  /** État d'actualisation (pour pull-to-refresh) */
  isRefreshing: boolean;
  /** État de la soumission de données */
  isSubmitting: boolean;
  /** Indique si le chargement initial est terminé */
  isInitialLoading: boolean;
  /** Fonction d'exécution de l'appel API avec arguments optionnels */
  execute: (...args: any[]) => Promise<T | null>;
  /** Fonction de rechargement des données */
  refresh: () => Promise<T | null>;
  /** Fonction de réinitialisation des états */
  reset: () => void;
  /** Fonction de soumission de données avec méthode personnalisée */
  submit: <R = any>(method: string, endpoint: string, data?: any) => Promise<R | null>;
  /** Indique si les données proviennent du cache */
  isFromCache: boolean;
  /** Indique si l'application est en ligne */
  isOnline: boolean;
}

/**
 * Hook pour faciliter l'utilisation des APIs
 * 
 * @param executor Fonction d'exécution de l'appel API
 * @param options Options de configuration
 * @returns Résultat du hook avec données, états et fonctions utilitaires
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, execute } = useApi(
 *   (id) => API.accounting.getTransaction(id),
 *   { autoFetch: false }
 * );
 * 
 * // Puis dans un useEffect ou un événement
 * useEffect(() => {
 *   if (transactionId) {
 *     execute(transactionId);
 *   }
 * }, [transactionId]);
 * ```
 */
export function useApi<T = any>(
  executor: (...args: any[]) => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const {
    autoFetch = true,
    fetchOnFocus = false,
    initialData = null,
    transform,
    onSuccess,
    onError,
    cache
  } = options;

  // États
  const [data, setData] = useState<T | null>(initialData);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(autoFetch);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(autoFetch);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);
  const [executionArgs, setExecutionArgs] = useState<any[]>([]);

  // État de la connexion réseau
  const netInfo = useNetInfo();
  const isOnline = netInfo.isConnected === true;

  // Fonction pour charger les données depuis le cache
  const loadFromCache = useCallback(async () => {
    if (!cache) return null;
    
    try {
      const cachedItem = await API.core.getFromCache(cache.key);
      if (cachedItem) {
        const { data: cachedData, timestamp } = cachedItem;
        const isExpired = Date.now() - timestamp > cache.ttl;
        
        if (!isExpired) {
          const transformedData = transform ? transform(cachedData) : cachedData;
          setData(transformedData);
          setIsFromCache(true);
          return transformedData;
        }
      }
    } catch (err) {
      logger.warn('Erreur lors du chargement depuis le cache', err);
    }
    
    return null;
  }, [cache, transform]);

  // Fonction pour exécuter l'appel API
  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    setExecutionArgs(args);
    setError(null);
    
    // Vérifie si on doit charger depuis le cache d'abord
    if (cache?.loadFromCacheFirst && !isRefreshing) {
      const cachedData = await loadFromCache();
      if (cachedData) {
        // Si on a des données en cache, ne pas afficher le loader
        setIsInitialLoading(false);
        return cachedData;
      }
    }
    
    if (!isRefreshing) {
      setIsLoading(true);
    }
    
    try {
      // Exécute l'appel API
      const result = await executor(...args);
      const transformedResult = transform ? transform(result) : result;
      
      // Met à jour les états
      setData(transformedResult);
      setIsFromCache(false);
      
      // Stocke dans le cache si nécessaire
      if (cache) {
        try {
          await API.core.saveToCache(cache.key, result);
        } catch (err) {
          logger.warn('Erreur lors de la sauvegarde dans le cache', err);
        }
      }
      
      // Appelle le callback de succès si fourni
      if (onSuccess) {
        onSuccess(transformedResult);
      }
      
      return transformedResult;
    } catch (err) {
      const apiError = err instanceof ApiError 
        ? err 
        : new ApiError(
            err?.message || 'Une erreur est survenue', 
            500, 
            { originalError: err, code: 'UNKNOWN' }
          );
      
      setError(apiError);
      
      // Appelle le callback d'erreur si fourni
      if (onError) {
        onError(apiError);
      }
      
      logger.error('Erreur API', apiError);
      return null;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsInitialLoading(false);
    }
  }, [executor, transform, onSuccess, onError, cache, loadFromCache, isRefreshing]);

  // Fonction pour rafraîchir les données
  const refresh = useCallback(async (): Promise<T | null> => {
    setIsRefreshing(true);
    return execute(...executionArgs);
  }, [execute, executionArgs]);

  // Fonction pour réinitialiser les états
  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setIsLoading(false);
    setIsRefreshing(false);
    setIsSubmitting(false);
    setIsInitialLoading(false);
    setIsFromCache(false);
    setExecutionArgs([]);
  }, [initialData]);

  // Fonction pour soumettre des données
  const submit = useCallback(async <R = any>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<R | null> => {
    setError(null);
    setIsSubmitting(true);
    
    try {
      const result = await API.core.request(method, endpoint, data) as R;
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError 
        ? err 
        : new ApiError(
            err?.message || 'Une erreur est survenue lors de la soumission',
            500,
            { originalError: err, code: 'SUBMISSION_ERROR' }
          );
      
      setError(apiError);
      
      if (onError) {
        onError(apiError);
      }
      
      logger.error('Erreur lors de la soumission', apiError);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [onError]);

  // Effet pour le chargement automatique
  useEffect(() => {
    if (autoFetch) {
      if (cache?.loadFromCacheFirst) {
        // Charger depuis le cache, puis mettre à jour avec les données fraiches
        loadFromCache().then(cachedData => {
          if (!cachedData) {
            execute();
          } else {
            // Si on a des données en cache, on charge aussi les données fraîches
            execute();
          }
        });
      } else {
        execute();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effet pour recharger les données quand l'écran est focus
  useFocusEffect(
    useCallback(() => {
      if (fetchOnFocus && !isInitialLoading) {
        refresh();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchOnFocus, refresh])
  );

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    isSubmitting,
    isInitialLoading,
    execute,
    refresh,
    reset,
    submit,
    isFromCache,
    isOnline
  };
}