import ApiService from './ApiService';
import { Customer, CustomerListFilters, CustomerType, CustomerStatus, CustomerAnalytics } from '../types/Customer';

/**
 * Service pour la gestion des clients
 */
class CustomerService {
  private api: typeof ApiService;

  constructor() {
    this.api = ApiService;
  }

  /**
   * Récupère la liste des clients avec filtrage et pagination
   */
  async getCustomers(filters?: CustomerListFilters, page: number = 1, limit: number = 20): Promise<{
    data: Customer[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const response = await this.api.get('/customers', {
        params: {
          ...filters,
          page,
          limit
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  /**
   * Récupère un client par son ID
   */
  async getCustomerById(id: string): Promise<Customer> {
    try {
      const response = await this.api.get(`/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching customer with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crée un nouveau client
   */
  async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    try {
      const response = await this.api.post('/customers', customerData);
      return response.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Met à jour un client existant
   */
  async updateCustomer(id: string, customerData: Partial<Customer>): Promise<Customer> {
    try {
      const response = await this.api.put(`/customers/${id}`, customerData);
      return response.data;
    } catch (error) {
      console.error(`Error updating customer with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Supprime un client
   */
  async deleteCustomer(id: string): Promise<boolean> {
    try {
      await this.api.delete(`/customers/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting customer with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Importe des clients depuis un fichier
   */
  async importCustomers(
    fileUri: string,
    options?: { headerRow?: boolean; mapping?: Record<string, string> }
  ): Promise<{ success: boolean; imported: number; errors: number; log: string[] }> {
    try {
      // Dans un environnement mobile, nous utilisons un URI de fichier local
      const formData = new FormData();
      // Adapter l'utilisation selon le contexte (React Native vs Web)
      const fileInfo = { uri: fileUri, name: 'import-data.csv', type: 'text/csv' };
      formData.append('file', fileInfo as any);
      
      if (options) {
        formData.append('options', JSON.stringify(options));
      }
      
      const response = await this.api.post('/customers/import', {
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error importing customers:', error);
      throw error;
    }
  }

  /**
   * Exporte la liste des clients
   */
  async exportCustomers(
    format: 'csv' | 'xlsx' | 'pdf', 
    options?: { ids?: string[]; includeInactive?: boolean }
  ): Promise<string> {
    try {
      const response = await this.api.get('/customers/export', {
        params: {
          format,
          ...options
        },
        responseType: 'blob'
      });
      
      // Crée une URL pour le blob reçu
      const url = window.URL.createObjectURL(new Blob([response.data]));
      return url;
    } catch (error) {
      console.error('Error exporting customers:', error);
      throw error;
    }
  }

  /**
   * Analyse le comportement d'achat d'un client
   */
  async analyzeCustomerPurchaseBehavior(
    customerId: string, 
    options?: { startDate?: string; endDate?: string }
  ): Promise<CustomerAnalytics> {
    try {
      const response = await this.api.get(`/customers/${customerId}/analytics`, {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error(`Error analyzing customer behavior for customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Recherche des clients par terme de recherche
   */
  async searchCustomers(searchTerm: string, limit: number = 10): Promise<Customer[]> {
    try {
      const response = await this.api.get('/customers/search', {
        params: {
          q: searchTerm,
          limit
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }
}

export default new CustomerService();