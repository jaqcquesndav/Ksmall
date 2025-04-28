import { getAccessToken } from '../auth/TokenStorage';
import Auth0Service from '../auth/Auth0Service';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
  retries?: number;
}

/**
 * API client for making authenticated requests to backend services
 */
class ApiClient {
  private baseUrl: string;
  private maxRetries: number = 3;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }
  
  /**
   * Make a request with automatic token handling
   */
  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    // Default options
    const defaultOptions: RequestOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      requiresAuth: true,
      retries: 0,
    };
    
    // Merge options
    const opts = { ...defaultOptions, ...options };
    opts.headers = { ...defaultOptions.headers, ...options.headers };
    
    // Add authorization header if required
    if (opts.requiresAuth) {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('No access token available. Please log in.');
      }
      
      opts.headers = {
        ...opts.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    
    // Make the request
    try {
      const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      const response = await fetch(url, opts);
      
      // Handle 401 Unauthorized - Token might be expired
      if (response.status === 401 && opts.retries < this.maxRetries) {
        // Try to refresh the token
        const newToken = await Auth0Service.refreshToken();
        if (newToken) {
          // Retry the request with the new token
          return this.request<T>(endpoint, {
            ...opts,
            retries: (opts.retries || 0) + 1,
            headers: {
              ...opts.headers,
              Authorization: `Bearer ${newToken}`,
            },
          });
        } else {
          throw new Error('Unable to refresh authentication token');
        }
      }
      
      // For any other error, throw
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }
      
      // Return the data
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      } else {
        return response.text() as unknown as T;
      }
      
    } catch (error) {
      console.error(`Error in API request to ${endpoint}:`, error);
      throw error;
    }
  }
  
  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }
  
  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  
  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
  
  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export instances for different API endpoints
export const authApi = new ApiClient('https://auth-api.kiota-suite.com');
export const accountingApi = new ApiClient('https://accounting-api.kiota-suite.com');
export const inventoryApi = new ApiClient('https://inventory-api.kiota-suite.com');
export const portfolioApi = new ApiClient('https://portfolio-api.kiota-suite.com');

export default ApiClient;
