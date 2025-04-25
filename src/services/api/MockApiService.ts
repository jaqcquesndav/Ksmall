import { CHAT_MODES } from '../../components/chat/ModeSelector';
import logger from '../../utils/logger';
import { generateUniqueId } from '../../utils/helpers';
import mockData from './mockData';
import { OfflineActionType } from './config/apiConfig';

/**
 * Service Mock API pour simuler les réponses du backend lorsque l'application est hors ligne
 * Ce service est utilisé pour le développement et les tests hors ligne
 */
class MockApiService {
  private mockData = mockData;

  /**
   * Simule une requête API et retourne des données mock
   */
  async mockRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<T> {
    // Journalisation de la requête simulée
    logger.debug(`MockApiService: ${method} ${endpoint}`, { data, params });
    
    // Introduire un délai artificiel pour simuler la latence réseau
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
    
    // Si l'endpoint contient "error" ou "fail", simuler une erreur
    if (endpoint.includes('error') || endpoint.includes('fail')) {
      throw new Error(`Erreur simulée pour la requête ${method} ${endpoint}`);
    }
    
    // Dispatcher vers le bon gestionnaire selon l'endpoint et la méthode
    if (endpoint.startsWith('/auth')) {
      return this.handleAuthEndpoint(method, endpoint, data) as unknown as T;
    } else if (endpoint.startsWith('/accounting')) {
      return this.handleAccountingEndpoint(method, endpoint, data, params) as unknown as T;
    } else if (endpoint.startsWith('/inventory')) {
      return this.handleInventoryEndpoint(method, endpoint, data, params) as unknown as T;
    } else if (endpoint.startsWith('/chat')) {
      return this.handleChatEndpoint(method, endpoint, data) as unknown as T;
    } else if (endpoint.startsWith('/payments')) {
      return this.handlePaymentEndpoint(method, endpoint, data) as unknown as T;
    } else if (endpoint.startsWith('/dashboard')) {
      return this.handleDashboardEndpoint(method, endpoint, data, params) as unknown as T;
    } else if (endpoint.startsWith('/users') || endpoint.startsWith('/companies')) {
      return this.handleUserEndpoint(method, endpoint, data, params) as unknown as T;
    }
    
    // Endpoint inconnu
    return { message: 'Endpoint non géré par le service mock' } as unknown as T;
  }

  /**
   * Gère les endpoints d'authentification
   */
  private handleAuthEndpoint(method: string, endpoint: string, data?: any): any {
    if (method === 'POST' && endpoint === '/auth/login') {
      return this.mockData.auth.loginResponse;
    } else if (method === 'POST' && endpoint === '/auth/register') {
      return {
        ...this.mockData.auth.loginResponse,
        user: {
          ...this.mockData.auth.loginResponse.user,
          email: data?.email,
          displayName: data?.displayName
        }
      };
    } else if (method === 'POST' && endpoint === '/auth/refresh-token') {
      return {
        token: 'mock_refreshed_token_' + new Date().getTime(),
        expiresAt: new Date().getTime() + 3600000
      };
    } else if (endpoint.includes('/profile') && method === 'PUT') {
      return {
        ...this.mockData.auth.loginResponse.user,
        ...data
      };
    }
    
    return {};
  }

  /**
   * Gère les endpoints de comptabilité
   */
  private handleAccountingEndpoint(method: string, endpoint: string, data?: any, params?: Record<string, any>): any {
    if (endpoint === '/accounting/transactions' && method === 'GET') {
      // Filtrer les transactions si des paramètres sont fournis
      let transactions = [...this.mockData.accounting.transactions];
      
      if (params?.startDate) {
        transactions = transactions.filter(t => 
          new Date(t.date) >= new Date(params.startDate)
        );
      }
      
      if (params?.endDate) {
        transactions = transactions.filter(t => 
          new Date(t.date) <= new Date(params.endDate)
        );
      }
      
      if (params?.status) {
        transactions = transactions.filter(t => 
          t.status === params.status
        );
      }
      
      return transactions;
    } else if (endpoint.match(/\/accounting\/transactions\/[a-zA-Z0-9-]+$/) && method === 'GET') {
      // Récupérer une transaction par ID
      const id = endpoint.split('/').pop();
      return this.mockData.accounting.transactions.find(t => t.id === id) || null;
    } else if (endpoint === '/accounting/transactions' && method === 'POST') {
      // Créer une nouvelle transaction
      const newTransaction = {
        id: generateUniqueId(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return newTransaction;
    } else if (endpoint === '/accounting/accounts' && method === 'GET') {
      return this.mockData.accounting.accounts;
    } else if (endpoint.includes('/reports') && method === 'POST') {
      // Simuler la génération d'un rapport financier
      return {
        id: generateUniqueId(),
        title: data?.reportType === 'balance_sheet' ? 'Bilan' : 
               data?.reportType === 'income_statement' ? 'Compte de résultat' : 
               data?.reportType === 'cash_flow' ? 'Tableau de flux de trésorerie' : 
               'État financier',
        type: data?.reportType || 'balance_sheet',
        startDate: data?.startDate || new Date().toISOString().split('T')[0],
        endDate: data?.endDate || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        data: this.mockData.accounting.financialReportData
      };
    } else if (endpoint === '/accounting/ledger' && method === 'GET') {
      // Simuler la récupération du grand livre
      return {
        ledgerEntries: this.mockData.accounting.ledgerEntries,
        startDate: params?.startDate || new Date().toISOString().split('T')[0],
        endDate: params?.endDate || new Date().toISOString().split('T')[0],
        totalDebit: 15000,
        totalCredit: 15000,
        accounts: this.mockData.accounting.accounts
      };
    } else if (endpoint === '/accounting/journal-entries' && method === 'GET') {
      return this.mockData.accounting.journalEntries;
    } else if (endpoint === '/accounting/journal-entries' && method === 'POST') {
      // Créer une nouvelle écriture comptable
      return {
        journalEntryId: generateUniqueId()
      };
    }
    
    return {};
  }

  /**
   * Gère les endpoints d'inventaire
   */
  private handleInventoryEndpoint(method: string, endpoint: string, data?: any, params?: Record<string, any>): any {
    if (endpoint === '/inventory/products' && method === 'GET') {
      // Filtrer les produits si des paramètres sont fournis
      let products = [...this.mockData.inventory.products];
      
      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        products = products.filter(p => 
          p.name.toLowerCase().includes(searchLower) || 
          p.sku.toLowerCase().includes(searchLower) || 
          p.description.toLowerCase().includes(searchLower)
        );
      }
      
      if (params?.category) {
        products = products.filter(p => p.category === params.category);
      }
      
      if (params?.inStock === true) {
        products = products.filter(p => p.quantity > 0);
      }
      
      // Limiter les résultats
      if (params?.limit && params?.offset) {
        const limit = parseInt(params.limit, 10);
        const offset = parseInt(params.offset, 10);
        products = products.slice(offset, offset + limit);
      }
      
      return products;
    } else if (endpoint.match(/\/inventory\/products\/[a-zA-Z0-9-]+$/) && method === 'GET') {
      // Récupérer un produit par ID
      const id = endpoint.split('/').pop();
      return this.mockData.inventory.products.find(p => p.id === id) || null;
    } else if (endpoint === '/inventory/categories' && method === 'GET') {
      return this.mockData.inventory.categories;
    } else if (endpoint === '/inventory/operations' && method === 'GET') {
      // Filtrer les opérations si des paramètres sont fournis
      let operations = [...this.mockData.inventory.operations];
      
      if (params?.startDate) {
        operations = operations.filter(o => 
          new Date(o.date) >= new Date(params.startDate)
        );
      }
      
      if (params?.endDate) {
        operations = operations.filter(o => 
          new Date(o.date) <= new Date(params.endDate)
        );
      }
      
      if (params?.type) {
        operations = operations.filter(o => o.type === params.type);
      }
      
      if (params?.status) {
        operations = operations.filter(o => o.status === params.status);
      }
      
      return operations;
    } else if (endpoint === '/inventory/locations' && method === 'GET') {
      return this.mockData.inventory.locations;
    }
    
    return {};
  }

  /**
   * Gère les endpoints de chat
   */
  private handleChatEndpoint(method: string, endpoint: string, data?: any): any {
    if (endpoint === '/chat/messages' && method === 'POST') {
      // Simuler une réponse en fonction du mode du chat
      const mode = data?.mode || 'NORMAL'; // Using string fallback instead of CHAT_MODES.NORMAL
      let responseData: {
        content?: string;
        data?: any;
        messageType?: string;
      } = {};
      
      if (mode === CHAT_MODES.ACCOUNTING) {
        responseData = this.mockData.chat.accountingResponse;
      } else if (mode === CHAT_MODES.INVENTORY) {
        responseData = this.mockData.chat.inventoryResponse;
      } else if (mode === CHAT_MODES.ANALYSIS) {
        responseData = this.mockData.chat.analysisResponse;
      } else {
        responseData = this.mockData.chat.normalResponse;
      }
      
      return {
        id: generateUniqueId(),
        text: responseData.content || '',
        type: 'assistant',
        timestamp: new Date().toISOString(),
        data: responseData.data || {},
        messageType: responseData.messageType || 'text',
        ...responseData
      };
    } else if (endpoint === '/chat/conversations' && method === 'GET') {
      return this.mockData.chat.conversations;
    } else if (endpoint.includes('/messages') && endpoint.includes('/validate') && method === 'POST') {
      // Simuler la validation d'une suggestion
      return {
        success: true,
        journalEntryId: data?.type === 'journal_entry' ? generateUniqueId() : undefined
      };
    }
    
    return {};
  }

  /**
   * Gère les endpoints de paiement
   */
  private handlePaymentEndpoint(method: string, endpoint: string, data?: any): any {
    if (endpoint === '/payments/subscriptions' && method === 'GET') {
      return this.mockData.payment.subscriptions;
    } else if (endpoint === '/payments/subscription-plans' && method === 'GET') {
      return this.mockData.payment.subscriptionPlans;
    } else if (endpoint === '/payments/payment-methods' && method === 'GET') {
      return this.mockData.payment.paymentMethods;
    } else if (endpoint === '/payments/invoices' && method === 'GET') {
      return this.mockData.payment.invoices;
    } else if (endpoint === '/payments/transactions' && method === 'GET') {
      return this.mockData.payment.transactions;
    } else if (endpoint === '/payments/account-status' && method === 'GET') {
      return this.mockData.payment.accountStatus;
    }
    
    return {};
  }

  /**
   * Gère les endpoints du tableau de bord
   */
  private handleDashboardEndpoint(method: string, endpoint: string, data?: any, params?: Record<string, any>): any {
    if (endpoint === '/dashboard/layouts' && method === 'GET') {
      return this.mockData.dashboard.layouts;
    } else if (endpoint.match(/\/dashboard\/layouts\/[a-zA-Z0-9-]+$/) && method === 'GET') {
      // Récupérer une disposition du tableau de bord par ID
      const id = endpoint.split('/').pop();
      return this.mockData.dashboard.layouts.find(l => l.id === id) || null;
    } else if (endpoint.includes('/widgets') && endpoint.includes('/data') && method === 'POST') {
      // Simuler la récupération des données d'un widget
      return this.mockData.dashboard.widgetData;
    } else if (endpoint === '/dashboard/metrics/business' && method === 'POST') {
      return this.mockData.dashboard.businessMetrics;
    } else if (endpoint === '/dashboard/metrics/sales' && method === 'POST') {
      return this.mockData.dashboard.salesMetrics;
    } else if (endpoint === '/dashboard/metrics/financial' && method === 'POST') {
      return this.mockData.dashboard.financialMetrics;
    } else if (endpoint === '/dashboard/metrics/inventory' && method === 'POST') {
      return this.mockData.dashboard.inventoryMetrics;
    } else if (endpoint.includes('/charts/') && method === 'POST') {
      // Simuler la récupération des données d'un graphique
      return this.mockData.dashboard.chartData;
    } else if (endpoint === '/dashboard/alerts' && method === 'GET') {
      return this.mockData.dashboard.alerts;
    }
    
    return {};
  }

  /**
   * Gère les endpoints utilisateur
   */
  private handleUserEndpoint(method: string, endpoint: string, data?: any, params?: Record<string, any>): any {
    if (endpoint === '/users/me' && method === 'GET') {
      return this.mockData.user.currentUser;
    } else if (endpoint === '/users/me' && method === 'PUT') {
      return {
        ...this.mockData.user.currentUser,
        ...data
      };
    } else if (endpoint === '/companies/current' && method === 'GET') {
      return this.mockData.user.currentCompany;
    } else if (endpoint === '/users/team' && method === 'GET') {
      return this.mockData.user.teamMembers;
    } else if (endpoint === '/users/roles' && method === 'GET') {
      return this.mockData.user.roles;
    } else if (endpoint === '/users/me/activity' && method === 'GET') {
      const limit = params?.limit || 20;
      const offset = params?.offset || 0;
      return this.mockData.user.userActivity.slice(offset, offset + limit);
    } else if (endpoint === '/users/me/notifications' && method === 'GET') {
      const limit = params?.limit || 20;
      const offset = params?.offset || 0;
      let notifications = [...this.mockData.user.notifications];
      
      if (params?.unreadOnly) {
        notifications = notifications.filter(n => !n.read);
      }
      
      return notifications.slice(offset, offset + limit);
    }
    
    return {};
  }

  /**
   * Simule l'ajout d'une action à la file d'attente hors ligne
   */
  async mockOfflineAction(
    type: OfflineActionType, 
    endpoint: string, 
    data?: any
  ): Promise<{ id: string; _offlineAction: true }> {
    logger.debug("Ajout d'une action hors ligne simulée", { type, endpoint, data });
    
    return {
      id: generateUniqueId(),
      _offlineAction: true
    };
  }

  /**
   * Simule la synchronisation des données hors ligne
   */
  async mockSyncOfflineQueue(): Promise<boolean> {
    logger.debug("Synchronisation simulée de la file d'attente hors ligne");
    return true;
  }
}

export default new MockApiService();