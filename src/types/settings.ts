/**
 * Types relatifs aux paramètres de l'application
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';

/******************************************************************************
 * TYPES UI POUR LES COMPOSANTS DES PARAMÈTRES
 ******************************************************************************/

/**
 * Type pour les noms d'icônes valides
 */
export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/**
 * Interface pour les props du composant SettingsSection
 */
export interface SettingsSectionProps {
  title: string;
  theme: any;
  children: React.ReactNode;
}

/**
 * Interface pour les props du composant SettingsItem
 */
export interface SettingsItemProps {
  title: string;
  subtitle?: string;
  icon: IconName;
  onPress?: () => void;
  value?: string;
  showChevron?: boolean;
  disabled?: boolean;
}

/**
 * Interface pour les props du composant ProfileHeader
 */
export interface ProfileHeaderProps {
  name: string;
  businessName: string;
  profileImage?: string | null;
  theme: any;
  onImageChange?: (uri: string) => void;
  onEditProfilePress: () => void;
}

/******************************************************************************
 * PARAMÈTRES GÉNÉRAUX DE L'APPLICATION
 ******************************************************************************/

/**
 * Interface pour les paramètres d'application
 */
export interface AppSettings {
  general: GeneralSettings;
  security: SecuritySettings;
  display: DisplaySettings;
  notifications: NotificationSettings;
  backups: BackupSettings;
}

/**
 * Interface pour les paramètres généraux
 */
export interface GeneralSettings {
  language: string;
  timeZone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: {
    code: string;
    symbol: string;
    position: 'before' | 'after';
    decimalPlaces: number;
    thousandsSeparator: string;
    decimalSeparator: string;
  };
  fiscalYearStart: {
    month: number;
    day: number;
  };
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.
}

/**
 * Interface pour les paramètres de sécurité
 */
export interface SecuritySettings {
  twoFactorAuth: {
    enabled: boolean;
    method: 'app' | 'sms' | 'email';
  };
  sessionTimeout: number; // minutes
  requirePasswordChange: number; // days
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  ipRestrictions: {
    enabled: boolean;
    allowedIps: string[];
  };
  activityLogging: {
    enabled: boolean;
    logLevel: 'basic' | 'detailed';
    retentionPeriod: number; // days
  };
}

/**
 * Interface pour les paramètres d'affichage
 */
export interface DisplaySettings {
  theme: 'light' | 'dark' | 'system';
  density: 'comfortable' | 'compact';
  fontSize: 'small' | 'medium' | 'large';
  colorScheme: string;
  dashboardLayout: {
    columns: number;
    defaultWidgets: string[];
  };
  mobileSettings: {
    enableGestures: boolean;
    compactMode: boolean;
  };
}

/**
 * Interface pour les paramètres de notification
 */
export interface NotificationSettings {
  email: {
    enabled: boolean;
    lowStock: boolean;
    accountingAlerts: boolean;
    financialReports: boolean;
    security: boolean;
    frequency: 'realtime' | 'daily' | 'weekly';
  };
  push: {
    enabled: boolean;
    lowStock: boolean;
    accountingAlerts: boolean;
    tasks: boolean;
    security: boolean;
  };
  inApp: {
    enabled: boolean;
    showBadges: boolean;
    soundEnabled: boolean;
  };
}

/**
 * Interface pour une intégration
 */
export interface IntegrationSettings {
  id: string;
  provider: string;
  type: 'payment' | 'accounting' | 'ecommerce' | 'banking' | 'other';
  name: string;
  enabled: boolean;
  credentials: Record<string, any>;
  settings: Record<string, any>;
  status: 'active' | 'error' | 'pending';
  lastSynced?: string;
}

/**
 * Interface pour les paramètres de sauvegarde
 */
export interface BackupSettings {
  autoBackup: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  timeOfDay: string; // HH:MM format
  retentionCount: number;
  backupLocation: 'cloud' | 'local' | 'both';
  encryptBackups: boolean;
  includeAttachments: boolean;
  lastBackup?: {
    date: string;
    size: number;
    status: 'success' | 'failed';
  };
}

/**
 * Interface pour une préférence utilisateur
 */
export interface UserPreference {
  key: string;
  value: any;
  userId: string;
  scope: 'global' | 'module';
  module?: string;
  updatedAt: string;
}

/******************************************************************************
 * PARAMÈTRES SPÉCIFIQUES À LA COMPTABILITÉ
 ******************************************************************************/

/**
 * Interface pour les paramètres comptables 
 */
export interface AccountingSettings {
  // Configuration générale de la comptabilité
  accountingMethod: 'cash' | 'accrual';
  chartOfAccounts: {
    type: 'standard' | 'syscohada' | 'custom';
    customization: {
      enabled: boolean;
      allowAccountAddition: boolean;
      allowAccountDeletion: boolean;
      requireAccountCodes: boolean;
    };
  };
  
  // Devise et format de nombres
  currency: {
    code: string;
    displayFormat: string;
    exchangeRateProvider?: string;
    automaticRateUpdate: boolean;
    rateUpdateFrequency: 'daily' | 'weekly' | 'monthly' | 'manual';
    lastRateUpdate?: string;
  };
  
  // Configuration des exercices fiscaux
  fiscalYear: {
    startMonth: number; // 1-12
    startDay: number; // 1-31
    currentFiscalYear: string;
    lockPeriodAfter: number; // jours après la fin de la période
    requirePeriodClosing: boolean;
    autoCreateNextYear: boolean;
  };
  
  // Taxes
  taxSettings: TaxSettings;
  
  // Journaux comptables
  journalSettings: JournalSettings;
  
  // Rapports financiers
  reportSettings: ReportSettings;
  
  // Sauvegarde et exportation de données
  dataManagement: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    exportFormats: ('csv' | 'xlsx' | 'pdf' | 'json')[];
    defaultImportFormat: 'csv' | 'xlsx' | 'json';
    dataSeparation: 'fiscal_year' | 'calendar_year' | 'none';
  };
}

/**
 * Interface pour les paramètres de taxe
 */
export interface TaxSettings {
  taxEnabled: boolean;
  defaultVatRate: number;
  taxes: Tax[];
  requireTaxOnTransactions: boolean;
  allowExemptions: boolean;
  showTaxBreakdown: boolean;
  defaultTaxId?: string;
}

/**
 * Interface pour une taxe
 */
export interface Tax {
  id: string;
  name: string;
  code: string;
  rate: number;
  isDefault: boolean;
  isActive: boolean;
  accountingAccountCode?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Interface pour les paramètres de journal
 */
export interface JournalSettings {
  requireApproval: boolean;
  allowDrafts: boolean;
  autoNumbering: boolean;
  numberingPrefix: string;
  numberingFormat: string;
  enforceBalanceCheck: boolean;
  requiredEntryFields: {
    reference: boolean;
    description: boolean;
    supportingDocument: boolean;
  };
  autoReversal: {
    enabled: boolean;
    reversalText: string;
  };
}

/**
 * Interface pour les paramètres de rapports
 */
export interface ReportSettings {
  preferredReportBasis: 'cash' | 'accrual';
  defaultPeriod: 'month' | 'quarter' | 'year';
  includeZeroBalanceAccounts: boolean;
  dateFormat: string;
  currencyFormat: string;
  pageSettings: {
    orientation: 'portrait' | 'landscape';
    paperSize: 'a4' | 'letter' | 'legal';
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
  companyInfoDisplay: {
    companyName: boolean;
    companyLogo: boolean;
    companyAddress: boolean;
    taxId: boolean;
    contactInfo: boolean;
  };
  defaultReports: string[]; // IDs des rapports favoris/par défaut
}

/**
 * Interface pour les paramètres d'inventaire
 */
export interface InventorySettings {
  valuationMethod: 'FIFO' | 'LIFO' | 'weighted_average';
  trackSerialNumbers: boolean;
  trackBatchNumbers: boolean;
  trackExpiryDates: boolean;
  lowStockThreshold: {
    type: 'fixed' | 'percentage';
    value: number;
  };
  autoGeneratePurchaseOrders: boolean;
  defaultLocation: string;
  allowNegativeStock: boolean;
  barcodeSettings: {
    format: 'CODE128' | 'CODE39' | 'EAN13' | 'UPC' | 'QR';
    autoGenerate: boolean;
    prefix: string;
  };
}