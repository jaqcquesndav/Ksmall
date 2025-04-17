import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import logger from '../utils/logger';
import ApiService from './ApiService';
import { useAuth } from '../context/AuthContext';

// Clés pour le stockage local
const TOKEN_BALANCE_KEY = 'tokens.balance';
const TOKEN_HISTORY_KEY = 'tokens.history';

export interface TokenPlan {
  id: string;
  tokens: number;
  price: number;
  label: string;
}

export interface TokenTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'purchase' | 'usage';
  description: string;
}

/**
 * Service pour gérer les tokens (crédits) dans l'application
 */
class TokenService {
  /**
   * Récupère les plans de tokens disponibles
   */
  async getTokenPlans(): Promise<TokenPlan[]> {
    try {
      const response = await ApiService.get('/tokens/plans');
      return response.data.plans;
    } catch (error) {
      logger.error('Erreur lors de la récupération des plans de tokens:', error);
      // En cas d'erreur, on renvoie des plans par défaut
      return [
        { id: 'plan1', tokens: 500000, price: 10000, label: 'Basic' },
        { id: 'plan2', tokens: 1000000, price: 18000, label: 'Standard' },
        { id: 'plan3', tokens: 2500000, price: 40000, label: 'Premium' },
        { id: 'plan4', tokens: 5000000, price: 75000, label: 'Enterprise' }
      ];
    }
  }

  /**
   * Récupère le solde de tokens actuel de l'utilisateur
   */
  async getTokenBalance(): Promise<number> {
    try {
      const response = await ApiService.get('/tokens/balance');
      return response.data.balance;
    } catch (error) {
      logger.error('Erreur lors de la récupération du solde de tokens:', error);
      // Vérifier si nous sommes en mode démo - utiliser AsyncStorage directement
      const isDemo = await AsyncStorage.getItem('isDemo') === 'true';
      // Renvoyer une valeur par défaut
      return isDemo ? 1000000 : 0;
    }
  }

  /**
   * Vérifie et finalise un achat de tokens
   */
  async verifyTokenPurchase(
    planId: string, 
    tokenAmount: number, 
    verificationCode: string,
    proofDocument?: any
  ): Promise<boolean> {
    try {
      // Si proofDocument est fourni, télécharger d'abord le document de preuve
      let documentId = null;
      if (proofDocument) {
        const formData = new FormData();
        formData.append('file', {
          uri: proofDocument.uri,
          type: proofDocument.mimeType || 'application/octet-stream',
          name: proofDocument.name || 'payment_proof'
        } as any);
        
        const uploadResponse = await ApiService.post('/uploads/payment-proof', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        documentId = uploadResponse.data.documentId;
      }

      // Ensuite vérifier le code et finaliser l'achat
      const response = await ApiService.post('/tokens/purchase/verify', {
        planId,
        tokenAmount,
        verificationCode,
        documentId
      });
      
      return response.data.success === true;
    } catch (error) {
      logger.error('Erreur lors de la vérification de l\'achat de tokens:', error);
      return false;
    }
  }

  /**
   * Initie un achat de tokens avec la méthode de paiement spécifiée
   */
  async initiateTokenPurchase(
    planId: string,
    tokenAmount: number,
    paymentMethod: string
  ): Promise<{ success: boolean; redirectUrl?: string; reference?: string }> {
    try {
      const response = await ApiService.post('/tokens/purchase/initiate', {
        planId,
        tokenAmount,
        paymentMethod
      });
      
      return {
        success: true,
        redirectUrl: response.data.redirectUrl,
        reference: response.data.reference
      };
    } catch (error) {
      logger.error('Erreur lors de l\'initiation de l\'achat de tokens:', error);
      return { success: false };
    }
  }

  /**
   * Récupère l'historique des transactions de tokens
   */
  async getTokenTransactionHistory(page = 1, limit = 10): Promise<any> {
    try {
      const response = await ApiService.get(`/tokens/transactions?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'historique des transactions:', error);
      // Renvoyer des données de démo en cas d'erreur
      return {
        transactions: [
          { id: 'tx1', date: new Date().toISOString(), tokens: 500000, type: 'purchase', status: 'completed' },
          { id: 'tx2', date: new Date(Date.now() - 86400000).toISOString(), tokens: -50000, type: 'usage', status: 'completed' }
        ],
        total: 2,
        page: 1,
        limit: 10
      };
    }
  }
}

export default new TokenService();