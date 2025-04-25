/**
 * Types relatifs aux paramètres de l'application
 */

/**
 * Interface pour les paramètres d'application
 */
export interface AppSettings {
  general: GeneralSettings;
  accounting: AccountingSettings;
  inventory: InventorySettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  display: DisplaySettings;
  integrations: IntegrationSettings[];
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
 * Interface pour les paramètres comptables
 */
export interface AccountingSettings {
  accountingMethod: 'cash' | 'accrual';
  chartOfAccounts: 'standard' | 'syscohada' | 'custom';
  automaticReconciliation: boolean;
  taxSettings: {
    taxEnabled: boolean;
    vatRate: number;
    otherTaxes: {
      id: string;
      name: string;
      rate: number;
      isDefault: boolean;
    }[];
  };
  journalSettings: {
    requireApproval: boolean;
    allowDrafts: boolean;
    autoNumbering: boolean;
    numberingPrefix: string;
    numberingFormat: string;
  };
  reportSettings: {
    preferredReportBasis: 'cash' | 'accrual';
    defaultPeriod: 'month' | 'quarter' | 'year';
    includeZeroBalanceAccounts: boolean;
  };
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