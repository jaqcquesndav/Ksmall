/**
 * Export centralisé des services API
 * 
 * Ce fichier agit comme un point d'accès unifié pour tous les services API
 * de l'application, ce qui facilite l'importation et l'utilisation de ces
 * services dans les différents composants de l'application.
 */

// Services API principaux
import ApiService from './ApiService';
import MockApiService from './MockApiService';

// Services API fonctionnels
import AuthApiService from './auth/AuthApiService';
import AccountingApiService from './accounting/AccountingApiService';
import InventoryApiService from './inventory/InventoryApiService';
import ChatApiService from './chat/ChatApiService';
import PaymentApiService from './payment/PaymentApiService';
import DashboardApiService from './dashboard/DashboardApiService';
import UserApiService from './user/UserApiService';

// Configurations
import { API_CONFIG, ApiError, isOnline, canConnectToBackend } from './config/apiConfig';

// Types exportés
export * from './auth/AuthApiService';
export * from './accounting/AccountingApiService';
export * from './inventory/InventoryApiService';
export * from './chat/ChatApiService';
export * from './payment/PaymentApiService';
export * from './dashboard/DashboardApiService';
export * from './user/UserApiService';

/**
 * Expose tous les services API
 */
const API = {
  // Services principaux
  core: ApiService,
  mock: MockApiService,
  
  // Services fonctionnels
  auth: AuthApiService,
  accounting: AccountingApiService,
  inventory: InventoryApiService,
  chat: ChatApiService,
  payment: PaymentApiService,
  dashboard: DashboardApiService,
  user: UserApiService,
  
  // Utilitaires
  config: API_CONFIG,
  isOnline,
  canConnectToBackend,
  
  // Erreur personnalisée
  ApiError
};

export default API;