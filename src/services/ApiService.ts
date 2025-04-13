import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * API Service for handling backend requests
 */
class ApiService {
  private static instance: ApiService;
  private api: AxiosInstance;
  private apiUrl: string = 'https://api.ksmall.com/v1'; // Replace with actual API URL
  
  private constructor() {
    this.api = axios.create({
      baseURL: this.apiUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    // Request interceptor for adding auth token
    this.api.interceptors.request.use(
      async (config: AxiosRequestConfig) => {
        const token = await AsyncStorage.getItem('@auth_token');
        if (token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          };
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor for handling common errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Handle 401 Unauthorized errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Attempt to refresh token
            const refreshToken = await AsyncStorage.getItem('@refresh_token');
            
            if (!refreshToken) {
              // No refresh token, clear auth and redirect to login
              await this.clearAuthData();
              return Promise.reject(error);
            }
            
            const response = await axios.post(`${this.apiUrl}/auth/refresh`, {
              refresh_token: refreshToken,
            });
            
            if (response.data.access_token) {
              // Save the new tokens
              await AsyncStorage.setItem('@auth_token', response.data.access_token);
              if (response.data.refresh_token) {
                await AsyncStorage.setItem('@refresh_token', response.data.refresh_token);
              }
              
              // Retry the original request with new token
              originalRequest.headers['Authorization'] = `Bearer ${response.data.access_token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Token refresh failed, clear auth data
            await this.clearAuthData();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Get singleton instance of ApiService
   */
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }
  
  /**
   * Clear authentication data
   */
  private async clearAuthData(): Promise<void> {
    await AsyncStorage.multiRemove(['@auth_token', '@refresh_token', '@user']);
    // In a real app, you might want to trigger an event to redirect to login
  }
  
  /**
   * Make GET request
   * @param url - Endpoint URL
   * @param params - Query parameters
   */
  public async get<T = any>(url: string, params?: any): Promise<T> {
    const response = await this.api.get<T>(url, { params });
    return response.data;
  }
  
  /**
   * Make POST request
   * @param url - Endpoint URL
   * @param data - Request body
   * @param config - Additional configuration
   */
  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }
  
  /**
   * Make PUT request
   * @param url - Endpoint URL
   * @param data - Request body
   */
  public async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.api.put<T>(url, data);
    return response.data;
  }
  
  /**
   * Make PATCH request
   * @param url - Endpoint URL
   * @param data - Request body
   */
  public async patch<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.api.patch<T>(url, data);
    return response.data;
  }
  
  /**
   * Make DELETE request
   * @param url - Endpoint URL
   */
  public async delete<T = any>(url: string): Promise<T> {
    const response = await this.api.delete<T>(url);
    return response.data;
  }
  
  /**
   * Upload file with form data
   * @param url - Endpoint URL
   * @param fileUri - File URI
   * @param fileField - Form field name for the file
   * @param additionalData - Additional form data
   */
  public async uploadFile<T = any>(
    url: string,
    fileUri: string,
    fileField: string = 'file',
    additionalData?: Record<string, any>
  ): Promise<T> {
    const formData = new FormData();
    
    const fileName = fileUri.split('/').pop();
    const match = /\.(\w+)$/.exec(fileUri.split('?')[0]);
    const fileType = match ? `image/${match[1]}` : 'image';
    
    formData.append(fileField, {
      uri: fileUri,
      name: fileName,
      type: fileType,
    } as any);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }
    
    const response = await this.api.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }
}

export default ApiService.getInstance();
