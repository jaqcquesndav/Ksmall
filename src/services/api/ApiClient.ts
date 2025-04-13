import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL } from '../../config/constants';
import * as AuthStorage from '../auth/AuthStorage';

class ApiClient {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private async setupInterceptors(): Promise<void> {
    // Request interceptor - add auth token to requests
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AuthStorage.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token expiration and errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Handle 401 errors - token expired
        if (error.response?.status === 401) {
          // Attempt to refresh token logic would go here
          // For now, just logout
          await AuthStorage.clearAllData();
        }
        return Promise.reject(error);
      }
    );
  }

  // API methods
  async get<T = any>(url: string, params?: any): Promise<T> {
    try {
      const response = await this.api.get<T>(url, { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async post<T = any>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.api.post<T>(url, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async put<T = any>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.api.put<T>(url, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async delete<T = any>(url: string): Promise<T> {
    try {
      const response = await this.api.delete<T>(url);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async uploadFile<T = any>(url: string, formData: FormData): Promise<T> {
    try {
      const response = await this.api.post<T>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  private handleApiError(error: any): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('API Error:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
      });
    } else {
      console.error('Unexpected API error:', error);
    }
  }
}

export default new ApiClient();
