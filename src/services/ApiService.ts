import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * API Service for handling backend requests using fetch
 */
class ApiService {
  private static instance: ApiService;
  private apiUrl: string = 'https://api.ksmall.com/v1'; // Replace with actual API URL
  private timeout: number = 15000;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async getAuthHeaders(contentType: string = 'application/json') {
    const token = await AsyncStorage.getItem('@auth_token');
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Accept': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        await this.clearAuthData();
      }
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      throw { status: response.status, data: errorData, message: errorData.message || 'API request failed' };
    }
    if (response.status === 204) return {} as T;
    return response.json();
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const signal = controller.signal;
      const timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error(`Request timeout after ${this.timeout}ms`));
      }, this.timeout);
      fetch(url, { ...options, signal })
        .then((response) => {
          clearTimeout(timeoutId);
          resolve(response);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private async clearAuthData(): Promise<void> {
    await AsyncStorage.multiRemove(['@auth_token', '@refresh_token', '@user']);
  }

  public async get<T = any>(url: string, params?: any): Promise<T> {
    let fullUrl = `${this.apiUrl}${url}`;
    if (params) {
      const query = new URLSearchParams(params).toString();
      fullUrl += `?${query}`;
    }
    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithTimeout(fullUrl, { method: 'GET', headers });
    return this.handleResponse<T>(response);
  }

  public async post<T = any>(url: string, data?: any): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithTimeout(
      `${this.apiUrl}${url}`,
      {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      }
    );
    return this.handleResponse<T>(response);
  }

  public async put<T = any>(url: string, data?: any): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithTimeout(
      `${this.apiUrl}${url}`,
      {
        method: 'PUT',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      }
    );
    return this.handleResponse<T>(response);
  }

  public async patch<T = any>(url: string, data?: any): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithTimeout(
      `${this.apiUrl}${url}`,
      {
        method: 'PATCH',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      }
    );
    return this.handleResponse<T>(response);
  }

  public async delete<T = any>(url: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithTimeout(
      `${this.apiUrl}${url}`,
      {
        method: 'DELETE',
        headers,
      }
    );
    return this.handleResponse<T>(response);
  }

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
    const headers = await this.getAuthHeaders();
    // Remove content-type to let fetch/browser set the correct boundary
    delete headers['Content-Type'];
    const response = await this.fetchWithTimeout(
      `${this.apiUrl}${url}`,
      {
        method: 'POST',
        headers,
        body: formData,
      }
    );
    return this.handleResponse<T>(response);
  }
}

export default ApiService.getInstance();
