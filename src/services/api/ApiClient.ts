import { API_BASE_URL } from '../../config/constants';
import * as AuthStorage from '../auth/AuthStorage';

interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

interface ApiError {
  status?: number;
  statusText?: string;
  data?: any;
  message: string;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // Helper to create a request with auth token
  private async createRequest(url: string, options: RequestInit = {}): Promise<RequestInit> {
    // Merge default headers with provided options
    const headers = { ...this.defaultHeaders, ...options.headers } as Record<string, string>;
    
    // Add auth token if available
    const token = await AuthStorage.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Create the final request options
    return {
      ...options,
      headers,
    };
  }

  // Helper to handle response
  private async handleResponse<T>(response: Response): Promise<T> {
    // Check if the response is ok (status 200-299)
    if (!response.ok) {
      // Handle 401 errors - token expired
      if (response.status === 401) {
        await AuthStorage.clearAllData();
      }
      
      // Parse error response if possible
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: response.statusText };
      }

      // Create and throw error
      const error: ApiError = {
        status: response.status,
        statusText: response.statusText,
        data: errorData,
        message: errorData.message || 'API request failed'
      };
      this.handleApiError(error);
      throw error;
    }

    // Handle no content responses
    if (response.status === 204) {
      return {} as T;
    }
    
    // Parse JSON response
    return await response.json();
  }

  // Implement timeout for fetch (since native fetch doesn't have timeout)
  private fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    return new Promise(async (resolve, reject) => {
      const controller = new AbortController();
      const signal = controller.signal;
      
      const timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error(`Request timeout after ${this.timeout}ms`));
      }, this.timeout);

      try {
        const response = await fetch(url, { ...options, signal });
        clearTimeout(timeoutId);
        resolve(response);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  // API methods
  async get<T = any>(url: string, params?: any): Promise<T> {
    try {
      // Add query parameters to URL if provided
      const queryParams = params ? new URLSearchParams(params).toString() : '';
      const fullUrl = `${this.baseURL}${url}${queryParams ? `?${queryParams}` : ''}`;
      
      const options = await this.createRequest(url, {
        method: 'GET',
      });
      
      const response = await this.fetchWithTimeout(fullUrl, options);
      return this.handleResponse<T>(response);
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async post<T = any>(url: string, data?: any): Promise<T> {
    try {
      const fullUrl = `${this.baseURL}${url}`;
      const options = await this.createRequest(url, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      });
      
      const response = await this.fetchWithTimeout(fullUrl, options);
      return this.handleResponse<T>(response);
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async put<T = any>(url: string, data?: any): Promise<T> {
    try {
      const fullUrl = `${this.baseURL}${url}`;
      const options = await this.createRequest(url, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      });
      
      const response = await this.fetchWithTimeout(fullUrl, options);
      return this.handleResponse<T>(response);
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async delete<T = any>(url: string): Promise<T> {
    try {
      const fullUrl = `${this.baseURL}${url}`;
      const options = await this.createRequest(url, {
        method: 'DELETE',
      });
      
      const response = await this.fetchWithTimeout(fullUrl, options);
      return this.handleResponse<T>(response);
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async uploadFile<T = any>(url: string, formData: FormData): Promise<T> {
    try {
      const fullUrl = `${this.baseURL}${url}`;
      const options = await this.createRequest(url, {
        method: 'POST',
        headers: {
          // Remove content-type to let the browser set it with the boundary
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      
      // Remove content-type for FormData (browser will set it automatically with boundary)
      delete options.headers?.['Content-Type'];
      
      const response = await this.fetchWithTimeout(fullUrl, options);
      return this.handleResponse<T>(response);
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  private handleApiError(error: any): void {
    console.error('API Error:', error);
  }
}

export default new ApiClient();
