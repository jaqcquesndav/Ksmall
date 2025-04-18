import { API } from './API';
import logger from '../utils/logger';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
  recommended?: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'canceled';
  autoRenew: boolean;
}

class SubscriptionService {
  /**
   * Récupère les plans d'abonnement disponibles
   */
  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await API.get('/subscriptions/plans');
      return response.data;
    } catch (error) {
      logger.error('Erreur lors du chargement des plans d\'abonnement:', error);
      throw new Error('Impossible de charger les plans d\'abonnement');
    }
  }

  /**
   * Récupère l'abonnement actuel de l'utilisateur
   */
  async getCurrentSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const response = await API.get(`/users/${userId}/subscription`);
      return response.data;
    } catch (error) {
      logger.error('Erreur lors du chargement de l\'abonnement:', error);
      return null;
    }
  }

  /**
   * Initie le processus de paiement pour un abonnement
   */
  async initiatePayment(planId: string, paymentMethod: string): Promise<string> {
    try {
      const response = await API.post('/subscriptions/payment/initiate', {
        planId,
        paymentMethod
      });
      return response.data.paymentUrl;
    } catch (error) {
      logger.error('Erreur lors de l\'initiation du paiement:', error);
      throw new Error('Impossible d\'initialiser le paiement');
    }
  }

  /**
   * Vérifie le code de paiement pour la méthode de paiement manuelle
   */
  async verifyPaymentCode(planId: string, code: string, proof: any): Promise<boolean> {
    try {
      // Création d'un FormData pour l'envoi du fichier
      const formData = new FormData();
      formData.append('planId', planId);
      formData.append('code', code);
      
      if (proof) {
        const fileUri = proof.uri || proof.assets?.[0]?.uri;
        const fileName = proof.name || proof.assets?.[0]?.name || fileUri.split('/').pop();
        const fileType = proof.mimeType || proof.assets?.[0]?.mimeType || 'application/octet-stream';
        
        formData.append('proof', {
          uri: fileUri,
          name: fileName,
          type: fileType
        } as any);
      }
      
      const response = await API.post('/subscriptions/payment/verify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      return response.data.success;
    } catch (error) {
      logger.error('Erreur lors de la vérification du paiement:', error);
      throw new Error('Impossible de vérifier le paiement');
    }
  }

  /**
   * Annule un abonnement
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await API.post(`/subscriptions/${subscriptionId}/cancel`);
      return true;
    } catch (error) {
      logger.error('Erreur lors de l\'annulation de l\'abonnement:', error);
      return false;
    }
  }
}

export default new SubscriptionService();