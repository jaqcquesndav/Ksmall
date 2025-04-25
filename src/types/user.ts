import { User } from './auth';

/**
 * Interface étendue pour un profil utilisateur complet
 * Compatible avec les APIs et les composants UI
 */
export interface UserProfile extends User {
  // Champs supplémentaires au-delà de User de base
  department?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  timezone?: string;
  // Note: 'language' est déjà dans User
  avatar?: string; // Équivalent à photoURL dans User, mais utilisé par les APIs
  preferences?: Record<string, any>;
  role?: string;
  permissions?: string[];
}

/**
 * Interface pour les données d'une entreprise
 */
export interface Company {
  id: string;
  name: string;
  legalName?: string;
  taxId?: string;
  registrationNumber?: string;
  industry?: string;
  size?: string;
  foundedYear?: number;
  website?: string;
  logo?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface pour un membre de l'équipe
 */
export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: string;
  permissions: string[];
  status: 'active' | 'invited' | 'inactive';
  invitedAt?: string;
  joinedAt?: string;
  lastActiveAt?: string;
}

/**
 * Interface pour une notification utilisateur
 */
export interface UserNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  data?: any;
}

/**
 * Interface pour une activité utilisateur
 */
export interface UserActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

/**
 * Interface pour un rôle système
 */
export interface SystemRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}