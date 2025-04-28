import { getAccessToken, hasValidTokens } from '../auth/TokenStorage';
import Auth0Service from '../auth/Auth0Service';
import { isOfflineMode } from '../auth/TokenStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import logger from '../../utils/logger';

/**
 * Options for HTTP requests
 */
export interface HttpRequestOptions extends RequestInit {
  requiresAuth?: boolean;
  offlineFallback?: boolean;
  retries?: number;
  maxRetries?: number;
  retryDelay?: number;
  cacheKey?: string;
  cacheTTL?: number; // in seconds
}

/**
 * Service for intercepting HTTP requests and handling authentication and offline mode
 */
class HttpInterceptor {
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }
  
  /**
   * Perform an HTTP request with interception
   */
  async fetch<T extends Record<string, unknown> = Record<string, unknown>>(endpoint: string, options: HttpRequestOptions = {}): Promise<T> {
    // Default options
    const defaultOptions: HttpRequestOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': `KSMall/${Platform.OS}`,
      },
      requiresAuth: true,
      offlineFallback: true,
      retries: 0,
      maxRetries: 3,
      retryDelay: 1000,
    };
    
    // Merge options
    const opts = { ...defaultOptions, ...options };
    opts.headers = { ...defaultOptions.headers, ...options.headers } as HeadersInit;
    
    // Check if we're offline
    const networkState = await NetInfo.fetch();
    const offline = !networkState.isConnected;
    const offlineMode = await isOfflineMode();
    
    // If we're offline and the request supports offline fallback, try to get from cache
    if ((offline || offlineMode) && opts.offlineFallback && opts.cacheKey) {
      const cachedData = await this.getFromCache(opts.cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }
    
    // Handle authentication if required
    if (opts.requiresAuth) {
      // Check if we have valid tokens
      const isAuthenticated = await hasValidTokens();
      if (!isAuthenticated) {
        throw new Error('Not authenticated');
      }
      
      // Get the access token
      const token = await getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }
      
      // Add the token to the request headers
      opts.headers = {
        ...opts.headers,
        'Authorization': `Bearer ${token}`
      };
    }
    
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    try {
      // Make the request
      const response = await global.fetch(url, opts as RequestInit);
      
      // Handle 401 Unauthorized - Token might be expired
      if (response.status === 401 && opts.requiresAuth && opts.retries < (opts.maxRetries || 3)) {
        // Try to refresh the token
        logger.info(`Received 401 response, attempting to refresh token (retry ${opts.retries + 1}/${opts.maxRetries})`);
        const newToken = await Auth0Service.refreshToken();
        
        if (newToken) {
          // Retry the request with the new token
          return this.fetch<T>(endpoint, {
            ...opts,
            retries: (opts.retries || 0) + 1,
            headers: {
              ...opts.headers,
              'Authorization': `Bearer ${newToken}`
            }
          });
        } else {
          throw new Error('Failed to refresh authentication token');
        }
      }
      
      // Handle other error responses
      if (!response.ok) {
        const errorText = await response.text();
        try {
          // Try to parse as JSON error
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || `API error: ${response.status}`);
        } catch (parseError) {
          throw new Error(`API error: ${response.status} - ${errorText || 'Unknown error'}`);
        }
      }
      
      // Check content type
      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      // Cache the response if a cache key is provided
      if (opts.cacheKey && data) {
        await this.saveToCache(opts.cacheKey, data, opts.cacheTTL);
      }
      
      return data;
    } catch (error) {
      // If offline and retry attempts are available, queue the request for later
      if (offline && opts.offlineFallback) {
        await this.queueRequest(endpoint, opts);
      }
      
      logger.error(`HTTP request failed: ${url}`, error);
      throw error;
    }
  }
  
  /**
   * Get data from cache
   * Using a type safe approach to handle the generic conversion properly
   */
  private async getFromCache<T extends Record<string, unknown>>(key: string): Promise<T | null> {
    try {
      const cacheData = await AsyncStorage.getItem(`http_cache_${key}`);
      if (!cacheData) return null;
      
      const parsedData = JSON.parse(cacheData);
      const { data, expiry } = parsedData;
      
      // Check if the cache has expired
      if (expiry && Date.now() > expiry) {
        // Cache expired
        await AsyncStorage.removeItem(`http_cache_${key}`);
        return null;
      }
      
      // First check if data is an object
      if (data && typeof data === 'object' && data !== null) {
        // Force TypeScript to accept this using a Function constructor approach
        // This effectively bypasses the type checking while maintaining runtime type safety
        // through our own manual type checks
        return JSON.parse(JSON.stringify(data)) as T;
      }
      
      logger.warn(`Cache data for key ${key} is not an object, returning null`);
      return null;
    } catch (error) {
      logger.error('Error getting data from cache:', error);
      return null;
    }
  }
  
  /**
   * Save data to cache
   */
  private async saveToCache(key: string, data: any, ttl: number = 3600): Promise<void> {
    try {
      const expiry = Date.now() + (ttl * 1000);
      await AsyncStorage.setItem(`http_cache_${key}`, JSON.stringify({ data, expiry }));
    } catch (error) {
      logger.error('Error saving data to cache:', error);
    }
  }
  
  /**
   * Queue a request to be executed when back online
   */
  private async queueRequest(endpoint: string, options: HttpRequestOptions): Promise<void> {
    try {
      // Get current queue
      const queueJson = await AsyncStorage.getItem('http_request_queue');
      const queue = queueJson ? JSON.parse(queueJson) : [];
      
      // Add request to queue
      queue.push({
        endpoint,
        options,
        timestamp: Date.now()
      });
      
      // Save updated queue
      await AsyncStorage.setItem('http_request_queue', JSON.stringify(queue));
    } catch (error) {
      logger.error('Error queueing request for offline mode:', error);
    }
  }
  
  /**
   * Process all queued requests
   */
  async processQueue(): Promise<void> {
    try {
      // Get current queue
      const queueJson = await AsyncStorage.getItem('http_request_queue');
      if (!queueJson) return;
      
      const queue = JSON.parse(queueJson);
      if (!queue.length) return;
      
      // Clear the queue immediately to prevent duplicate processing
      await AsyncStorage.removeItem('http_request_queue');
      
      logger.info(`Processing ${queue.length} queued requests`);
      
      // Process each request
      for (const item of queue) {
        try {
          // Skip authentication for the request as we'll handle it here
          const { endpoint, options } = item;
          
          // Disable offline fallback to prevent re-queueing
          options.offlineFallback = false;
          
          await this.fetch(endpoint, options);
          logger.info(`Processed queued request to ${endpoint}`);
        } catch (error) {
          logger.error('Error processing queued request:', error);
        }
      }
    } catch (error) {
      logger.error('Error processing queue:', error);
    }
  }
  
  /**
   * GET request
   */
  async get<T extends Record<string, unknown> = Record<string, unknown>>(endpoint: string, options: HttpRequestOptions = {}): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'GET' });
  }
  
  /**
   * POST request
   */
  async post<T extends Record<string, unknown> = Record<string, unknown>>(endpoint: string, data: any, options: HttpRequestOptions = {}): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  /**
   * PUT request
   */
  async put<T extends Record<string, unknown> = Record<string, unknown>>(endpoint: string, data: any, options: HttpRequestOptions = {}): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  
  /**
   * PATCH request
   */
  async patch<T extends Record<string, unknown> = Record<string, unknown>>(endpoint: string, data: any, options: HttpRequestOptions = {}): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
  
  /**
   * DELETE request
   */
  async delete<T extends Record<string, unknown> = Record<string, unknown>>(endpoint: string, options: HttpRequestOptions = {}): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create and export instances for different API endpoints
export const authHttp = new HttpInterceptor('https://auth-api.kiota-suite.com');
export const accountingHttp = new HttpInterceptor('https://accounting-api.kiota-suite.com');
export const inventoryHttp = new HttpInterceptor('https://inventory-api.kiota-suite.com');
export const portfolioHttp = new HttpInterceptor('https://portfolio-api.kiota-suite.com');

export default HttpInterceptor;